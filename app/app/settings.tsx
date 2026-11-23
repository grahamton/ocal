import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useTheme} from '@/shared/ThemeContext';
import {ThemeMode} from '@/shared/theme';
import {DataManager} from '@/features/settings/DataManager';
import {AlLengthPicker} from '@/features/settings/AlLengthPicker';

const LOOKS: {mode: ThemeMode; label: string; sub: string; bg: string; fg: string}[] = [
  {mode: 'journal', label: 'Soft', sub: '(indoors)', bg: '#FDFBF7', fg: '#1e293b'},
  {mode: 'high-contrast', label: 'Bright sun', sub: '(black & white)', bg: '#000000', fg: '#ffffff'},
];

export default function SettingsScreen() {
  const {colors, mode, setTheme} = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top}]}>
      <View style={[styles.topBar, {borderBottomColor: colors.border}]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.back, {borderColor: colors.text, backgroundColor: colors.card}]}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
          <Text style={[styles.backText, {color: colors.text}]}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, {color: colors.text}]} accessibilityRole="header">
          Settings
        </Text>

        <Text style={[styles.heading, {color: colors.text}]}>How it looks</Text>
        <View style={styles.looks}>
          {LOOKS.map(look => {
            const active = mode === look.mode;
            return (
              <TouchableOpacity
                key={look.mode}
                style={[
                  styles.look,
                  {
                    backgroundColor: look.bg,
                    borderColor: active ? colors.accent : colors.text,
                    borderWidth: active ? 4 : 2,
                  },
                ]}
                onPress={() => setTheme(look.mode)}
                accessibilityRole="button"
                accessibilityState={{selected: active}}>
                <Text style={[styles.lookText, {color: look.fg}]}>
                  {active ? '✓ ' : ''}
                  {look.label}
                </Text>
                <Text style={[styles.lookText, {color: look.fg, fontWeight: '600'}]}>
                  {look.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <AlLengthPicker />

        <DataManager />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  topBar: {paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2},
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingLeft: 12,
    paddingRight: 22,
    borderRadius: 28,
    borderWidth: 2,
    gap: 4,
  },
  backText: {fontSize: 20, fontWeight: '800'},
  content: {padding: 16, gap: 14, paddingBottom: 48},
  title: {fontSize: 34, fontWeight: '800', fontFamily: 'Outfit_800ExtraBold'},
  heading: {fontSize: 24, fontWeight: '800', fontFamily: 'Outfit_800ExtraBold', marginTop: 8},
  looks: {flexDirection: 'row', gap: 12},
  look: {flex: 1, minHeight: 80, borderRadius: 18, padding: 10, alignItems: 'center', justifyContent: 'center'},
  lookText: {fontSize: 18, fontWeight: '800', textAlign: 'center'},
});
