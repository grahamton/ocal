import {StyleSheet, View, ViewProps} from 'react-native';
import {useTheme} from '../ThemeContext';

export function GradientBackground({children, style, ...props}: ViewProps) {
  const {colors} = useTheme();

  return (
    <View
      style={[styles.container, {backgroundColor: colors.background}, style]}
      {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
