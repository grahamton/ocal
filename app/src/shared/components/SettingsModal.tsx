
import React from 'react';
import { Modal, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { DataManager } from '../../features/settings/DataManager';

export function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
            <ThemeToggle />
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>AI Configuration</Text>
            <RangerModeToggle />
        </View>

        <DataManager />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  header: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  closeBtn: {
      padding: 8,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  }
});

function ThemeToggle() {
    const { mode, toggleTheme, colors } = useTheme();
    const isHighContrast = mode === 'high-contrast';

    return (
        <TouchableOpacity
            onPress={toggleTheme}
            style={[
                styles.toggleBtn,
                {
                    backgroundColor: isHighContrast ? '#0f172a' : '#fff',
                    borderColor: colors.border
                }
            ]}
        >
            <Ionicons
                name={isHighContrast ? "sunny" : "moon"}
                size={24}
                color={isHighContrast ? "#fbbf24" : "#6366f1"}
            />
            <View style={{flex: 1}}>
                <Text style={{fontWeight: '700', color: isHighContrast ? '#fff' : '#0f172a', fontSize: 16}}>
                    {isHighContrast ? 'Beach Mode (High Contrast)' : 'Journal Mode (Standard)'}
                </Text>
                <Text style={{color: isHighContrast ? '#94a3b8' : '#64748b', fontSize: 13}}>
                    {isHighContrast ? 'Optimized for bright sunlight' : 'Softer colors for relaxation'}
                </Text>
            </View>
            <Ionicons
                name={isHighContrast ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={colors.accent}
            />
        </TouchableOpacity>
    );
}

import { RangerSettings } from '../../ai/RangerSettings';
import { RangerMode } from '../../ai/RangerConfig';
import { useState, useEffect } from 'react';

function RangerModeToggle() {
    const { colors } = useTheme();
    const [mode, setMode] = useState<RangerMode>('explore');

    useEffect(() => {
        RangerSettings.getMode().then(setMode);
    }, []);

    const toggle = async () => {
        const next = mode === 'explore' ? 'ship' : 'explore';
        setMode(next);
        await RangerSettings.setMode(next);
    };

    const isExplore = mode === 'explore';

    return (
        <TouchableOpacity
            onPress={toggle}
            style={[
                styles.toggleBtn,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border
                }
            ]}
        >
            <Ionicons
                name={isExplore ? "compass" : "rocket"}
                size={24}
                color={isExplore ? "#10b981" : "#f43f5e"}
            />
            <View style={{flex: 1}}>
                <Text style={{fontWeight: '700', color: colors.text, fontSize: 16}}>
                    {isExplore ? 'Explore Mode (Dev)' : 'Ship Mode (Strict)'}
                </Text>
                <Text style={{color: colors.textSecondary, fontSize: 13}}>
                    {isExplore ? 'Structured brainstorming & discovery' : 'Strict schema for production'}
                </Text>
            </View>
            <Ionicons
                name={isExplore ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={colors.accent}
            />
        </TouchableOpacity>
    );
}
