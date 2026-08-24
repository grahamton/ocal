import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '@/shared/ThemeContext';
import {ContextItem} from './ContextItem';

interface Props {
  rock: {
    texture_type?: string;
    mineral_composition?: string;
    depositional_environment?: string;
  };
}

export function PetrologyDetails({rock}: Props) {
  const {colors} = useTheme();
  return (
    <View style={styles.section}>
      <Text
        style={[styles.sectionHeader, {color: colors.text, marginBottom: 8}]}>
        PETROLOGY
      </Text>
      <ContextItem label="Texture" value={rock.texture_type || ''} />
      <ContextItem label="Composition" value={rock.mineral_composition || ''} />
      <ContextItem
        label="Environment"
        value={rock.depositional_environment || ''}
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
