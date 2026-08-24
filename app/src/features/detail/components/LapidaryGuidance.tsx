import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/shared/ThemeContext';

interface Props {
  lapidary: {
    is_tumble_candidate?: boolean;
    tumble_reason?: string;
  };
}

export function LapidaryGuidance({lapidary}: Props) {
  const {colors} = useTheme();
  const isTumble = lapidary.is_tumble_candidate ?? false;
  return (
    <View style={styles.section}>
      <View style={styles.rowCenter}>
        <Ionicons
          name={isTumble ? 'checkmark-circle' : 'close-circle'}
          size={18}
          color={isTumble ? '#22c55e' : '#ef4444'}
        />
        <Text style={[styles.sectionHeader, {color: colors.text}]}>
          {isTumble ? 'Good for Tumbling' : 'Not Recommended for Tumbling'}
        </Text>
      </View>
      <Text
        style={[
          styles.bodyText,
          {color: colors.textSecondary, marginLeft: 26},
        ]}>
        {lapidary.tumble_reason}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 20,
  },
});
