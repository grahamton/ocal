import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  onStay: () => void;
  onReview: () => void;
  onEndSession: () => void;
};

export function NextActionPrompt({ visible, onStay, onReview, onEndSession }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onStay}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Saved offline.</Text>
          <Text style={styles.subtitle}>Review now or keep capturing?</Text>
          <TouchableOpacity style={[styles.button, styles.primary]} onPress={onReview} activeOpacity={0.9}>
            <Text style={styles.primaryText}>Review kept</Text>
            <Text style={styles.hint}>See your photos and add details.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onStay} activeOpacity={0.9}>
            <Text style={styles.secondaryText}>Keep capturing</Text>
            <Text style={styles.hint}>Stay in camera for the next find.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.endButton} onPress={onEndSession} activeOpacity={0.9}>
            <Text style={styles.endText}>End session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    padding: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
    fontWeight: '800',
  },
  button: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  primary: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  secondaryText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 16,
  },
  hint: {
    marginTop: 4,
    color: '#94a3b8',
    fontWeight: '700',
  },
  endButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
    alignItems: 'center',
  },
  endText: {
    color: '#b91c1c',
    fontWeight: '900',
  },
});
