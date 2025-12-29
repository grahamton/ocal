import { useEffect, useMemo, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listFinds } from '../../shared/db';
import { formatCoords } from '../../shared/format';
import { FindRecord } from '../../shared/types';

const spacing = 8;
const numColumns = 2;
const cardWidth = (Dimensions.get('window').width - 16 * 2 - spacing * (numColumns - 1)) / numColumns;

type Props = {
  refreshKey: number;
  onSelect?: (item: FindRecord) => void;
  filter?: 'all' | 'draft';
};

// Context: Phase 2 list polish — add filter pills and grid/list toggle inspired by UI review.
export function GalleryGrid({ refreshKey, onSelect, filter = 'all' }: Props) {
  const [items, setItems] = useState<FindRecord[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await listFinds();
      if (active) setItems(rows);
    })();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ['all', ...Array.from(set), 'draft'];
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = filter === 'draft' ? items.filter((i) => i.status === 'draft') : items;
    if (categoryFilter && categoryFilter !== 'all') {
      if (categoryFilter === 'draft') {
        result = result.filter((i) => i.status === 'draft');
      } else {
        result = result.filter((i) => (i.category ?? 'Unsorted') === categoryFilter);
      }
    }
    return result;
  }, [filter, items, categoryFilter]);

  if (filteredItems.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No photos yet. Snap a find to see it here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {categoryOptions.map((c) => {
            const active = categoryFilter === c;
            const label = c === 'all' ? 'All' : c === 'draft' ? 'Draft' : c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategoryFilter(c)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.viewToggle}>
          {(['grid', 'list'] as const).map((mode) => {
            const active = viewMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.toggleButton, active && styles.toggleButtonActive]}
                onPress={() => setViewMode(mode)}
                activeOpacity={0.85}
              >
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{mode === 'grid' ? 'Grid' : 'List'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {viewMode === 'grid' ? (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.tile} activeOpacity={0.85} onPress={() => onSelect?.(item)}>
              <Image source={{ uri: item.photoUri }} style={styles.image} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.titleText} numberOfLines={1}>
                    {item.label || 'Untitled'}
                  </Text>
                  <View style={[styles.badge, item.category ? styles.badgeTint : null]}>
                    <Text style={[styles.badgeText, item.category ? styles.badgeTextTint : null]}>
                      {(item.category || 'Unsorted').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.metaText} numberOfLines={1}>
                  {formatCoords(item.lat, item.long) || 'No location'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.listContainer}>
          {filteredItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.listTile} activeOpacity={0.85} onPress={() => onSelect?.(item)}>
              <Image source={{ uri: item.photoUri }} style={styles.listThumb} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={styles.listHeader}>
                  <Text style={styles.titleText} numberOfLines={1}>
                    {item.label || 'Untitled'}
                  </Text>
                  <View style={[styles.badge, item.category ? styles.badgeTint : null]}>
                    <Text style={[styles.badgeText, item.category ? styles.badgeTextTint : null]}>
                      {(item.category || 'Unsorted').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.metaText} numberOfLines={2}>
                  {formatCoords(item.lat, item.long) || 'No location'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  filterRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  chipText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#fff',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  toggleText: {
    color: '#475569',
    fontWeight: '800',
    fontSize: 12,
  },
  toggleTextActive: {
    color: '#0f172a',
  },
  row: {
    gap: spacing,
    marginBottom: spacing,
  },
  tile: {
    width: cardWidth,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  image: {
    width: '100%',
    height: cardWidth * 0.75,
    backgroundColor: '#e5e7eb',
  },
  cardBody: {
    padding: 10,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleText: {
    fontWeight: '800',
    fontSize: 15,
    color: '#0f172a',
    flex: 1,
  },
  metaText: {
    color: '#4b5563',
    fontWeight: '700',
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  badgeTint: {
    backgroundColor: '#0f172a',
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 10,
    color: '#475569',
  },
  badgeTextTint: {
    color: '#fff',
  },
  emptyBox: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    color: '#0f172a',
    fontSize: 15,
  },
  listContainer: {
    gap: spacing,
  },
  listTile: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  listThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
});
