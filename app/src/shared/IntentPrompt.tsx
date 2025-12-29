import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Session } from './types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (dest: 'capture' | 'identify' | 'newSession' | 'continue') => void;
  recentSession: Session | null;
  activeSession: Session | null;
};

export function IntentPrompt({ visible, onClose, onSelect, recentSession, activeSession }: Props) {
  const recentLabel = recentSession
    ? `${recentSession.name} • ${new Date(recentSession.startTime).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`
    : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Where to?</Text>
          <Text style={styles.subtitle}>Stay in flow or start fresh.</Text>
          {recentLabel ? <Text style={styles.recent}>Recent session: {recentLabel}</Text> : null}
          {activeSession ? (
            <TouchableOpacity style={[styles.button, styles.primary]} onPress={() => onSelect('continue')} activeOpacity={0.9}>
              <Text style={styles.primaryText}>Continue session</Text>
              <Text style={styles.hint}>{activeSession.name}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={[styles.button, styles.altPrimary]} onPress={() => onSelect('newSession')} activeOpacity={0.9}>
            <Text style={styles.primaryText}>Start new beach session</Text>
            <Text style={styles.hint}>Fresh capture run, offline-first.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => onSelect('identify')} activeOpacity={0.9}>
            <Text style={styles.secondaryText}>Sort / Identify</Text>
            <Text style={styles.hint}>Review + run analysis.</Text>
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
  recent: {
    color: '#0f172a',
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
  altPrimary: {
    backgroundColor: '#111827',
    borderColor: '#111827',
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
