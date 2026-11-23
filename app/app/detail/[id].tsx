import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/shared/ThemeContext';
import * as localDb from '@/shared/localDb';
import {FindRecord} from '@/shared/types';
import {FindDetailModal} from '@/features/detail/FindDetailModal';

export default function DetailScreen() {
  const {id} = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const [item, setItem] = useState<FindRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const unsubscribe = localDb.subscribeToFind(
        id as string,
        f => {
          setItem(f);
          setLoading(false);
        },
        error => {
          console.error('Failed to subscribe to find', error);
          setLoading(false);
        },
      );
      return () => unsubscribe();
    }
  }, [id]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {backgroundColor: colors.background, justifyContent: 'center'},
        ]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.background, paddingTop: insets.top},
      ]}>
      <FindDetailModal
        item={item}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
