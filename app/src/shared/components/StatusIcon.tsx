import React, {useEffect} from 'react';
import {Animated, View, ViewStyle} from 'react-native';
import Svg, {Path, Defs, LinearGradient, Stop} from 'react-native-svg';
import {IconCategory} from '../CategoryMapper';

export type StatusIconStatus = 'rough' | 'polishing' | 'polished';
export type StatusIconTheme = 'journal' | 'beach';

interface StatusIconProps {
  status: StatusIconStatus;
  category?: IconCategory;
  confidence?: number;
  size?: number;
  theme?: StatusIconTheme;
  style?: ViewStyle;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const StatusIcon: React.FC<StatusIconProps> = ({
  status = 'rough',
  category = 'mineral',
  confidence = 0,
  size = 60,
  theme = 'journal',
  style,
}) => {
  // Animation for "Polishing" state (Pulse)
  const [pulseAnim] = React.useState(() => new Animated.Value(0));

  useEffect(() => {
    if (status === 'polishing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [status, pulseAnim]);

  // Colors based on Theme
  const strokeColor = theme === 'beach' ? '#0F172A' : '#0F766E'; // Slate-900 or Teal-700
  const fillColor = theme === 'beach' ? '#FFFFFF' : 'url(#gradPacific)';
  const roughColor = theme === 'beach' ? '#94A3B8' : '#CBD5E1'; // Slate-400 or Slate-300

  // SVG Paths
  const PATHS = {
    // Shared outline for all/most (The "Pebble")
    outline: 'M20,40 Q15,10 50,15 Q85,10 80,45 Q85,85 50,90 Q15,85 20,40 Z',

    // Mineral (Agate Bands)
    mineralInner:
      'M35,45 Q32,30 50,32 Q68,30 65,45 Q68,65 50,68 Q32,65 35,45 Z',
    mineralCore: 'M42,48 Q40,40 50,42 Q60,40 58,48 Q60,58 50,60 Q40,58 42,48 Z',

    // Fossil (Ammonite Spiral) - approximate
    fossilInner:
      'M 50 50 m -15 0 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0 M 50 50 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0',

    // Artifact (Arrowhead/Shard) - sharper
    artifactOutline: 'M50,10 L80,80 L50,90 L20,80 Z',
    artifactInner: 'M50,25 L65,70 L50,75 L35,70 Z',
  };

  const isRough = status === 'rough';
  const isPolishing = status === 'polishing';
  const isPolished = status === 'polished';

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={[{width: size, height: size}, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="gradPacific" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#0F766E" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {/*
          RENDER LOGIC:
          1. Rough: Dashed Outline (Pebble)
          2. Polishing: Solid Outline (Pebble) + Pulsing Opacity
          3. Polished: Specific Shape (Mineral/Fossil/etc) + Inner Details
        */}

        {/* ROUGH STATE */}
        {isRough && (
          <Path
            d={PATHS.outline}
            stroke={roughColor}
            strokeWidth="2"
            strokeDasharray="4,4"
            fill="none"
          />
        )}

        {/* POLISHING STATE */}
        {isPolishing && (
          <>
            <Path
              d={PATHS.outline}
              stroke={strokeColor}
              strokeWidth="2"
              fill="none"
              opacity={0.5}
            />
            <AnimatedPath
              d={PATHS.mineralInner} // Generic inner shape for loading
              stroke={strokeColor}
              strokeWidth="2"
              fill="none"
              opacity={opacity}
            />
          </>
        )}

        {/* POLISHED STATE */}
        {isPolished && (
          <>
            {/* Outline based on category */}
            <Path
              d={
                category === 'artifact' ? PATHS.artifactOutline : PATHS.outline
              }
              stroke={strokeColor}
              strokeWidth="3"
              fill={fillColor}
            />

            {/* Inner Details based on category */}
            {category === 'mineral' && (
              <>
                <Path
                  d={PATHS.mineralInner}
                  stroke={strokeColor}
                  strokeWidth="2"
                  fill="none"
                />
                {confidence > 0.8 && (
                  <Path
                    d={PATHS.mineralCore}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    fill="none"
                  />
                )}
              </>
            )}

            {category === 'fossil' && (
              <Path
                d={PATHS.fossilInner}
                stroke={strokeColor}
                strokeWidth="2"
                fill="none"
              />
            )}

            {category === 'artifact' && (
              <Path
                d={PATHS.artifactInner}
                stroke={strokeColor}
                strokeWidth="2"
                fill="none"
              />
            )}
          </>
        )}
      </Svg>
    </View>
  );
};
