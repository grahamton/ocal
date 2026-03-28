import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/ThemeContext';
import { CameraCapture } from '@/features/capture/CameraCapture';
import { MainHeader } from '@/shared/components/MainHeader';
import { logger } from '@/shared/LogService';

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    // No specific refresh logic needed for capture yet
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={[styles.pageContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <MainHeader />
        <View style={styles.section}>
          <CameraCapture
            onSaved={() => {
              logger.add('user', 'Captured photo');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 16,
  },
});
