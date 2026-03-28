import React, {useState} from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/shared/ThemeContext';
import { useSession } from '@/shared/SessionContext';
import { StatusIcon } from '@/shared/components/StatusIcon';
import { GlassView } from '@/shared/components/GlassView';
import { THEME } from '@/shared/theme';
import { SessionControlModal } from './SessionControlModal';

export function MainHeader() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const { activeSession, startSession } = useSession();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSessionPress = async () => {
    if (activeSession) {
      setModalVisible(true);
    } else {
      // Start session immediately or go to session screen?
      // User said flow is broken, let's make it direct.
      try {
        await startSession();
      } catch (error) {
        console.error('Failed to start session', error);
      }
    }
  };

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
            onPress={handleSessionPress}
            style={{ width: '100%' }}
            activeOpacity={0.8}>
            <GlassView
              style={[
                styles.sessionPillContainer,
                activeSession ? {
                  backgroundColor: mode === 'high-contrast' ? colors.success + '40' : colors.success + '15',
                  borderColor: colors.success + '40',
                  borderWidth: 1,
                } : { 
                  justifyContent: 'center', 
                  opacity: 0.8,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
              intensity={activeSession ? 20 : 10}>
              {activeSession && (
                <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
              )}
              <Text
                style={[
                  styles.sessionPillText,
                  {
                    color: activeSession ? (mode === 'high-contrast' ? colors.text : colors.success) : colors.textSecondary,
                    textAlign: activeSession ? 'left' : 'center',
                    fontWeight: activeSession ? '800' : '600',
                  },
                  !activeSession && { fontSize: 13 },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {activeSession ? activeSession.name : 'Start Walk'}
              </Text>
              <Ionicons
                name={activeSession ? "options-outline" : "add-circle-outline"}
                size={activeSession ? 16 : 18}
                color={activeSession ? (mode === 'high-contrast' ? colors.text : colors.success) : colors.textSecondary}
                style={{ marginLeft: 4, flexShrink: 0 }}
              />
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

      <SessionControlModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        session={activeSession}
      />
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
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
});
