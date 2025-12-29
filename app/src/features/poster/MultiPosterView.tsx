import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { FindRecord } from '../../shared/types';

type Props = {
  items: FindRecord[];
};

// Context: Phase 2/4 stub - grid poster preview.
export function MultiPosterView({ items }: Props) {
  const renderItem = ({ item }: { item: FindRecord }) => (
    <View style={styles.tile}>
      <Image source={{ uri: item.photoUri }} style={styles.image} />
      <Text style={styles.label} numberOfLines={1}>
        {item.label || 'Find'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grid poster preview</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        renderItem={renderItem}
        scrollEnabled={false}
      />
      <Text style={styles.hint}>Export coming later.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    fontWeight: '800',
    color: '#0f172a',
    fontSize: 16,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  tile: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 100,
    backgroundColor: '#e5e7eb',
  },
  label: {
    padding: 8,
    fontWeight: '800',
    color: '#0f172a',
  },
  hint: {
    color: '#6b7280',
    fontWeight: '700',
  },
});
