import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FindRecord } from '../../shared/types';

type Props = {
  item: FindRecord;
  onClose?: () => void;
};

// Context: Phase 2/4 stub - simple single-item poster preview.
export function SinglePosterView({ item, onClose }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Poster preview</Text>
        {onClose ? (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.card}>
        <Image source={{ uri: item.photoUri }} style={styles.hero} />
        <Text style={styles.name}>{item.label || 'Untitled find'}</Text>
        <Text style={styles.meta}>{item.category || 'Unsorted'}</Text>
        <Text style={styles.meta}>{new Date(item.timestamp).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.hint}>Export and sharing to follow.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    fontSize: 18,
    color: '#0f172a',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  closeText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  hero: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
  },
  meta: {
    color: '#4b5563',
    fontWeight: '700',
  },
  hint: {
    color: '#6b7280',
    fontWeight: '700',
  },
});
