import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/shared/ThemeContext';
import {RawJsonInspector} from '@/shared/components/RawJsonInspector';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiResult: any;
}

export function TechnicalDetails({aiResult}: Props) {
  const {colors} = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.toggleRow, {borderTopColor: colors.border}]}
        onPress={() => setShowAdvanced(!showAdvanced)}>
        <Text style={[styles.toggleText, {color: colors.text}]}>
          Technical Details
        </Text>
        <Ionicons
          name={showAdvanced ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {showAdvanced && (
        <View style={styles.toggleContent}>
          {/* Alternatives */}
          {aiResult.alternatives && aiResult.alternatives.length > 0 && (
            <View style={{marginBottom: 12}}>
              <Text
                style={[
                  styles.label,
                  {color: colors.textSecondary, marginBottom: 4},
                ]}>
                Alternatives
              </Text>
              {aiResult.alternatives.map(
                (alt: {label: string; confidence: number}, i: number) => (
                  <View key={i} style={styles.altRow}>
                    <Text style={{color: colors.text}}>{alt.label}</Text>
                    <Text style={{color: colors.textSecondary}}>
                      {Math.round(alt.confidence * 100)}%
                    </Text>
                  </View>
                ),
              )}
            </View>
          )}

          {/* Catalog Tags */}
          {aiResult.catalog_tags && (
            <View>
              <Text
                style={[
                  styles.label,
                  {color: colors.textSecondary, marginBottom: 4},
                ]}>
                Tags
              </Text>
              <Text style={{color: colors.text, lineHeight: 20}}>
                {Object.entries(aiResult.catalog_tags)
                  .map(([_k, v]) => (Array.isArray(v) ? v.join(', ') : v))
                  .join(' • ')}
              </Text>
            </View>
          )}

          <RawJsonInspector data={aiResult} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    marginTop: 4,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  toggleContent: {
    paddingBottom: 12,
    paddingTop: 4,
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
