import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '@/shared/ThemeContext';
import {AlLength, getAlLength, setAlLength} from '@/ai/alStyle';

const OPTIONS: {value: AlLength; label: string; sub: string}[] = [
  {value: 'short', label: 'Short', sub: 'Name and a quick take'},
  {value: 'full', label: 'Full story', sub: 'Clues, checks and fun facts'},
];

export function AlLengthPicker() {
  const {colors} = useTheme();
  const [length, setLength] = useState<AlLength>('full');

  useEffect(() => {
    getAlLength().then(setLength);
  }, []);

  const choose = (value: AlLength) => {
    setLength(value);
    setAlLength(value);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, {color: colors.text}]}>How much should Al say?</Text>
      <View style={styles.row}>
        {OPTIONS.map(o => {
          const active = length === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              style={[
                styles.btn,
                {
                  backgroundColor: active ? colors.accent : colors.card,
                  borderColor: active ? colors.accent : colors.text,
                },
              ]}
              onPress={() => choose(o.value)}
              accessibilityRole="button"
              accessibilityState={{selected: active}}>
              <Text style={[styles.label, {color: active ? colors.onAccent : colors.text}]}>
                {active ? '✓ ' : ''}
                {o.label}
              </Text>
              <Text style={[styles.sub, {color: active ? colors.onAccent : colors.textSecondary}]}>
                {o.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: 12, marginTop: 8},
  heading: {fontSize: 24, fontWeight: '800', fontFamily: 'Outfit_800ExtraBold'},
  row: {flexDirection: 'row', gap: 12},
  btn: {
    flex: 1,
    minHeight: 84,
    borderRadius: 18,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {fontSize: 20, fontWeight: '800', textAlign: 'center'},
  sub: {fontSize: 16, textAlign: 'center'},
});
