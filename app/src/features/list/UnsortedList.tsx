import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Alert } from 'react-native';
import { FindDetailModal } from '../detail/FindDetailModal';
import { deleteFind, listFinds, updateFindMetadata } from '../../shared/db';
import { FindRecord } from '../../shared/types';
import { formatCoords } from '../../shared/format';

type Props = {
  refreshKey: number;
  onUpdated?: () => void;
};

export function UnsortedList({ refreshKey, onUpdated }: Props) {
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
      const rows = await listFinds();
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, []);

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
      await updateFindMetadata(item.id, item.label, item.note, item.category, 'cataloged');
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
        <Text style={styles.heading}>Unsorted</Text>
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
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  filterText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 13,
  },
  filterTextActive: {
    color: '#fff',
  },
  empty: {
    color: '#555',
    fontSize: 14,
  },
  separator: {
    height: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  thumbnail: {
    width: 112,
    height: 112,
    backgroundColor: '#f3f4f6',
  },
  meta: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    gap: 6,
  },
  metaText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900',
  },
  category: {
    color: '#111',
    fontSize: 16,
    fontWeight: '800',
  },
  note: {
    color: '#111',
    fontSize: 15,
  },
  noteMuted: {
    color: '#6b7280',
    fontSize: 15,
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
    backgroundColor: '#f97316',
    color: '#fff',
  },
  badgeDone: {
    backgroundColor: '#22c55e',
    color: '#fff',
  },
  offline: {
    marginLeft: 8,
    color: '#6b7280',
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
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  deleteButton: {
    borderColor: '#b91c1c',
    backgroundColor: '#fef2f2',
  },
  hideButton: {
    borderColor: '#0f172a',
    backgroundColor: '#eef2ff',
  },
  actionText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 13,
  },
  deleteText: {
    color: '#b91c1c',
    fontWeight: '800',
    fontSize: 13,
  },
  hideText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 13,
  },
});
