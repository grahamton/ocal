import React from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {styles} from '../FindDetailModal.styles';

import {ThemeColors} from '@/shared/ThemeContext';

type Props = {
  saving: boolean;
  handleShare: () => void;
  handleDelete: () => void;
  handleSave: () => void;
  colors: ThemeColors;
};

export function DetailActionFooter({
  saving,
  handleShare,
  handleDelete,
  handleSave,
  colors,
}: Props) {
  return (
    <View
      style={[
        styles.actionFooter,
        {backgroundColor: colors.background, borderTopColor: colors.border},
      ]}>
      <TouchableOpacity
        style={[styles.iconButton, {borderColor: colors.border}]}
        onPress={handleShare}>
        <Ionicons name="share-outline" size={24} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton, {borderColor: '#ef4444'}]}
        onPress={handleDelete}>
        <Ionicons name="trash-outline" size={24} color="#ef4444" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.saveButton, {backgroundColor: colors.accent}]}
        onPress={handleSave}
        disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveText}>Save</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
