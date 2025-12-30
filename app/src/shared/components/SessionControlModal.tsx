import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { useSession } from '../SessionContext';
import { Session } from '../types';
import { formatTimestamp } from '../format';

type Props = {
  visible: boolean;
  onClose: () => void;
  session: Session | null;
};

export function SessionControlModal({ visible, onClose, session }: Props) {
  const { renameSession, endSession } = useSession();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const { colors, mode } = useTheme();

  useEffect(() => {
    if (session) {
      setName(session.name);
    }
  }, [session]);

  const handleSave = async () => {
    if (!session || !name.trim()) return;
    setSaving(true);
    try {
      await renameSession(session.id, name.trim());
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to rename session.');
    } finally {
      setSaving(false);
    }
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session?',
      'This will close the current session. You can verify finds in the Review Deck later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
            text: 'End Session',
            style: 'destructive',
            onPress: async () => {
                setSaving(true);
                try {
                    await endSession();
                    onClose();
                } catch {
                    Alert.alert('Error', 'Could not end session.');
                } finally {
                    setSaving(false);
                }
            }
        }
      ]
    );
  };

  if (!session) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Session Manager</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Session Name</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: mode === 'high-contrast' ? '#1e293b' : colors.background,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={name}
                onChangeText={setName}
                placeholder="E.g. Morning Beach Walk"
                placeholderTextColor={colors.textSecondary}
              />
          </View>

          <View style={[styles.meta, { backgroundColor: mode === 'high-contrast' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>Started: {formatTimestamp(new Date(session.startTime).toISOString())}</Text>
              </View>
              <View style={styles.metaItem}>
                  <Ionicons name="map-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{session.locationName || 'Unknown Location'}</Text>
              </View>
          </View>

          <View style={styles.actions}>
              <TouchableOpacity style={[styles.endBtn, { borderColor: colors.danger, backgroundColor: 'rgba(239, 68, 68, 0.05)' }]} onPress={handleEndSession} disabled={saving}>
                  <Text style={[styles.endBtnText, { color: colors.danger }]}>End Session</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.text }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color={colors.background} /> : <Text style={[styles.saveBtnText, { color: colors.background }]}>Save Name</Text>}
              </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    // colors inline
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
    fontFamily: 'Outfit_800ExtraBold',
    // color inline
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    // color inline
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14, // Slightly less padding
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    // colors inline
  },
  meta: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
    // bg inline
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    // color inline
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch', // Ensure equal height
  },
  endBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8, // Reduce horizontal padding to prevent wrap
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // colors inline
  },
  endBtnText: {
    fontSize: 15, // Slightly smaller
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    textAlign: 'center',
    // color inline
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // bg inline
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    // color inline
  },
});
