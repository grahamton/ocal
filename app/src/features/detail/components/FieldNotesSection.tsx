import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {ThemeColors} from '@/shared/ThemeContext';

type Props = {
  note: string;
  setNote: (note: string) => void;
  onBlur: () => void;
  colors: ThemeColors;
};

/** Free-form notes. Saved automatically when you tap away. */
export function FieldNotesSection({note, setNote, onBlur, colors}: Props) {
  return (
    <View style={s.wrap}>
      <Text style={[s.label, {color: colors.text}]}>My notes</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        onBlur={onBlur}
        style={[s.input, {backgroundColor: colors.card, borderColor: colors.border, color: colors.text}]}
        placeholder="Where you found it, who was with you..."
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        accessibilityLabel="My notes about this rock"
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {gap: 8},
  label: {fontSize: 22, fontWeight: '800'},
  input: {minHeight: 110, borderWidth: 2, borderRadius: 14, padding: 14, fontSize: 18},
});
