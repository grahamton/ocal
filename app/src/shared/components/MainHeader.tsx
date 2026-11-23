import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useTheme} from '@/shared/ThemeContext';
import {useSession} from '@/shared/SessionContext';
import {StatusIcon} from '@/shared/components/StatusIcon';
import {GlassView} from '@/shared/components/GlassView';
import {SessionControlModal} from './SessionControlModal';

export function MainHeader() {
  const router = useRouter();
  const {colors, mode} = useTheme();
  const {activeSession, startSession} = useSession();
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
        <View style={{flex: 1, paddingHorizontal: 12}}>
          <TouchableOpacity
            onPress={handleSessionPress}
            style={{width: '100%'}}
            activeOpacity={0.8}>
            <GlassView
              style={[
                styles.sessionPillContainer,
                activeSession
                  ? {
                      backgroundColor: colors.card,
                      borderColor: colors.accent,
                      borderWidth: 2,
                    }
                  : {
                      justifyContent: 'center',
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 2,
                    },
              ]}
              intensity={0}>
              {activeSession && (
                <View
                  style={[styles.pulseDot, {backgroundColor: colors.success}]}
                />
              )}
              <Text
                style={[
                  styles.sessionPillText,
                  {
                    color: colors.text,
                    textAlign: activeSession ? 'left' : 'center',
                    fontWeight: activeSession ? '800' : '600',
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {activeSession ? activeSession.name : 'Start Walk'}
              </Text>
              <Ionicons
                name={activeSession ? 'options-outline' : 'add-circle-outline'}
                size={24}
                color={colors.text}
                style={{marginLeft: 4, flexShrink: 0}}
              />
            </GlassView>
          </TouchableOpacity>
        </View>

        {/* Right: Actions */}
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={{padding: 12}}
            accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={28} color={colors.text} />
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
    paddingHorizontal: 14,
    minHeight: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  sessionPillText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    flexShrink: 1,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
});
