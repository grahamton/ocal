import { useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassView } from '../../shared/components/GlassView';
import { THEME, PALETTE } from '../../shared/theme';
import { FindRecord } from '../../shared/types';

type Props = {
  item: FindRecord;
  onToggleKeep: (id: string, current: boolean) => void;
};

export function LedgerTile({ item, onToggleKeep }: Props) {
  const [scale] = useState(() => new Animated.Value(1));
  const [kept, setKept] = useState(item.favorite);

  // Sync if prop changes externally (e.g. from full refresh)
  if (item.favorite !== kept) {
    setKept(item.favorite);
  }

  const handlePress = () => {
    // Optimistic update
    const next = !kept;
    setKept(next);

    // Pop animation
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Fire & Forget (parent will refresh eventually)
    onToggleKeep(item.id, item.favorite);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <GlassView style={styles.tile} intensity={25}>
        <Image source={{ uri: item.photoUri }} style={styles.thumb} />

        {/* Top-left star badge */}
        <TouchableOpacity
          style={styles.selectBadge}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Text style={[styles.selectText, kept && styles.selectTextActive]}>
            {kept ? '★' : '☆'}
          </Text>
        </TouchableOpacity>

        <View style={styles.meta}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label || 'Unlabeled'}
          </Text>

          {/* Bottom "Keep" Chip */}
          <TouchableOpacity
            style={[styles.keepChip, kept && styles.keepChipActive]}
            onPress={handlePress}
            activeOpacity={0.85}
          >
            <Text style={[styles.keepText, kept && styles.keepTextActive]}>
              {kept ? 'Kept' : 'Keep'}
            </Text>
          </TouchableOpacity>
        </View>
      </GlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 160,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  selectBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectText: {
    fontWeight: '900',
    color: '#0f172a',
    fontSize: 18, // 16 -> 18
  },
  selectTextActive: {
    color: '#f59e0b',
  },
  meta: {
    padding: 14, // 10 -> 14
    gap: 10,
  },
  label: {
    ...THEME.typography.body,
    fontWeight: '700',
    color: THEME.colors.text,
    fontSize: 16, // inherited but ensure bold stands out
  },
  keepChip: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  keepChipActive: {
    backgroundColor: PALETTE.electricTeal,
    borderColor: PALETTE.electricTeal,
  },
  keepText: {
    ...THEME.typography.label,
    fontSize: 13, // 12 -> 13
  },
  keepTextActive: {
    color: PALETTE.oceanDark,
  },
});
