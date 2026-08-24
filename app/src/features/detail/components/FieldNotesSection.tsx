import React from 'react';
import {Text, TextInput, View} from 'react-native';
import {styles} from '../FindDetailModal.styles';

import {ThemeColors} from '@/shared/ThemeContext';

type Props = {
  note: string;
  setNote: (note: string) => void;
  colors: ThemeColors;
};

export function FieldNotesSection({note, setNote, colors}: Props) {
  return (
    <View style={styles.notesContainer}>
      <Text style={[styles.label, {color: colors.textSecondary}]}>
        YOUR FIELD NOTES
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        style={[
          styles.notesInput,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Add your story about this find..."
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}
