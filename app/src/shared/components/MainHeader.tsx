import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useTheme} from '@/shared/ThemeContext';

type Props = {title?: string};

// Top bar: an optional screen title and one labeled Settings button.
export function MainHeader({title}: Props) {
  const router = useRouter();
  const {colors} = useTheme();

  return (
    <View style={styles.row}>
      {title ? (
        <Text style={[styles.title, {color: colors.text}]} accessibilityRole="header">
          {title}
        </Text>
      ) : (
        <View />
      )}
      <TouchableOpacity
        onPress={() => router.push('/settings')}
        style={[styles.button, {borderColor: colors.text, backgroundColor: colors.card}]}
        accessibilityRole="button"
        accessibilityLabel="Settings">
        <Ionicons name="settings-outline" size={26} color={colors.text} />
        <Text style={[styles.buttonText, {color: colors.text}]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  title: {fontSize: 34, fontFamily: 'Outfit_800ExtraBold', flexShrink: 1},
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: 28,
    borderWidth: 2,
  },
  buttonText: {fontSize: 18, fontWeight: '700', fontFamily: 'Outfit_700Bold'},
});
