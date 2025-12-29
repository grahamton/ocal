import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  onManual: () => void;
  onAi: () => void;
  onClose: () => void;
};

export function EnrichPrompt({ visible, onManual, onAi, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Enrich finds</Text>
          <Text style={styles.subtitle}>Pick how you want to finish this batch.</Text>
          <TouchableOpacity style={[styles.button, styles.primary]} onPress={onManual} activeOpacity={0.9}>
            <Text style={styles.primaryText}>Manual enrich</Text>
            <Text style={styles.hint}>Open cataloger to add labels/notes.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onAi} activeOpacity={0.9}>
            <Text style={styles.secondaryText}>AI assist</Text>
            <Text style={styles.hint}>Jump to cataloger to run identify.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>Dismiss</Text>
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
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
    fontWeight: '700',
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
  close: {
    padding: 12,
    alignItems: 'center',
  },
  closeText: {
    fontWeight: '800',
    color: '#475569',
  },
});
