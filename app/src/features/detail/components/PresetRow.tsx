import { Text, TouchableOpacity, View } from 'react-native';
import { findDetailStyles as styles } from '../FindDetailModal.styles';

type Props = {
  saving: boolean;
  onSetAgate: () => void;
  onSetDraft: () => void;
};

export function PresetRow({ saving, onSetAgate, onSetDraft }: Props) {
  return (
    <View style={styles.presetRow}>
      <TouchableOpacity style={[styles.presetButton, styles.presetPrimary]} onPress={onSetAgate} disabled={saving}>
        <Text style={styles.presetTextPrimary}>One-tap: Agate + Cataloged</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.presetButton} onPress={onSetDraft} disabled={saving}>
        <Text style={styles.presetText}>Mark Draft</Text>
      </TouchableOpacity>
    </View>
  );
}
