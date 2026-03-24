import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/shared/ThemeContext';
import { useSession } from '@/shared/SessionContext';
import { StatusIcon } from './StatusIcon';
import { GlassView } from './GlassView';
import { THEME } from '@/shared/theme';

export function MainHeader() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const { activeSession } = useSession();

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {/* Left: Logo Only */}
        <StatusIcon
          status="polished"
          category="mineral"
          size={32}
          theme={mode === 'high-contrast' ? 'beach' : 'journal'}
        />

        {/* Center: Session Pill (Expanded) */}
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/session')}
            style={{ width: '100%' }}
            activeOpacity={0.8}>
            <GlassView
              style={[
                styles.sessionPillContainer,
                !activeSession && { justifyContent: 'center', opacity: 0.8 },
              ]}
              intensity={10}>
              <Text
                style={[
                  styles.sessionPillText,
                  {
                    color: colors.accent,
                    textAlign: activeSession ? 'left' : 'center',
                  },
                  !activeSession && { fontWeight: '600', fontSize: 13 },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {activeSession ? activeSession.name : 'Start Session'}
              </Text>
              {activeSession && (
                <Ionicons
                  name="create-outline"
                  size={14}
                  color={colors.accent}
                  style={{ marginLeft: 4, flexShrink: 0 }}
                />
              )}
            </GlassView>
          </TouchableOpacity>
        </View>

        {/* Right: Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.push('/insights')}
            style={{ padding: 8 }}>
            <Ionicons
              name="analytics-outline"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={{ padding: 8 }}>
            <Ionicons
              name="settings-outline"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionPillContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  sessionPillText: {
    ...THEME.typography.label,
    flexShrink: 1,
  },
});
