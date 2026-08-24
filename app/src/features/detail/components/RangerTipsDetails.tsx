import React from 'react';
import {Text, View} from 'react-native';
import {ThemeColors} from '@/shared/ThemeContext';
import {styles} from '../FindDetailModal.styles';

type Props = {
  bestGuess: {confidence?: number; category?: string} | undefined;
  followupPhotos: string[] | undefined;
  colors: ThemeColors;
};

export function RangerTipsDetails({bestGuess, followupPhotos, colors}: Props) {
  const showTips =
    ((bestGuess?.confidence || 0) < 0.9 || bestGuess?.category === 'unknown') &&
    followupPhotos &&
    followupPhotos.length > 0;

  if (!showTips || !followupPhotos) {
    return null;
  }

  return (
    <View style={styles.labSection}>
      <Text style={[styles.label, {color: colors.textSecondary}]}>
        Ranger Tip: Try these photos for better ID
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 4,
        }}>
        {followupPhotos.slice(0, 2).map((req, i) => (
          <View key={i} style={[styles.chip, {borderColor: colors.border}]}>
            <Text style={[styles.chipText, {color: colors.textSecondary}]}>
              {req}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
