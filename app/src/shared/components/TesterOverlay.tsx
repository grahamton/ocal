import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../LogService';

export function TesterOverlay() {
  const [visible, setVisible] = useState(false); // Modal visibility
  const [note, setNote] = useState('');
  const [exporting, setExporting] = useState(false);

  // If not dev, return null? Or maybe we want this in release for specific users?
  // For now, let's keep it generally available but maybe discreet.
  if (!__DEV__) return null;

  const handleOpen = () => {
    setVisible(true);
    // Log that the tester opened the feedback tool
    logger.add('user', 'Tester opened feedback overlay');
  };

  const handleClose = () => {
    setVisible(false);
    setNote('');
  };

  const handleSaveNote = () => {
    if (!note.trim()) return;
    logger.add('user', `[FEEDBACK] ${note}`);
    handleClose();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await logger.exportLogs();
    } finally {
      setExporting(false);
      handleClose(); // Close after export
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleOpen}>
        <Ionicons name="bug-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Feedback Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Tester Feedback</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>What&apos;s happening?</Text>
            <TextInput
              style={styles.input}
              placeholder="Dictate or type your consistent feedback..."
              placeholderTextColor="#64748b"
              multiline
              autoFocus
              value={note}
              onChangeText={setNote}
            />

            <View style={styles.actions}>

              <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
                {exporting ? <ActivityIndicator color="#fff" /> : <Ionicons name="share-outline" size={20} color="#fff" />}
                <Text style={styles.btnText}>Export Logs</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                <Text style={styles.saveBtnText}>Log Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    top: 60, // Top right, below basic status bar area
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(234, 179, 8, 0.9)', // Yellow-500
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 9999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20, // Bottom safe area
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#334155',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#eab308', // Yellow-500
  },
  saveBtnText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 16,
  },
});
