import { Text, TouchableOpacity } from 'react-native';
import { findDetailStyles as styles } from '../FindDetailModal.styles';

type Props = {
  favorite: boolean;
  onToggle: () => void;
};

export function FavoriteToggle({ favorite, onToggle }: Props) {
  return (
    <TouchableOpacity
      style={[styles.favoriteChip, favorite && styles.favoriteChipActive]}
      onPress={onToggle}
      accessibilityRole="button"
    >
      <Text style={[styles.favoriteText, favorite && styles.favoriteTextActive]}>
        {favorite ? 'Starred for ledger' : 'Mark favorite'}
      </Text>
    </TouchableOpacity>
  );
}
