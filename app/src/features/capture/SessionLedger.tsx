import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listFinds, updateFindMetadata } from '../../shared/db';
import { useSession } from '../../shared/SessionContext';
import { FindRecord } from '../../shared/types';

type Props = {
  refreshKey: number;
  onUpdated?: () => void;
  onRequestReview?: () => void;
  onKept?: () => void;
};

// Simple ledger: pick keeps, then review.
export function SessionLedger({ refreshKey, onUpdated, onRequestReview }: Props) {
  const { activeSession } = useSession();
  const [items, setItems] = useState<FindRecord[]>([]);

  const load = useCallback(async () => {
    if (!activeSession) {
      setItems([]);
      return;
    }
    const rows = await listFinds({ sessionId: activeSession.id });
    setItems(rows);
  }, [activeSession]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, refreshKey]);

  const toggleKeep = async (id: string, current: boolean) => {
    await updateFindMetadata(id, { favorite: !current });
    if (!current && onKept) {
      onKept();
    }
    // Trigger refreshKey increment in parent to reload us and update UI
    if (onUpdated) onUpdated();
    else load();
  };

  const handleVoiceNote = () => {
    Alert.alert('Voice note', 'Voice note stub — attach a note after dictation (coming later).');
  };

  if (!activeSession) return null;

  const keptCount = items.filter((i) => i.favorite).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Session ledger</Text>
        <Text style={styles.caption}>{items.length} finds</Text>
      </View>
      <Text style={styles.prompt}>Tap &quot;Keep&quot; to star items for review.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.length === 0 ? <Text style={styles.caption}>Captures will appear here.</Text> : null}
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.tile}
            onPress={() => toggleKeep(item.id, item.favorite)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: item.photoUri }} style={styles.thumb} />
            <TouchableOpacity
              style={styles.selectBadge}
              onPress={() => toggleKeep(item.id, item.favorite)}
              activeOpacity={0.8}
            >
              <Text style={[styles.selectText, item.favorite && styles.selectTextActive]}>
                {item.favorite ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
            <View style={styles.meta}>
              <Text style={styles.label} numberOfLines={1}>
                {item.label || 'Unlabeled'}
              </Text>
              <TouchableOpacity
                style={[styles.keepChip, item.favorite && styles.keepChipActive]}
                onPress={() => toggleKeep(item.id, item.favorite)}
                activeOpacity={0.85}
              >
                <Text style={[styles.keepText, item.favorite && styles.keepTextActive]}>
                  {item.favorite ? 'Kept' : 'Keep'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.voiceChip} onPress={handleVoiceNote} activeOpacity={0.85}>
                <Text style={styles.voiceText}>Voice</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {items.length > 0 ? (
        <TouchableOpacity style={styles.analyzeButton} onPress={onRequestReview} activeOpacity={0.9}>
          <Text style={styles.analyzeText}>Review Session {keptCount > 0 ? `(${keptCount} kept)` : ''}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    color: '#0f172a',
    fontSize: 16,
  },
  prompt: {
    color: '#334155',
    fontWeight: '800',
  },
  caption: {
    color: '#4b5563',
    fontWeight: '700',
  },
  row: {
    gap: 10,
    alignItems: 'center',
  },
  tile: {
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    position: 'relative',
    paddingBottom: 8,
  },
  thumb: {
    width: '100%',
    height: 100,
    backgroundColor: '#e5e7eb',
  },
  selectBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#0f172a',
  },
  selectText: {
    fontWeight: '900',
    color: '#0f172a',
  },
  selectTextActive: {
    color: '#f59e0b', // Gold for star
  },
  meta: {
    padding: 8,
    gap: 6,
  },
  label: {
    fontWeight: '800',
    color: '#0f172a',
  },
  keepChip: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f172a',
    backgroundColor: '#fff',
  },
  keepChipActive: {
    backgroundColor: '#0f172a',
  },
  keepText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  keepTextActive: {
    color: '#fff',
  },
  voiceChip: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  voiceText: {
    fontWeight: '800',
    color: '#475569',
  },
  analyzeButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  analyzeText: {
    color: '#fff',
    fontWeight: '900',
  },
});
