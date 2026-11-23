import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CameraCapture} from '@/features/capture/CameraCapture';
import {MainHeader} from '@/shared/components/MainHeader';
import {logger} from '@/shared/LogService';

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();

  // No scrolling here: the viewfinder fills whatever space the header and
  // tab bar leave, so the shutter is always in the same place.
  return (
    <View style={[styles.screen, {paddingTop: insets.top}]}>
      <MainHeader />
      <CameraCapture onSaved={() => logger.add('user', 'Captured photo')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, paddingHorizontal: 16, paddingBottom: 8},
});
