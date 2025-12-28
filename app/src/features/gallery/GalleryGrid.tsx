import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { listFinds } from '../../shared/db';
import { FindRecord } from '../../shared/types';

const spacing = 8;
const numColumns = 3;
const size = (Dimensions.get('window').width - 16 * 2 - spacing * (numColumns - 1)) / numColumns;

type Props = {
  refreshKey: number;
  onSelect?: (item: FindRecord) => void;
  filter?: 'all' | 'draft';
};

export function GalleryGrid({ refreshKey, onSelect, filter = 'all' }: Props) {
  const [items, setItems] = useState<FindRecord[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await listFinds();
      if (active) {
        setItems(rows);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const filteredItems = filter === 'draft' ? items.filter((i) => i.status === 'draft') : items;

  if (filteredItems.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No photos yet. Snap a find to see it here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredItems}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.tile} activeOpacity={0.85} onPress={() => onSelect?.(item)}>
          <Image source={{ uri: item.photoUri }} style={styles.image} />
        </TouchableOpacity>
      )}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing,
    marginBottom: spacing,
  },
  tile: {
    width: size,
    height: size,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  image: {
    width: '100%',
    height: '100%',
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
});
