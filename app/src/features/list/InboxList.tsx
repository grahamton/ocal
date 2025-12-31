import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteFind, listFinds, updateFindMetadata } from '../../shared/db';
import { FindRecord } from '../../shared/types';
import { useTheme } from '../../shared/ThemeContext';
import { IdentifyQueueService } from '../../ai/IdentifyQueueService';
import { logger } from '../../shared/LogService';

type Props = {
  refreshKey: number;
  onUpdated?: () => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 32;

export function InboxList({ refreshKey, onUpdated }: Props) {
  const { colors, mode } = useTheme();
  const [items, setItems] = useState<FindRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listFinds({ status: 'draft' });
      setItems(rows);
      // Reset index if out of bounds (e.g. after emptying list)
      if (index >= rows.length) setIndex(Math.max(0, rows.length - 1));
    } finally {
      setLoading(false);
    }
  }, [index]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const currentItem = items[index];

  const handleKeep = async () => {
    if (!currentItem) return;
    try {
      // 1. Queue for AI Analysis (auto-runs if online)
      logger.add('user', 'Inbox: Allowed - Queueing AI', { id: currentItem.id });
      await IdentifyQueueService.addToQueue(currentItem.id);

      // 2. Mark as cataloged
      await updateFindMetadata(currentItem.id, {
        status: 'cataloged',
      });

      // 3. Advance List
      const nextItems = items.filter(i => i.id !== currentItem.id);
      setItems(nextItems);
      onUpdated?.();
      if (index >= nextItems.length) setIndex(Math.max(0, nextItems.length - 1));
    } catch (e) {
        logger.error('Keep failed', e);
      Alert.alert('Error', 'Could not keep item.');
    }
  };

  const handleTrash = () => {
    if (!currentItem) return;
    Alert.alert('Delete?', 'Throw this rock back?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Throw Back',
        style: 'destructive',
        onPress: async () => {
            try {
                await deleteFind(currentItem.id);
                const nextItems = items.filter(i => i.id !== currentItem.id);
                setItems(nextItems);
                onUpdated?.();
                if (index >= nextItems.length) setIndex(Math.max(0, nextItems.length - 1));
            } catch(e) { logger.error('Trash failed', e); }
        }
      }
    ]);
  };

  if (loading && items.length === 0) {
    return (
        <View style={styles.centerContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Logbook...</Text>
        </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="sparkles-outline" size={80} color={colors.accent} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up!</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Your inbox is empty. Time to go back to the beach?
        </Text>
      </View>
    );
  }

  if (!currentItem) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.counterText, { color: colors.textSecondary }]}>
          {items.length} LEFT TO REVIEW
        </Text>
      </View>

      <View style={[styles.deckContainer, { borderColor: colors.border, borderWidth: mode === 'high-contrast' ? 2 : 1 }]}>
          <Image source={{ uri: currentItem.photoUri }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardOverlay}>
             <Text style={styles.cardDate}>{new Date(currentItem.timestamp).toLocaleDateString()}</Text>
          </View>
      </View>

      <View style={styles.controls}>
          <TouchableOpacity style={[styles.bigButton, styles.trashBtn, { borderColor: colors.danger }]} onPress={handleTrash}>
              <Ionicons name="trash-outline" size={40} color="#fca5a5" />
              <Text style={[styles.btnLabelDanger, { color: '#fca5a5' }]}>TRASH</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[
                styles.bigButton,
                styles.keepBtn,
                { backgroundColor: colors.success, borderColor: colors.success }
            ]} onPress={handleKeep}>
              <Ionicons name="checkmark-circle" size={48} color="#fff" />
              <Text style={styles.btnLabelSuccess}>KEEP</Text>
          </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // Modified to flex-start to allow scrolling if needed, or keeping center
    // gap: 20 not supported in old RN... wait Expo 52 supports it.
    gap: 20,
    paddingBottom: 20,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  header: {
    marginTop: 10,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 1,
  },
  deckContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.1,
    borderRadius: 24,
    // background handled by image usually
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, // Reduced shadow
    shadowRadius: 20,
    elevation: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardDate: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  controls: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bigButton: {
    flex: 1,
    height: 120, // MASSIVE visible inputs
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    gap: 8,
  },
  trashBtn: {
    backgroundColor: 'rgba(185, 28, 28, 0.2)', // Red tint
    // borderColor handled dynamic
  },
  keepBtn: {
    // bg handled dynamic
    elevation: 4,
  },
  btnLabelDanger: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
  },
  btnLabelSuccess: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
});
