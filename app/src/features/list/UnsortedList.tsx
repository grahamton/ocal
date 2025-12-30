import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Alert } from 'react-native';
import { FindDetailModal } from '../detail/FindDetailModal';
import { deleteFind, listFinds, updateFindMetadata } from '../../shared/db';
import { FindRecord } from '../../shared/types';
import { formatCoords } from '../../shared/format';
import { THEME, PALETTE } from '../../shared/theme';

type Props = {
  refreshKey: number;
  onUpdated?: () => void;
  mode?: 'unsorted' | 'all';
};

export function UnsortedList({ refreshKey, onUpdated, mode = 'unsorted' }: Props) {
  const [items, setItems] = useState<FindRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FindRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'cataloged'>('draft');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listFinds(mode === 'unsorted' ? { sessionId: null } : {});
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    let mounted = true;
    load().finally(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, [load, refreshKey]);

  const handleOpen = (item: FindRecord) => {
    setSelected(item);
    setDetailVisible(true);
  };

  const handleSaved = () => {
    load();
    onUpdated?.();
  };

  const handleHideFromUnsorted = async (item: FindRecord) => {
    setMarkingId(item.id);
    try {
      await updateFindMetadata(item.id, { status: 'cataloged' });
      load();
      onUpdated?.();
    } finally {
      setMarkingId(null);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete everywhere?',
      'This removes the photo from Unsorted and Gallery. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await deleteFind(id);
              load();
              onUpdated?.();
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredItems =
    statusFilter === 'all' ? items : items.filter((item) => item.status === statusFilter);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{mode === 'unsorted' ? 'Unsorted' : 'All Finds'}</Text>
        <View style={styles.chipRow}>
          {['draft', 'cataloged', 'all'].map((filter) => {
            const label = filter === 'all' ? 'All' : filter === 'draft' ? 'Draft' : 'Cataloged';
            const active = statusFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(filter as 'all' | 'draft' | 'cataloged')}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {filteredItems.length === 0 && !loading ? <Text style={styles.empty}>No finds yet. Snap one to log it.</Text> : null}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FindCard
            item={item}
            onPress={() => handleOpen(item)}
            onDelete={() => handleDelete(item.id)}
            deleting={deletingId === item.id}
            onHide={() => handleHideFromUnsorted(item)}
            hiding={markingId === item.id}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
      <FindDetailModal
        visible={detailVisible}
        item={selected}
        onClose={() => setDetailVisible(false)}
        onSaved={handleSaved}
      />
    </View>
  );
}

function FindCard({
  item,
  onPress,
  onDelete,
  onHide,
  deleting,
  hiding,
}: {
  item: FindRecord;
  onPress: () => void;
  onDelete: () => void;
  onHide: () => void;
  deleting: boolean;
  hiding: boolean;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: item.photoUri }} style={styles.thumbnail} />
      <View style={styles.meta}>
        <Text style={styles.label}>{item.label ?? 'Unlabeled find'}</Text>
        <Text style={styles.metaText}>{new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
        {item.category ? <Text style={styles.category}>{item.category}</Text> : <Text style={styles.category}>Unsorted</Text>}
        {item.note ? <Text style={styles.note}>{item.note}</Text> : <Text style={styles.noteMuted}>Tap to add notes</Text>}
        <Text style={styles.metaText}>{formatCoords(item.lat, item.long)}</Text>
        <View style={styles.row}>
          <Text style={[styles.badge, item.status === 'cataloged' ? styles.badgeDone : styles.badgeDraft]}>
            {item.status === 'cataloged' ? 'Cataloged' : 'Draft'}
          </Text>
          {!item.synced ? <Text style={styles.offline}>Offline</Text> : null}
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <Text style={styles.actionText}>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.hideButton]} onPress={onHide} disabled={hiding}>
            <Text style={styles.hideText}>{hiding ? 'Moving...' : 'Hide from Unsorted'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete} disabled={deleting}>
            <Text style={styles.deleteText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    ...THEME.typography.subHeader,
    fontSize: 22,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterChipActive: {
    backgroundColor: PALETTE.electricTeal,
    borderColor: PALETTE.electricTeal,
  },
  filterText: {
    color: THEME.colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  filterTextActive: {
    color: PALETTE.oceanDark,
  },
  empty: {
    ...THEME.typography.body,
    fontSize: 16,
    fontStyle: 'italic',
  },
  separator: {
    height: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)', // Glass
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  thumbnail: {
    width: 112,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  meta: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    gap: 8,
  },
  metaText: {
    color: THEME.colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    color: THEME.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  category: {
    color: PALETTE.electricTeal,
    fontSize: 16,
    fontWeight: '800',
  },
  note: {
    color: THEME.colors.text,
    fontSize: 16,
  },
  noteMuted: {
    color: THEME.colors.textSecondary,
    fontSize: 16,
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '700',
    fontSize: 12,
  },
  badgeDraft: {
    backgroundColor: 'rgba(253, 230, 138, 0.2)',
    color: PALETTE.softSand,
  },
  badgeDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#4ade80',
  },
  offline: {
    marginLeft: 8,
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  deleteButton: {
    borderColor: PALETTE.danger,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  hideButton: {
    borderColor: PALETTE.white60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionText: {
    color: THEME.colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  deleteText: {
    color: PALETTE.danger,
    fontWeight: '800',
    fontSize: 14,
  },
  hideText: {
    color: THEME.colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
});
