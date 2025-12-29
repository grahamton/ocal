import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listFinds, updateFindMetadata } from '../../shared/db';
import { useSession } from '../../shared/SessionContext';
import { FindRecord } from '../../shared/types';

type Props = {
  refreshKey: number;
  onUpdated?: () => void;
};

// Context: Phase 1/2 bridge - simple session ledger for active capture runs.
export function SessionLedger({ refreshKey, onUpdated }: Props) {
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

  const toggleFavorite = async (id: string, next: boolean) => {
    await updateFindMetadata(id, { favorite: next });
    await load();
    onUpdated?.();
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.length === 0 ? <Text style={styles.caption}>Captures will appear here.</Text> : null}
        {items.map((item) => (
          <View key={item.id} style={styles.tile}>
            <Image source={{ uri: item.photoUri }} style={styles.thumb} />
            <View style={styles.meta}>
              <Text style={styles.label} numberOfLines={1}>
                {item.label || 'Unlabeled'}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.chip, item.favorite && styles.chipActive]}
                  onPress={() => toggleFavorite(item.id, !item.favorite)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.chipText, item.favorite && styles.chipTextActive]}>
                    {item.favorite ? 'Starred' : 'Star'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.chip} onPress={handleVoiceNote} activeOpacity={0.85}>
                  <Text style={styles.chipText}>Voice</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
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
  },
  thumb: {
    width: '100%',
    height: 100,
    backgroundColor: '#e5e7eb',
  },
  meta: {
    padding: 8,
    gap: 6,
  },
  label: {
    fontWeight: '800',
    color: '#0f172a',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  chipText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  chipTextActive: {
    color: '#fff',
  },
});
