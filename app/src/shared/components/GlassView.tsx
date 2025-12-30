import { BlurView } from 'expo-blur';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { THEME } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
};

export function GlassView({ children, style, intensity = 20 }: Props) {
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.container, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)', // Slight tint for readability
    borderRadius: THEME.layout.borderRadius,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
});
