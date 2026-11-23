import React, {useCallback, useState} from 'react';
import {View, StyleSheet, RefreshControl} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {useTheme} from '@/shared/ThemeContext';
import {GalleryGrid} from '@/features/gallery/GalleryGrid';
import {MainHeader} from '@/shared/components/MainHeader';
import {logger} from '@/shared/LogService';
import {FindRecord} from '@/shared/types';

export default function GalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={<MainHeader title="My Rocks" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1},
});
