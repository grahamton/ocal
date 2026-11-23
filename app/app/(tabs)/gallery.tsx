import React, {useCallback, useState} from 'react';
import {View, StyleSheet, RefreshControl, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {useTheme} from '@/shared/ThemeContext';
import {GalleryGrid} from '@/features/gallery/GalleryGrid';
import {MainHeader} from '@/shared/components/MainHeader';
import {StatusIcon} from '@/shared/components/StatusIcon';
import {logger} from '@/shared/LogService';
import {FindRecord} from '@/shared/types';

export default function GalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, mode} = useTheme();
  const {sessionId} = useLocalSearchParams<{sessionId?: string}>();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const openDetail = (item: FindRecord) => {
    logger.add('nav', 'Opened detail view', {id: item.id});
    router.push(`/detail/${item.id}`);
  };

  return (
    <View style={[styles.safe, {paddingTop: insets.top}]}>
      <GalleryGrid
        refreshKey={refreshKey}
        onSelect={openDetail}
        initialSessionId={sessionId || null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <>
            <MainHeader />
            <View style={styles.galleryHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <StatusIcon
                  status="polished"
                  category="fossil"
                  size={24}
                  theme={mode === 'high-contrast' ? 'beach' : 'journal'}
                />
                <Text style={[styles.sectionTitle, {color: colors.text}]}>My Rocks</Text>
              </View>
            </View>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1},
  sectionTitle: {fontSize: 22, fontWeight: '700'},
  galleryHeader: {marginBottom: 8, gap: 8},
});
