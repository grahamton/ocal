import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { findDetailStyles as styles } from '../FindDetailModal.styles';

type Props = {
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
};

export function FooterActions({ saving, onClose, onSave }: Props) {
  return (
    <>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onClose} disabled={saving}>
          <Text style={styles.secondaryText}>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={onSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save</Text>}
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={onClose} disabled={saving}>
        <Text style={styles.backButtonText}>Back to capture</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>Offline OK. Changes sync later.</Text>
    </>
  );
}
