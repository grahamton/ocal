import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ThemeColors} from '@/shared/ThemeContext';
import {FilterMode} from '../hooks/useGalleryGrid';

type Props = {
  filter: FilterMode;
  setFilter: (f: FilterMode) => void;
  total: number;
  colors: ThemeColors;
};

// Two big, labeled buttons instead of small chips.
export function FilterButtons({filter, setFilter, total, colors}: Props) {
  const options: {key: FilterMode; label: string}[] = [
    {key: 'all', label: `All rocks (${total})`},
    {key: 'favorites', label: '★ Favorites'},
  ];
  return (
    <View style={styles.row}>
      {options.map(o => {
        const active = filter === o.key;
        return (
          <TouchableOpacity
            key={o.key}
            style={[
              styles.btn,
              {
                borderColor: active ? colors.accent : colors.text,
                backgroundColor: active ? colors.accent : colors.card,
              },
            ]}
            onPress={() => setFilter(o.key)}
            accessibilityRole="button"
            accessibilityState={{selected: active}}>
            <Text style={[styles.text, {color: active ? '#fff' : colors.text}]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 12, marginBottom: 12},
  btn: {
    flex: 1,
    minHeight: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  text: {fontSize: 18, fontWeight: '800', fontFamily: 'Outfit_800ExtraBold'},
});
