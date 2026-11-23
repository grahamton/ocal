import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {FindRecord} from '@/shared/types';
import {formatLocationSync} from '@/shared/format';
import {ThemeColors} from '@/shared/ThemeContext';

type Props = {
  localItem: FindRecord;
  label: string;
  favorite: boolean;
  onToggleFavorite: () => void;
  colors: ThemeColors;
};

const formatDate = (timestamp: string) =>
  new Date(timestamp).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function DetailHeader({localItem, label, favorite, onToggleFavorite, colors}: Props) {
  const place = localItem.location_text || formatLocationSync(localItem.lat, localItem.long);
  return (
    <View style={[s.card, {backgroundColor: colors.card}]}>
      <Text style={[s.title, {color: colors.text}]} accessibilityRole="header">
        {label || localItem.card?.name || 'Ranger Al is looking...'}
      </Text>

      <View style={s.metaRow}>
        <Ionicons name="location-outline" size={22} color={colors.textSecondary} />
        <Text style={[s.meta, {color: colors.textSecondary}]}>{place}</Text>
      </View>
      <View style={s.metaRow}>
        <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
        <Text style={[s.meta, {color: colors.textSecondary}]}>
          {formatDate(localItem.timestamp)}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          s.fav,
          favorite
            ? {backgroundColor: '#fef3c7', borderColor: '#d97706'}
            : {borderColor: colors.border},
        ]}
        onPress={onToggleFavorite}
        accessibilityRole="button"
        accessibilityState={{selected: favorite}}>
        <Ionicons
          name={favorite ? 'star' : 'star-outline'}
          size={28}
          color={favorite ? '#b45309' : colors.text}
        />
        <Text style={[s.favText, {color: favorite ? '#78350f' : colors.text}]}>
          {favorite ? 'One of my favorites' : 'Add to favorites'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {padding: 20, borderRadius: 16, gap: 10},
  title: {fontSize: 28, fontWeight: '800', fontFamily: 'Outfit_800ExtraBold'},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  meta: {fontSize: 18, fontWeight: '600', flex: 1},
  fav: {
    marginTop: 6,
    minHeight: 56,
    borderWidth: 2,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  favText: {fontSize: 19, fontWeight: '700'},
});
