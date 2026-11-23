import {useEffect, useRef, useState} from 'react';
import {
  LayoutChangeEvent,
  Text,
  TouchableOpacity,
  View,
  Vibration,
  Animated,
  Easing,
} from 'react-native';
import {CameraView, useCameraPermissions} from 'expo-camera';
import * as Location from 'expo-location';
import * as localDb from '@/shared/localDb';
import * as storageService from '@/shared/storageService';
import {createId} from '@/shared/id';
import {FindRecord} from '@/shared/types';
import {useSession} from '@/shared/SessionContext';
import {logger} from '@/shared/LogService';
import {useTheme} from '@/shared/ThemeContext';
import {classes} from './CameraCapture.styles';

type Props = {
  onSaved: () => void;
};

export function CameraCapture({onSaved}: Props) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<'info' | 'success' | 'error'>(
    'info',
  );
  const {activeSession, startSession, addFindToActiveSession} = useSession();

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

  useEffect(() => {
    // Proactively request location permission on mount to avoid blocking the capture flow
    (async () => {
      try {
        const {status} = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          logger.add('system', 'Requesting location permissions on mount...');
          await Location.requestForegroundPermissionsAsync();
        }
      } catch (err) {
        logger.error('Failed to request location permission on mount', err);
      }
    })();
  }, []);

  const {colors} = useTheme();
  // Largest 3:4 (portrait) box that fits the space, matching the saved photo.
  const [box, setBox] = useState<{width: number; height: number} | null>(null);
  const onPreviewLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    const w = Math.min(width, (height * 3) / 4);
    setBox({width: w, height: (w * 4) / 3});
  };

  const getLocation = async () => {
    logger.add('capture', 'getLocation: checking permissions...');
    try {
      const {status} = await Location.getForegroundPermissionsAsync();
      logger.add('capture', `getLocation: permissions status = ${status}`);
      if (status !== 'granted') {
        logger.add('capture', 'getLocation: permission not granted, skipping location');
        return null;
      }
    } catch (err) {
      logger.error('getLocation: permissions check failed', err);
      return null;
    }
    logger.add('capture', 'getLocation: getting last known position...');
    try {
      const last = await Location.getLastKnownPositionAsync();
      logger.add('capture', `getLocation: last known position = ${last ? 'found' : 'not found'}`);
      if (last) return last;
    } catch (err) {
      logger.error('getLocation: last known position check failed', err);
    }
    logger.add('capture', 'getLocation: getting current position with timeout 3s...');
    try {
      // expo-location has no timeout option; race it so a slow GPS fix
      // can't hold up saving the photo.
      const current = await Promise.race([
        Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Balanced}),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 3000)),
      ]);
      logger.add('capture', 'getLocation: current position retrieved');
      return current;
    } catch (err) {
      logger.error('getLocation: getCurrentPositionAsync failed or timed out', err);
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
      logger.add('capture', 'Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        // High enough to zoom in on banding and cracks; Ranger Al gets a
        // resized copy, so this only affects the photo kept on the phone.
        quality: 0.85,
        skipProcessing: true,
      });

      if (!photo) throw new Error('No photo captured');

      // Show thumbnail for animation
      setCapturedUri(photo.uri);
      animateFlyAway();

      setStatusMessage('Uploading...');
      logger.add('capture', 'Saving photo...');
      const downloadURL = await storageService.uploadImage(photo.uri);

      setStatusMessage('Saving Find...');
      logger.add('capture', 'Saving find: starting session check...');

      let session;
      try {
        session = activeSession ?? (await startSession());
        logger.add('capture', `Saving find: session ID = ${session.id}`);
      } catch (sessErr) {
        logger.error('Failed to get/start session', sessErr);
        throw new Error('Session error. Please try starting a walk manually.');
      }

      logger.add('capture', 'Saving find: requesting location...');
      const location = await getLocation();
      logger.add('capture', `Saving find: location retrieved = ${location ? 'yes' : 'no'}`);

      const id = createId();
      const record: FindRecord = {
        id,
        photoUri: downloadURL,
        lat: location?.coords.latitude ?? null,
        long: location?.coords.longitude ?? null,
        timestamp: new Date().toISOString(),
        note: null,
        category: null,
        label: null,
        status: 'draft',
        sessionId: session.id,
        favorite: false,
      };

      logger.add('capture', 'Saving find: calling addFind...');
      await localDb.addFind(record);
      logger.add('capture', 'Saving find: addFind completed');

      logger.add('capture', 'Saving find: calling addFindToActiveSession...');
      await addFindToActiveSession(record.id, session.id);
      logger.add('capture', 'Saving find: addFindToActiveSession completed');

      setStatusKind('success');
      setStatusMessage('Saved!');
      // Second confirmation vibration
      Vibration.vibrate(50);

      // Small delay before clearing status to let user see 'Saved!'
      setTimeout(() => {
        onSaved();
      }, 500);
    } catch (error) {
      logger.error('Capture process failed', error);
      setStatusKind('error');
      setStatusMessage((error as Error).message || 'Error saving.');
      Vibration.vibrate([0, 200, 100, 200]); // Long error buzz
    } finally {
      setSaving(false);
      // Keep error messages visible longer
      setTimeout(
        () => setStatusMessage(null),
        statusKind === 'error' ? 5000 : 2000,
      );
    }
  };

  /* State for info box visibility - simplified for Senior Mode */
  // Info box removed

  if (!permission?.granted) {
    return (
      <View style={classes.permissionContainer}>
        <Text style={[classes.title, {color: colors.text}]}>
          Ocal needs your camera to photograph rocks
        </Text>
        <TouchableOpacity
          style={[classes.primaryButton, {backgroundColor: colors.accent}]}
          onPress={requestPermission}
          accessibilityRole="button">
          <Text style={classes.primaryButtonText}>Turn on camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={classes.wrapper}>
      <View style={classes.previewArea} onLayout={onPreviewLayout}>
        {box && (
          <View style={[classes.cameraBox, box]}>
            <CameraView ref={cameraRef} style={classes.camera} facing="back" ratio="4:3" />
            <View style={classes.hint} pointerEvents="none">
              <Text style={classes.hintText}>Fill the frame with your rock</Text>
            </View>
            <Animated.View
              style={[classes.flashOverlay, {opacity: flashOpacity}]}
              pointerEvents="none"
            />
            {capturedUri && (
              <Animated.Image
                source={{uri: capturedUri}}
                style={[
                  classes.flyAwayThumbnail,
                  {
                    transform: [
                      {translateX: thumbnailTranslateX},
                      {translateY: thumbnailTranslateY},
                      {scale: thumbnailScale},
                    ],
                  },
                ]}
              />
            )}
          </View>
        )}
      </View>

      <View style={classes.shutterBar}>
        <TouchableOpacity
          style={[classes.captureButton, {borderColor: colors.text}]}
          onPress={handleCapture}
          activeOpacity={0.5}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Take photo">
          <View
            style={[classes.shutterInner, {backgroundColor: saving ? colors.border : colors.accent}]}
          />
        </TouchableOpacity>
        <Text style={[classes.captureLabel, {color: colors.text}]}>
          {saving ? 'Saving...' : 'Take photo'}
        </Text>
      </View>

      {statusMessage ? (
        <View
          style={[
            classes.statusBanner,
            statusKind === 'success' ? classes.statusSuccess : classes.statusError,
          ]}>
          <Text style={classes.statusText}>{statusMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}
