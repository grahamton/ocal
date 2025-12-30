import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Vibration } from 'react-native';
import { CameraView, useCameraPermissions, CameraViewRef } from 'expo-camera';
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
  const cameraRef = useRef<CameraViewRef>(null);
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
      <View style={styles.infoBox}>
        <Text style={styles.title}>Quick snap, saves offline.</Text>
        <Text style={styles.description}>Tap once and it stores locally in case there is no signal. GPS is added when available.</Text>
      </View>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.captureText}>Snap</Text>}
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
      gap: 8,
    },
    infoBox: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: '#eef2ff',
      borderWidth: 1,
      borderColor: '#c7d2fe',
      gap: 6,
    },
    title: {
      color: '#0f172a',
      fontSize: 18,
      fontWeight: '800',
    },
    description: {
      color: '#0f172a',
      fontSize: 16,
      lineHeight: 22,
    },
    cameraContainer: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#000',
    },
    camera: {
      height: 320,
    },
    captureRow: {
      alignItems: 'center',
      paddingVertical: 12,
      backgroundColor: '#111',
    },
    captureButton: {
      width: 112,
      height: 112,
      borderRadius: 56,
      backgroundColor: '#111',
      borderWidth: 5,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    captureText: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '800',
    },
    statusText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '900',
      textAlign: 'center',
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: '#0f172a',
      minHeight: 64,
    },
    statusBannerSuccess: {
      backgroundColor: '#166534',
    },
    statusBannerError: {
      backgroundColor: '#b91c1c',
    },
    statusSpinner: {
      marginRight: 4,
    },
    statusRetry: {
      marginLeft: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#fff',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    statusRetryText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '800',
    },
    permissionContainer: {
      padding: 16,
      backgroundColor: '#fff',
      borderRadius: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    permissionText: {
      color: '#111',
      fontSize: 16,
    },
    primaryButton: {
      backgroundColor: '#111',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
