import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listFinds } from '../../shared/db';
import { useSession } from '../../shared/SessionContext';
import { FindRecord } from '../../shared/types';

type Props = {
  refreshKey: number;
  onUpdated?: () => void;
  onRequestReview?: () => void;
};

// Simple ledger: pick keeps, then review.
export function SessionLedger({ refreshKey, onRequestReview }: Props) {
  const { activeSession } = useSession();
  const [items, setItems] = useState<FindRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!activeSession) {
      setItems([]);
      setSelected(new Set());
      return;
    }
    const rows = await listFinds({ sessionId: activeSession.id });
    setItems(rows);
  }, [activeSession]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, refreshKey]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleVoiceNote = () => {
    Alert.alert('Voice note', 'Voice note stub — attach a note after dictation (coming later).');
  };

  if (!activeSession) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Session ledger</Text>
        <Text style={styles.caption}>{items.length} finds</Text>
      </View>
      <Text style={styles.prompt}>Which captures do you want to keep for analysis?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.length === 0 ? <Text style={styles.caption}>Captures will appear here.</Text> : null}
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={styles.tile} onPress={() => toggleSelect(item.id)} activeOpacity={0.9}>
            <Image source={{ uri: item.photoUri }} style={styles.thumb} />
            <TouchableOpacity style={styles.selectBadge} onPress={() => toggleSelect(item.id)} activeOpacity={0.8}>
              <Text style={[styles.selectText, selected.has(item.id) && styles.selectTextActive]}>
                {selected.has(item.id) ? '✓' : '○'}
              </Text>
            </TouchableOpacity>
            <View style={styles.meta}>
              <Text style={styles.label} numberOfLines={1}>
                {item.label || 'Unlabeled'}
              </Text>
              <TouchableOpacity style={styles.keepChip} onPress={() => toggleSelect(item.id)} activeOpacity={0.85}>
                <Text style={[styles.keepText, selected.has(item.id) && styles.keepTextActive]}>
                  {selected.has(item.id) ? 'Kept' : 'Keep'}
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
        <TouchableOpacity
          style={[styles.analyzeButton, selected.size === 0 && styles.analyzeButtonDisabled]}
          disabled={selected.size === 0}
          onPress={onRequestReview}
          activeOpacity={0.9}
        >
          <Text style={styles.analyzeText}>Review kept ({selected.size})</Text>
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
    color: '#0f172a',
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
  keepText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  keepTextActive: {
    color: '#0f172a',
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
