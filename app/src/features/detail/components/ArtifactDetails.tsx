import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '@/shared/ThemeContext';
import {ContextItem} from './ContextItem';

interface Props {
  artifact: {
    likely_origin?: string;
    estimated_age_range?: string;
  };
}

export function ArtifactDetails({artifact}: Props) {
  const {colors} = useTheme();
  return (
    <View style={styles.section}>
      <Text
        style={[styles.sectionHeader, {color: colors.text, marginBottom: 8}]}>
        ARTIFACT DETAILS
      </Text>
      <ContextItem label="Likely Origin" value={artifact.likely_origin || ''} />
      <ContextItem
        label="Est. Age"
        value={artifact.estimated_age_range || ''}
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
