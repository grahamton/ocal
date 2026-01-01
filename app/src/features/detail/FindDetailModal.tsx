import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { updateFindMetadata, getFind, deleteFind, getSession } from '../../shared/db';
import { FindRecord } from '../../shared/types';
import { IdentifyQueueService } from '../../ai/IdentifyQueueService';
// import { RockIdResult } from '../../ai/rockIdSchema'; // Not used strictly anymore
import { formatLocationSync } from '../../shared/format';
import { useTheme } from '../../shared/ThemeContext';
import { StatusIcon } from '../../../components/StatusIcon';
import { getCategoryFromTags } from '../../../utils/CategoryMapper';
import { RawJsonInspector } from '../../../components/RawJsonInspector';

type Props = {
  visible: boolean;
  item: FindRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

export function FindDetailModal({ visible, item, onClose, onSaved }: Props) {
  const { colors, mode } = useTheme();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<Record<string, any> | null>(null);
  const [localItem, setLocalItem] = useState<FindRecord | null>(item);
  const [sessionName, setSessionName] = useState<string | null>(null);

  useEffect(() => {
    if (item && visible) {
      setLabel(item.label ?? '');
      setNote(item.note ?? '');
      setFavorite(item.favorite);
      setAiError(null);
      setAiResult(item.aiData || null);
      setLocalItem(item);
      setAiLoading(false);
      setSessionName(null);

      if (item.sessionId) {
        getSession(item.sessionId).then(s => {
            if (s) setSessionName(s.name);
        });
      }
    }
  }, [item, visible]);

  // Poll for queue updates if waiting for AI
  useEffect(() => {
    if (!visible || !item || aiResult) return;

    let mounted = true;
    const checkQueue = async () => {
      const qItem = await IdentifyQueueService.getQueueStatus(item.id);

      if (!mounted) return;

      if (qItem && (qItem.status === 'pending' || qItem.status === 'processing')) {
        setAiLoading(true);
        setTimeout(checkQueue, 2000);
      } else if (qItem && qItem.status === 'completed') {
        const fresh = await getFind(item.id);
        if (fresh && fresh.aiData && mounted) {
          setAiResult(fresh.aiData);
          setLocalItem(fresh);
          setAiLoading(false);
        }
      } else if (qItem && qItem.status === 'failed') {
        setAiError(qItem.error || 'Request failed');
        setAiLoading(false);
      } else {
        // Not in queue? It might have just finished (row deleted).
        // Check the main table one last time.
        const fresh = await getFind(item.id);
        if (fresh && fresh.aiData) {
          setAiResult(fresh.aiData);
          setLocalItem(fresh);
        }
        setAiLoading(false);
      }
    };

    checkQueue();

    return () => { mounted = false; };
  }, [visible, item, aiResult]);

  const handleSave = async () => {
    if (!item || saving) return;
    setSaving(true);
    try {
      await updateFindMetadata(item.id, {
        label: label.trim() || null,
        note: note.trim() || null,
        status: 'cataloged',
        favorite,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete this find?",
      "This cannot be undone.",
      [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
            try {
                // Safe access
                if (item?.id) {
                    await deleteFind(item.id);
                    onClose?.();
                }
            } catch {
                Alert.alert("Error", "Could not delete");
            }
        }
      }
    ]);
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(item.photoUri);
      } else {
        Alert.alert('Sharing not available', 'Sharing is not supported on this device/simulator.');
      }
    } catch (error) {
      console.error('Share failed', error);
      Alert.alert('Error', 'Could not share image.');
    }
  };

  const runIdentify = async () => {
    if (!item || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      await IdentifyQueueService.addToQueue(item.id);
    } catch (_e) {
      setAiError('Could not start analysis.');
      setAiLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  if (!localItem) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>

        {/* Close Button (Absolute) */}
        <TouchableOpacity style={[styles.closeBtn, { zIndex: 50 }]} onPress={onClose}>
           <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: localItem.photoUri }} style={styles.heroImage} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.1)' }]} pointerEvents="none" />
        </View>

        {/* Content Scroll */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* State A: Unanalyzed */}
          {!aiResult && !aiLoading && (
            <TouchableOpacity
              style={[styles.analyzeButton, { backgroundColor: colors.accent }]}
              onPress={runIdentify}
            >
              <Ionicons name="sparkles" size={24} color="#fff" />
              <Text style={styles.analyzeButtonText}>Identify Rock Buddy</Text>
            </TouchableOpacity>
          )}

          {/* Loading State */}
          {aiLoading && (
            <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.text }]}>Analyzing your find...</Text>
            </View>
          )}

          {/* Error State */}
          {aiError && (
            <View style={[styles.errorCard, { backgroundColor: '#fef2f2', borderColor: '#ef4444' }]}>
              <Ionicons name="alert-circle" size={24} color="#ef4444" />
              <Text style={styles.errorText}>{aiError}</Text>
              <TouchableOpacity onPress={runIdentify}>
                <Text style={[styles.retryText, { color: colors.accent }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* State B: Analyzed - Info Dock */}
          {aiResult && (
            <>
              <View style={[styles.infoDock, { backgroundColor: colors.card }]}>
                {/* Title Row */}
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.title, { color: colors.text }]}
                    accessibilityRole="header"
                  >
                    {label || aiResult.best_guess?.label || 'Unknown Rock'}
                  </Text>
                  <TouchableOpacity onPress={() => setFavorite(p => !p)}>
                    <Ionicons
                      name={favorite ? "star" : "star-outline"}
                      size={32}
                      color={favorite ? "#fbbf24" : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Metadata Row */}
                <Text style={[styles.metadata, { color: colors.textSecondary }]}>
                  {(localItem.location_text || formatLocationSync(localItem.lat, localItem.long))}
                  {sessionName ? ` • ${sessionName}` : ''} • {formatDate(localItem.timestamp)}
                </Text>
              </View>

              {/* Dynamic Content Renderer */}
              <View style={[styles.labCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

                {/* Dynamic Header (Polished/Rough Status) */}
                <View style={styles.labHeader}>
                   <StatusIcon
                      status={aiResult ? 'polished' : (aiLoading ? 'polishing' : 'rough')}
                      category={getCategoryFromTags([aiResult?.best_guess?.category || ''], aiResult?.best_guess?.label)}
                      confidence={aiResult?.best_guess?.confidence || 0}
                      size={40}
                      theme={mode === 'high-contrast' ? 'beach' : 'journal'}
                   />
                   <View style={{justifyContent: 'center', flex: 1}}>
                       <Text style={[styles.labTitle, { color: colors.text }]}>
                          {aiResult ? 'ANALYSIS COMPLETE' : (aiLoading ? 'ANALYZING...' : 'READY TO SCAN')}
                       </Text>
                   </View>
                </View>

                {/* Dynamic Content Loop */}
                {aiResult && Object.entries(aiResult).map(([key, value]) => {
                    if (key === 'best_guess') return null; // Handled in header
                    if (key.includes('deprecated')) return null;

                    return (
                      <View key={key} style={styles.labSection}>
                         <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
                             <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                             <Text style={[styles.labSectionTitle, {marginBottom: 0}]}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
                         </View>

                         {typeof value === 'object' && value !== null ? (
                            <View style={{gap: 8}}>
                                {Object.entries(value).map(([subKey, subValue]) => (
                                    <View key={subKey} style={styles.factChip}>
                                         <Text style={[styles.factLabel, {color: colors.textSecondary}]}>{subKey.replace(/_/g, ' ')}</Text>
                                         <Text style={[styles.factValue, {color: colors.text}]}>
                                            {/* Handle nested arrays (e.g. catalog tags) simply for now */}
                                            {Array.isArray(subValue)
                                                ? subValue.join(', ')
                                                : (typeof subValue === 'string' ? subValue : JSON.stringify(subValue))}
                                         </Text>
                                    </View>
                                ))}
                            </View>
                         ) : (
                            <Text style={{color: colors.text}}>{String(value)}</Text>
                         )}
                      </View>
                    );
                })}

                {/* Notes Section */}
                <View style={styles.notesSection}>
                  <Text style={[styles.labSectionTitle, { color: colors.textSecondary, marginTop: 12 }]}>YOUR FIELD NOTES</Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    style={[styles.notesInput, {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                      minHeight: 80
                    }]}
                    placeholder="Add your story about this find..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                 {/* Field Data */}
                <View style={[styles.labSection, {borderTopWidth: 0}]}>
                   <Text style={[styles.monoText, { color: colors.textSecondary, textAlign: 'center', opacity: 0.6 }]}>
                     ID: {localItem.id.slice(0,8)}... • GPS: {localItem.lat?.toFixed(4)}, {localItem.long?.toFixed(4)}
                   </Text>
                </View>

                {/* Raw Inspector for Dev/Discovery */}
                <RawJsonInspector data={aiResult} />

              </View>
            </>
          )}
          {/* Bottom padding for sticky footer */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Sticky Action Footer */}
        <View style={[styles.actionFooter, {
          backgroundColor: colors.background,
          borderTopColor: colors.border
        }]}>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: colors.border }]}
            onPress={handleShare}
          >
             <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { borderColor: '#ef4444' }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.accent }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: '42%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  loadingCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoDock: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    flex: 1,
  },
  metadata: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Scientist View Styles
  labCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  labHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  labTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  meterContainer: {
    gap: 6,
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meterLabel: { fontSize: 13, fontWeight: '600' },
  meterValue: { fontSize: 13, fontWeight: '700' },
  meterTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 3 },

  labSection: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  labSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  evidenceItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  evidenceText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  altName: { fontSize: 14, fontWeight: '500' },
  altProb: { fontSize: 14 },

  monoText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },

  notesSection: {
    gap: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  actionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    // Legacy mapping if needed, but handled by iconButton now
  },
  factGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  factChip: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    gap: 4,
  },
  factLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  factValue: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left',
  },
  didYouKnowBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
  },
  didYouKnowTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  didYouKnowText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
});
