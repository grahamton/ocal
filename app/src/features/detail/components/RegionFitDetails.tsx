import React from 'react';
import {Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ThemeColors} from '@/shared/ThemeContext';
import {styles} from '../FindDetailModal.styles';

type Props = {
  regionFit: {fit: string; note: string};
  colors: ThemeColors;
};

export function RegionFitDetails({regionFit, colors}: Props) {
  if (regionFit.fit !== 'medium' && regionFit.fit !== 'low') {
    return null;
  }

  return (
    <View style={styles.labSection}>
      <View style={styles.rowCenter}>
        <Ionicons
          name="location-outline"
          size={18}
          color={colors.textSecondary}
        />
        <Text style={[styles.sectionHeader, {color: colors.text}]}>
          Location Check: {regionFit.fit.toUpperCase()}
        </Text>
      </View>
      <Text
        style={[
          styles.bodyText,
          {color: colors.textSecondary, marginLeft: 26},
        ]}>
        {regionFit.note}
      </Text>
    </View>
  );
}
