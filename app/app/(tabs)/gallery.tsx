import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/shared/ThemeContext';
import { GalleryGrid } from '@/features/gallery/GalleryGrid';
import { MainHeader } from '@/shared/components/MainHeader';
import { StatusIcon } from '@/shared/components/StatusIcon';
import { useSelectionStore } from '@/shared/store/useSelectionStore';
import { BatchActionBar } from '@/shared/components/BatchActionBar';
import { logger } from '@/shared/LogService';
import { FindRecord } from '@/shared/types';
import * as firestoreService from '@/shared/firestoreService';

export default function GalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { isSelectionMode, selectedIds, exitSelectionMode } = useSelectionStore();

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    handleRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  }, [handleRefresh]);

  const openDetail = (item: FindRecord) => {
    logger.add('nav', 'Opened detail view', { id: item.id });
    router.push({ pathname: '/detail/[id]', params: { id: item.id } });
  };

  const handleBatchDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    Alert.alert(
      'Delete Items',
      `Delete ${count} item${count > 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                Array.from(selectedIds).map(id =>
                  firestoreService.deleteFind(id),
                ),
              );
              exitSelectionMode();
              handleRefresh();
              logger.add('user', `Deleted ${count} items`);
            } catch (error) {
              logger.error('Batch delete failed', error);
              Alert.alert('Error', 'Failed to delete some items');
            }
          },
        },
      ],
    );
  };

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
          <View style={styles.galleryHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <StatusIcon
                status="polished"
                category="fossil"
                size={24}
                theme={mode === 'high-contrast' ? 'beach' : 'journal'}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Gallery</Text>
            </View>
          </View>
          <GalleryGrid refreshKey={refreshKey} onSelect={openDetail} />
        </View>
      </ScrollView>

      {/* Floating Batch Action Bar */}
      {isSelectionMode && (
        <View style={[styles.floatingActionBar, { paddingBottom: insets.bottom + 10, backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <BatchActionBar
            onPoster={() => Alert.alert('Poster', 'Batch poster coming soon')}
            onDelete={handleBatchDelete}
          />
        </View>
      )}
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  galleryHeader: {
    marginBottom: 8,
    gap: 8,
  },
  floatingActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
