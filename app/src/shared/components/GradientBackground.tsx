import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, ViewProps } from 'react-native';
import { PALETTE } from '../theme';

export function GradientBackground({ children, style, ...props }: ViewProps) {
  return (
    <LinearGradient
      // Deep Ocean Gradient
      colors={[PALETTE.oceanDark, '#0f172a', '#1e1b4b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
