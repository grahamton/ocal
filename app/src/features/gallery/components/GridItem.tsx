import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View, Image} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {StatusIcon} from '@/shared/components/StatusIcon';
import {FindRecord} from '@/shared/types';
import {ThemeColors} from '@/shared/ThemeContext';

interface Props {
  item: FindRecord;
  isSelected?: boolean;
  cardWidth: number;
  colors: ThemeColors;
  mode: string;
  onPress: () => void;
  onLongPress?: () => void;
}

export function GridItem({
  item,
  isSelected = false,
  cardWidth,
  colors,
  mode,
  onPress,
  onLongPress,
}: Props) {
  const aiResult = item.card ?? null;
  const displayLabel = item.label || aiResult?.name || (item.aiError ? 'Waiting for signal' : 'Al is looking...');


  return (
    <TouchableOpacity
      style={[
        styles.tile,
        {
          width: cardWidth,
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.accent : colors.border,
        },
        isSelected && {borderWidth: 3},
      ]}
      activeOpacity={0.85}
      onLongPress={onLongPress}
      onPress={onPress}>
      <Image source={{uri: item.photoUri}} style={styles.image} />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)']}
        style={styles.gradientOverlay}
      />

      {item.favorite && (
        <View style={styles.favoriteBadge}>
          <Ionicons name="star" size={16} color="#fbbf24" />
        </View>
      )}

      {isSelected && (
        <View style={styles.selectionOverlay}>
          <Ionicons name="checkmark-circle" size={32} color={colors.accent} />
        </View>
      )}

      {!aiResult && !isSelected && (
        <View style={styles.roughIconContainer}>
          <StatusIcon
            status="rough"
            size={40}
            theme={mode === 'high-contrast' ? 'beach' : 'journal'}
          />
        </View>
      )}

      <View style={styles.cardBody}>
        <Text
          style={[styles.titleText, {color: colors.text}]}
          numberOfLines={3}>
          {displayLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    zIndex: 10,
  },
  roughIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  titleText: {
    fontWeight: '800',
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
  },
  locationText: {
    fontWeight: '600',
    fontSize: 14,
  },
  sessionText: {
    fontWeight: '500',
    fontSize: 12,
  },
});
