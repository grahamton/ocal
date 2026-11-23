import React from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {Gesture, GestureDetector, GestureHandlerRootView} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Props = {uri: string; visible: boolean; onClose: () => void};

const MIN = 1;
const MAX = 6;
const STEP = 1.75;

/**
 * Full-screen photo viewer for getting a close look at a rock.
 * Pinch or double-tap to zoom, drag to look around, and big +/- buttons
 * for anyone who finds pinching fiddly.
 */
export function PhotoViewer({uri, visible, onClose}: Props) {
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Keep the photo from being dragged completely off screen.
  const clamp = (v: number, s: number, size: number) => {
    'worklet';
    const limit = ((s - 1) * size) / 2;
    return Math.min(limit, Math.max(-limit, v));
  };

  const zoomTo = (next: number) => {
    'worklet';
    const s = Math.min(MAX, Math.max(MIN, next));
    scale.value = withTiming(s);
    savedScale.value = s;
    const nx = clamp(tx.value, s, width);
    const ny = clamp(ty.value, s, height);
    tx.value = withTiming(nx);
    ty.value = withTiming(ny);
    savedTx.value = nx;
    savedTy.value = ny;
  };

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.min(MAX, Math.max(MIN * 0.8, savedScale.value * e.scale));
    })
    .onEnd(() => zoomTo(scale.value));

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate(e => {
      tx.value = clamp(savedTx.value + e.translationX, scale.value, width);
      ty.value = clamp(savedTy.value + e.translationY, scale.value, height);
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => zoomTo(savedScale.value > 1.2 ? 1 : 2.5));

  const animated = useAnimatedStyle(() => ({
    transform: [{translateX: tx.value}, {translateY: ty.value}, {scale: scale.value}],
  }));

  const reset = () => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={close} statusBarTranslucent>
      <GestureHandlerRootView style={s.root}>
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
          <Animated.Image
            source={{uri}}
            resizeMode="contain"
            style={[{width, height}, animated]}
            accessibilityLabel="Photo of your find. Pinch or double-tap to zoom."
          />
        </GestureDetector>

        <TouchableOpacity
          style={[s.done, {top: insets.top + 12}]}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close photo">
          <Ionicons name="close" size={28} color="#fff" />
          <Text style={s.doneText}>Close</Text>
        </TouchableOpacity>

        <View style={[s.controls, {bottom: insets.bottom + 24}]}>
          <TouchableOpacity
            style={s.round}
            onPress={() => zoomTo(savedScale.value / STEP)}
            accessibilityRole="button"
            accessibilityLabel="Zoom out">
            <Ionicons name="remove" size={36} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.pill}
            onPress={() => zoomTo(1)}
            accessibilityRole="button"
            accessibilityLabel="Show whole photo">
            <Text style={s.pillText}>Whole photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.round}
            onPress={() => zoomTo(savedScale.value * STEP)}
            accessibilityRole="button"
            accessibilityLabel="Zoom in">
            <Ionicons name="add" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center'},
  done: {
    position: 'absolute',
    right: 16,
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 2,
    borderColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneText: {color: '#fff', fontSize: 20, fontWeight: '700'},
  controls: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  round: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    minHeight: 72,
    paddingHorizontal: 22,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
  },
  pillText: {color: '#fff', fontSize: 18, fontWeight: '700'},
});
