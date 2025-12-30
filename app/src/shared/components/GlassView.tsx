import { StyleProp, View, ViewStyle } from 'react-native';
import { THEME } from '../theme';
import { useTheme } from '../ThemeContext';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number; // Deprecated but kept for API compat
};

export function GlassView({ children, style }: Props) {
  const { mode, colors } = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: mode === 'high-contrast' ? 2 : 1,
    borderRadius: THEME.layout.borderRadius,
    overflow: 'hidden',
    // Journal Mode: Subtle Shadow
    ...(mode === 'journal' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    } : {}),
  };

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
}

