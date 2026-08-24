import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View, Image} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {StatusIcon} from '@/shared/components/StatusIcon';
import {formatLocationSync} from '@/shared/format';
import {getCategoryFromTags} from '@/shared/CategoryMapper';
import {FindRecord} from '@/shared/types';
import {ThemeColors} from '@/shared/ThemeContext';

interface Props {
  item: FindRecord;
  isSelected: boolean;
  colors: ThemeColors;
  mode: string;
  onPress: () => void;
  onLongPress: () => void;
}

export function ListItem({
  item,
  isSelected,
  colors,
  mode,
  onPress,
  onLongPress,
}: Props) {
  const aiResult = item.aiData?.result || null;
  const displayLabel = item.label || aiResult?.best_guess?.label || 'Unknown';

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
  };

  return (
    <TouchableOpacity
      style={[
        styles.listItem,
        {
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.accent : colors.border,
        },
        isSelected && {borderLeftWidth: 4},
      ]}
      activeOpacity={0.85}
      onLongPress={onLongPress}
      onPress={onPress}>
      <Image source={{uri: item.photoUri}} style={styles.listImage} />

      <View style={styles.listContent}>
        <View style={styles.listTitleRow}>
          {item.favorite && (
            <Ionicons
              name="star"
              size={16}
              color="#fbbf24"
              style={{marginRight: 4}}
            />
          )}
          <Text
            style={[styles.listTitle, {color: colors.text}]}
            numberOfLines={1}>
            {displayLabel}
          </Text>
          {aiResult && (
            <StatusIcon
              status="polished"
              size={24}
              category={getCategoryFromTags(
                [aiResult.best_guess?.category || ''],
                aiResult.best_guess?.label,
              )}
              theme={mode === 'high-contrast' ? 'beach' : 'journal'}
              style={{marginLeft: 8}}
            />
          )}
          {!aiResult && (
            <StatusIcon
              status="rough"
              size={24}
              theme={mode === 'high-contrast' ? 'beach' : 'journal'}
              style={{marginLeft: 8}}
            />
          )}
        </View>

        <Text
          style={[styles.listMeta, {color: colors.textSecondary}]}
          numberOfLines={1}>
          {item.location_text || formatLocationSync(item.lat, item.long)} •{' '}
          {formatDate(item.timestamp)}
        </Text>
      </View>

      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  listMeta: {
    fontSize: 13,
  },
});
