import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/shared/ThemeContext';
import {ContextItem} from './ContextItem';

interface Props {
  specimenContext: {
    age?: string;
    geology_hypothesis?: {
      name?: string;
      confidence?: string;
    };
    historical_fact?: string;
  };
}

export function GeologicContext({specimenContext}: Props) {
  const {colors} = useTheme();
  const [showContext, setShowContext] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.toggleRow, {borderTopColor: colors.border}]}
        onPress={() => setShowContext(!showContext)}>
        <Text style={[styles.toggleText, {color: colors.text}]}>
          Geologic Context
        </Text>
        <Ionicons
          name={showContext ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {showContext && (
        <View style={styles.toggleContent}>
          {specimenContext.age && (
            <ContextItem label="Age" value={specimenContext.age} />
          )}
          {specimenContext.geology_hypothesis && (
            <ContextItem
              label="Geologic Hypothesis"
              value={
                specimenContext.geology_hypothesis.name
                  ? `${specimenContext.geology_hypothesis.name} (${specimenContext.geology_hypothesis.confidence || ''})`
                  : 'Formation unknown'
              }
            />
          )}
          {specimenContext.historical_fact && (
            <ContextItem
              label="Historical Fact"
              value={specimenContext.historical_fact}
            />
          )}
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
});
