import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  isFlipped: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  style?: ViewStyle;
};

export function FlipCard({ isFlipped, front, back, style }: Props) {
  const [animatedValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFlipped ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [isFlipped, animatedValue]);

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      <Animated.View
        style={[styles.card, frontAnimatedStyle]}
        pointerEvents={isFlipped ? 'none' : 'auto'}
      >
        {front}
      </Animated.View>
      <Animated.View
        style={[styles.card, backAnimatedStyle]}
        pointerEvents={isFlipped ? 'auto' : 'none'}
      >
        {back}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensure container fills parent
  },
  card: {
    backfaceVisibility: 'hidden',
    width: '100%',
    height: '100%',
    position: 'absolute', // Ensure both stack on top of each other
  },
});
