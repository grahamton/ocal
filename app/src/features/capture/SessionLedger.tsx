
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listFinds, updateFindMetadata } from '../../shared/db';
import { useSession } from '../../shared/SessionContext';
import { FindRecord } from '../../shared/types';
import { THEME } from '../../shared/theme';
import { LedgerTile } from './LedgerTile';

type Props = {
  refreshKey: number;
  onUpdated?: () => void;
  onRequestReview?: () => void;
  onKept?: () => void;
};

// Simple ledger: pick keeps, then review.
export function SessionLedger({ refreshKey, onUpdated, onRequestReview, onKept }: Props) {
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
          <LedgerTile key={item.id} item={item} onToggleKeep={toggleKeep} />
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
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...THEME.typography.subHeader,
    fontSize: 18,
  },
  prompt: {
    ...THEME.typography.body,
    fontSize: 14,
  },
  caption: {
    ...THEME.typography.label,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  row: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 4,
  },
  analyzeButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: THEME.colors.accent,
  },
  analyzeText: {
    ...THEME.typography.label,
    fontSize: 14,
    color: '#fff', // accent usually needs white text or specific contrast
  },
});
