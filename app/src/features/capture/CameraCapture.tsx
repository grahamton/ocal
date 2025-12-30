import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
// Use legacy FileSystem API to avoid runtime errors in Expo 54 until the new API migration is done.
import * as FileSystem from 'expo-file-system/legacy';
import { insertFind } from '../../shared/db';
import { createId } from '../../shared/id';
import { FindRecord } from '../../shared/types';
import { useSession } from '../../shared/SessionContext';

type Props = {
  onSaved: () => void;
};

export function CameraCapture({ onSaved }: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<'info' | 'success' | 'error'>('info');
  const { activeSession, startSession, addFindToActiveSession } = useSession();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const readyToCapture = permission?.granted;

  const styles = useMemo(() => createStyles(), []);

  const ensureDir = async () => {
    const dir = `${FileSystem.documentDirectory}finds`;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }
    } catch (error) {
      console.warn('Location permission request failed', error);
      return null;
    }

    const last = await Location.getLastKnownPositionAsync();
    if (last) return last;

    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        // maximumAge not supported in new Expo Location type?
        // timeout: 4000,
      });
    } catch (error) {
      console.warn('Location lookup failed', error);
      return null;
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || saving) return;
    setSaving(true);
    setStatusKind('info');
    setStatusMessage('Capturing...');

    try {
      const session = activeSession ?? (await startSession());
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, skipProcessing: true });
      const dir = await ensureDir();
      const id = createId();
      const fileUri = `${dir}/${id}.jpg`;

      try {
        await FileSystem.copyAsync({ from: photo.uri, to: fileUri });
      } catch (error) {
        console.error('File save failed', error);
        setStatusKind('error');
        setStatusMessage('Could not save photo. Try again.');
        return;
      }

      setStatusKind('info');
      setStatusMessage('Grabbing location...');
      const location = await getLocation();


      const record: FindRecord = {
        id,
        photoUri: fileUri,
        lat: location?.coords.latitude ?? null,
        long: location?.coords.longitude ?? null,
        timestamp: new Date().toISOString(),
        synced: false,
        note: null,
        category: null,
        label: `Find ${new Date().toLocaleDateString()}`,
        status: 'draft',
        sessionId: session.id,
        favorite: false,
      };

      try {
        await insertFind(record);
        await addFindToActiveSession(record.id, session.id);
        const locationNote = location ? '' : ' (no GPS - still saved)';
        setStatusKind('success');
        setStatusMessage(`Saved offline${locationNote}`);
        Vibration.vibrate(50);
        onSaved();
      } catch (error) {
        console.error('Insert failed', error);
        setStatusKind('error');
        setStatusMessage("Couldn't save find. Try again.");
      }
    } catch (error) {
      console.error('Capture failed', error);
      setStatusKind('error');
      setStatusMessage('Could not save. Try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 8000);
    }
  };

  /* State for info box visibility */
  const [showInfo, setShowInfo] = useState(true);

  if (!readyToCapture) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>Ready to capture?</Text>
        <Text style={styles.permissionText}>We need camera access. You can change this later in Settings.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {showInfo ? (
        <View style={styles.infoBox}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Quick snap, saves offline.</Text>
              <Text style={styles.description}>Tap once and it stores locally in case there is no signal. GPS is added when available.</Text>
            </View>
            <TouchableOpacity onPress={() => setShowInfo(false)} style={styles.closeInfoBtn}>
               <Text style={styles.closeInfoText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={[styles.cameraContainer, !showInfo && { marginTop: 60 }]}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture} disabled={saving}>
            {saving ? <ActivityIndicator color="#0f172a" size="large" /> : <View style={styles.shutterInner} />}
          </TouchableOpacity>
        </View>
      </View>
      {statusMessage ? (
        <View
          style={[
            styles.statusBanner,
            statusKind === 'success' && styles.statusBannerSuccess,
            statusKind === 'error' && styles.statusBannerError,
          ]}
        >
          {saving ? <ActivityIndicator color="#fff" style={styles.statusSpinner} /> : null}
          <Text style={styles.statusText}>{statusMessage}</Text>
          {statusKind === 'error' ? (
            <TouchableOpacity style={styles.statusRetry} onPress={handleCapture} disabled={saving}>
              <Text style={styles.statusRetryText}>Try again</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: '#000',
      gap: 16,
    },
    infoBox: {
      position: 'absolute',
      top: 60,
      left: 16,
      right: 16,
      zIndex: 10,
      padding: 16,
      borderRadius: 16,
      backgroundColor: 'rgba(15, 23, 42, 0.8)', // Dark semi-transparent
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    title: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '800', // Extra bold for readability
      fontFamily: 'Outfit_800ExtraBold',
      marginBottom: 4,
    },
    description: {
      color: '#cbd5e1', // Slate-300
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'Outfit_400Regular',
    },
    cameraContainer: {
      height: 480, // Fixed height required inside ScrollView
      marginHorizontal: 16,
      marginTop: 120, // push down below info box
      marginBottom: 0,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: '#1e293b',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    camera: {
      flex: 1,
    },
    captureRow: {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      // No background here, letting camera show through or sitting below
    },
    captureButton: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: 'transparent',
      borderWidth: 6,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      // Inner circle simulated by padding/content
    },
    // Inner fill for shutter to make it look like a physical button
    shutterInner: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: '#fff',
    },
    captureText: {
      display: 'none', // Text inside shutter is hard to read; shape implies function
    },
    statusText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '800',
      fontFamily: 'Outfit_700Bold',
      textAlign: 'center',
    },
    statusBanner: {
      position: 'absolute',
      bottom: 140, // Above the shutter
      left: 20,
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 16,
      backgroundColor: '#0f172a',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    statusBannerSuccess: {
      backgroundColor: '#15803d', // Green-700
    },
    statusBannerError: {
      backgroundColor: '#b91c1c', // Red-700
    },
    statusSpinner: {
      marginRight: 4,
    },
    statusRetry: {
      marginLeft: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: 'rgba(0,0,0,0.2)',
    },
    statusRetryText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
      backgroundColor: '#000',
      gap: 20,
    },
    permissionText: {
      color: '#cbd5e1',
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 20,
    },
    primaryButton: {
      backgroundColor: '#fff',
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 100,
      alignItems: 'center',
      alignSelf: 'center',
    },
    primaryButtonText: {
      color: '#000',
      fontSize: 18,
      fontWeight: '700',
    },
    closeInfoBtn: {
      padding: 8,
      marginLeft: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
    },
    closeInfoText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
}
