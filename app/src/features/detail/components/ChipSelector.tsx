import { Text, TouchableOpacity, View } from 'react-native';
import { findDetailStyles as styles } from '../FindDetailModal.styles';

export type ChipOption = { value: string; label?: string };

type Props = {
  options: ChipOption[];
  selected: string;
  onSelect: (value: string) => void;
};

export function ChipSelector({ options, selected, onSelect }: Props) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {option.label ?? option.value}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
