import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '@/shared/ThemeContext';
import {ContextItem} from './ContextItem';

interface Props {
  mineral: {
    crystal_system?: string;
    chemical_formula?: string;
    hardness_scale?: string;
    optical_properties?: string;
  };
}

export function MineralDetails({mineral}: Props) {
  const {colors} = useTheme();
  return (
    <View style={styles.section}>
      <Text
        style={[styles.sectionHeader, {color: colors.text, marginBottom: 8}]}>
        MINERAL ANALYSIS
      </Text>
      <ContextItem
        label="Crystal System"
        value={mineral.crystal_system || ''}
      />
      <ContextItem label="Formula" value={mineral.chemical_formula || ''} />
      <ContextItem label="Hardness" value={mineral.hardness_scale || ''} />
      <ContextItem label="Optical" value={mineral.optical_properties || ''} />
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
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
  },
});
