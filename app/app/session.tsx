import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/shared/ThemeContext';
import { useSession } from '@/shared/SessionContext';
import { formatTimestamp } from '@/shared/format';

export default function SessionScreen() {
  const router = useRouter();
  const { activeSession, renameSession, endSession } = useSession();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const { colors, mode } = useTheme();

  useEffect(() => {
    if (activeSession) {
      setName(activeSession.name);
    } else {
      // If no active session, go back
      router.back();
    }
  }, [activeSession]);

  const handleSave = async () => {
    if (!activeSession || !name.trim()) return;
    setSaving(true);
    try {
      await renameSession(activeSession.id, name.trim());
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to rename session.');
    } finally {
      setSaving(false);
    }
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session?',
      'This will close the current session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await endSession();
              router.back();
            } catch {
              Alert.alert('Error', 'Could not end session.');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  if (!activeSession) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.overlay}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Session Manager</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Session Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: mode === 'high-contrast' ? '#1e293b' : colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="E.g. Morning Beach Walk"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={[styles.meta, { backgroundColor: mode === 'high-contrast' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)' }]}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              Started: {formatTimestamp(new Date(activeSession.startTime).toISOString())}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="map-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {activeSession.locationName || 'Unknown Location'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.endBtn, { borderColor: colors.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}
            onPress={handleEndSession}
            disabled={saving}
          >
            <Text style={[styles.endBtnText, { color: colors.danger }]}>End Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.text }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.background }]}>Save Name</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    gap: 24,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
  },
  meta: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  endBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtnText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
