import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '@/shared/ThemeContext';

export function ContextItem({label, value}: {label: string; value: string}) {
  const {colors} = useTheme();
  if (!value) return null;
  return (
    <View style={styles.factGrid}>
      <View style={{width: '30%'}}>
        <Text style={[styles.factLabel, {color: colors.textSecondary}]}>
          {label}
        </Text>
      </View>
      <View style={{flex: 1}}>
        <Text style={[styles.factValue, {color: colors.text}]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  factGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  factLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  factValue: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left',
  },
});
