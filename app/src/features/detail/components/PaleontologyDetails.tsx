import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '@/shared/ThemeContext';
import {ContextItem} from './ContextItem';

interface Props {
  fossil: {
    taxonomy?: string;
    living_relative?: string;
    preservation_mode?: string;
  };
}

export function PaleontologyDetails({fossil}: Props) {
  const {colors} = useTheme();
  return (
    <View style={styles.section}>
      <Text
        style={[styles.sectionHeader, {color: colors.text, marginBottom: 8}]}>
        PALEONTOLOGY
      </Text>
      <ContextItem label="Taxonomy" value={fossil.taxonomy || ''} />
      <ContextItem
        label="Living Relative"
        value={fossil.living_relative || ''}
      />
      <ContextItem
        label="Preservation"
        value={fossil.preservation_mode || ''}
      />
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
