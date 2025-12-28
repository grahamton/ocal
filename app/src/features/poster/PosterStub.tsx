import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  onPress?: () => void;
};

export function PosterStub({ onPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Poster</Text>
      <Text style={styles.description}>Pick your favorite finds to auto-build a grid you can share or print. Coming soon.</Text>
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Start Poster (stub)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
