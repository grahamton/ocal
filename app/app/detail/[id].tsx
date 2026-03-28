import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/ThemeContext';
import * as firestoreService from '@/shared/firestoreService';
import { FindRecord } from '@/shared/types';
import { FindDetailModal } from '@/features/detail/FindDetailModal';

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [item, setItem] = useState<FindRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      firestoreService.getFind(id as string).then(f => {
        setItem(f);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FindDetailModal
        visible={true}
        item={item}
        onClose={() => router.back()}
        onSaved={() => {
          // Trigger refresh if needed, but Firestore listeners should handle it
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
