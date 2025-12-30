import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Vibration, Animated, Easing } from 'react-native';
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

  // Animations
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const thumbnailScale = useRef(new Animated.Value(0)).current;
  const thumbnailTranslateY = useRef(new Animated.Value(0)).current;
  const thumbnailTranslateX = useRef(new Animated.Value(0)).current;
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const classes = useMemo(() => createStyles(), []);

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
      if (status !== 'granted') return null;
    } catch {
      return null;
    }
    const last = await Location.getLastKnownPositionAsync();
    if (last) return last;
    try {
      return await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    } catch {
      return null;
    }
  };

  const triggerFlash = () => {
    flashOpacity.setValue(1);
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animateFlyAway = () => {
    thumbnailScale.setValue(1);
    thumbnailTranslateY.setValue(0);
    thumbnailTranslateX.setValue(0);

    Animated.parallel([
      Animated.timing(thumbnailScale, {
        toValue: 0.1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(thumbnailTranslateY, {
        toValue: 600, // Move down towards the tab bar
        duration: 800,
        easing: Easing.in(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(thumbnailTranslateX, {
        toValue: 100, // Slightly right towards the Inbox/Gallery tabs usually
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCapturedUri(null); // Hide after animation
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current || saving) return;
    setSaving(true);
    setStatusKind('info');
    setStatusMessage('Capturing...');

    // Tactile Feedback 1: Flash & Vibration
    triggerFlash();
    Vibration.vibrate([0, 80, 50, 80]); // "Heavy" double bump

    try {
      const session = activeSession ?? (await startSession());
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, skipProcessing: true });

      // Show thumbnail for animation
      setCapturedUri(photo.uri);
      animateFlyAway();

      const dir = await ensureDir();
      const id = createId();
      const fileUri = `${dir}/${id}.jpg`;

      // Async save in background while animation plays
      await FileSystem.copyAsync({ from: photo.uri, to: fileUri });

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

      await insertFind(record);
      await addFindToActiveSession(record.id, session.id);

      setStatusKind('success');
      setStatusMessage('Saved!');
      // Second confirmation vibration
      Vibration.vibrate(50);
      onSaved();
    } catch (error) {
      console.error('Capture error', error);
      setStatusKind('error');
      setStatusMessage('Error saving.');
      Vibration.vibrate([0, 200, 100, 200]); // Long error buzz
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  /* State for info box visibility - simplified for Senior Mode */
  // Info box removed


  if (!permission?.granted) {
    return (
      <View style={classes.permissionContainer}>
        <Text style={classes.title}>Camera Access Needed</Text>
        <TouchableOpacity style={classes.primaryButton} onPress={requestPermission}>
          <Text style={classes.primaryButtonText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={classes.wrapper}>
      {/* Flash Overlay */}
      <View style={classes.cameraContainer}>
        <CameraView ref={cameraRef} style={classes.camera} facing="back" />
        <Animated.View style={[classes.flashOverlay, { opacity: flashOpacity }]} pointerEvents="none" />

        {/* Fly-away Thumbnail */}
        {capturedUri && (
          <Animated.Image
            source={{ uri: capturedUri }}
            style={[
              classes.flyAwayThumbnail,
              {
                transform: [
                  { translateX: thumbnailTranslateX },
                  { translateY: thumbnailTranslateY },
                  { scale: thumbnailScale }
                ]
              }
            ]}
          />
        )}

        <View style={classes.captureZone}>
          <TouchableOpacity
            style={classes.captureButton}
            onPress={handleCapture}
            activeOpacity={0.5}
            disabled={saving}
          >
             <View style={classes.shutterInner} />
          </TouchableOpacity>
          <Text style={classes.captureLabel}>TAP TO CAPTURE</Text>
        </View>
      </View>

      {statusMessage ? (
        <View style={[classes.statusBanner, statusKind === 'success' ? classes.statusSuccess : classes.statusError]}>
          <Text style={classes.statusText}>{statusMessage}</Text>
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
    },
    cameraContainer: {
      height: 520, // Fixed large height (approx 80% screen on most devices)
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: '#1e293b',
      margin: 12,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.15)',
      position: 'relative',
    },
    camera: {
      flex: 1,
    },
    flashOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#fff',
      zIndex: 10,
    },
    flyAwayThumbnail: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      zIndex: 9,
    },
    captureZone: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)', // Slight dim for contrast
      zIndex: 12,
    },
    captureButton: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'transparent',
      borderWidth: 6,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10,
    },
    shutterInner: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#fff',
    },
    captureLabel: {
      color: '#fff',
      fontWeight: '800',
      fontFamily: 'Outfit_700Bold',
      marginTop: 8,
      fontSize: 14,
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    statusBanner: {
      position: 'absolute',
      top: 60,
      left: 20,
      right: 20,
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
    },
    statusSuccess: {
      backgroundColor: '#15803d', // Green-700
      borderWidth: 2,
      borderColor: '#4ade80',
    },
    statusError: {
      backgroundColor: '#b91c1c', // Red-700
      borderWidth: 2,
      borderColor: '#fca5a5',
    },
    statusText: {
      color: '#fff',
      fontSize: 24, // HUGE text
      fontWeight: '900',
      fontFamily: 'Outfit_800ExtraBold',
      textAlign: 'center',
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: 32,
      backgroundColor: '#000',
    },
    title: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '800',
      fontFamily: 'Outfit_800ExtraBold',
      marginBottom: 20,
      textAlign: 'center',
    },
    primaryButton: {
      backgroundColor: '#fff',
      paddingVertical: 20,
      paddingHorizontal: 32,
      borderRadius: 100,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#000',
      fontSize: 20,
      fontWeight: '700',
    },
  });
}
