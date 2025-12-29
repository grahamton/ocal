import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import { updateFindMetadata } from '../../shared/db';
import { FindRecord } from '../../shared/types';
import { identifyRock } from '../../ai/identifyRock';
import { formatCoords } from '../../shared/format';
import { SinglePosterView } from '../poster/SinglePosterView';

type Props = {
  visible: boolean;
  item: FindRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

const CATEGORY_OPTIONS = ['Unsorted', 'Agate', 'Jasper', 'Fossil', 'Driftwood', 'Other'];
const STATUS_OPTIONS: Array<{ value: 'draft' | 'cataloged'; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'cataloged', label: 'Cataloged' },
];

// Context: Phase 2 - detail view, notes, manual categories.
export function FindDetailModal({ visible, item, onClose, onSaved }: Props) {
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'draft' | 'cataloged'>('draft');
  const [label, setLabel] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  type AiResult = {
    best_guess?: { label?: string; confidence?: number; category?: string };
    alternatives?: Array<{ label: string; confidence: number }>;
    observable_reasons?: string[];
    caution?: string[];
    red_flags?: string[];
    catalog_tags?: { type?: string[] };
  };

  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [posterVisible, setPosterVisible] = useState(false);

  useEffect(() => {
    if (item) {
      setLabel(item.label ?? '');
      setNote(item.note ?? '');
      setCategory(item.category ?? null);
      setStatus(item.status);
      setFavorite(item.favorite);
      setSessionId(item.sessionId ?? null);
      setAiError(null);
      setAiResult(null);
      setAiLoading(false);
    }
  }, [item]);

  const styles = useMemo(() => createStyles(), []);

  const formatTimestamp = (value: string) => {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleSave = async () => {
    if (!item || saving) return;
    setSaving(true);
    try {
      await updateFindMetadata(item.id, {
        label: label.trim() || null,
        note: note.trim() || null,
        category: category === 'Unsorted' ? null : category,
        status,
        favorite,
        sessionId,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const formatLocationHint = (lat: number | null, long: number | null) => {
    if (lat == null || long == null) return '';
    return `${lat.toFixed(4)}, ${long.toFixed(4)}`;
  };

  const runIdentify = async () => {
    if (!item || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const fileData = await FileSystem.readAsStringAsync(item.photoUri, { encoding: FileSystem.EncodingType.Base64 });
      const dataUrl = `data:image/jpeg;base64,${fileData}`;
      const result = await identifyRock({
        imageDataUrls: [dataUrl],
        locationHint: formatLocationHint(item.lat, item.long),
        contextNotes: note || label || 'Beach find',
        userGoal: 'quick_id',
        provider: 'gemini',
      });
      setAiResult(result);
    } catch (err) {
      setAiError((err as Error)?.message || 'Identify failed');
    } finally {
      setAiLoading(false);
    }
  };

  const applyTags = () => {
    if (!aiResult) return;
    const best = aiResult.best_guess;
    if (best?.label) setLabel(best.label);
    if (aiResult.catalog_tags?.type?.[0]) setCategory(aiResult.catalog_tags.type[0]);
    if (aiResult.observable_reasons?.[0]) setNote((prev) => prev || aiResult.observable_reasons.join('; '));
  };

  if (!item) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.posterButton} onPress={() => setPosterVisible(true)}>
                <Text style={styles.posterText}>✨ Poster</Text>
              </TouchableOpacity>
            </View>
            <Image source={{ uri: item.photoUri }} style={styles.hero} />
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Captured {formatTimestamp(item.timestamp)}</Text>
              <Text style={styles.metaText}>{formatCoords(item.lat, item.long)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Session</Text>
              <Text style={styles.metaText}>{sessionId ? 'Linked to a session' : 'Unsorted'}</Text>
              {sessionId ? <Text style={styles.metaSubtle}>{sessionId}</Text> : null}
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Favorite</Text>
              <TouchableOpacity
                style={[styles.favoriteChip, favorite && styles.favoriteChipActive]}
                onPress={() => setFavorite((prev) => !prev)}
              >
                <Text style={[styles.favoriteText, favorite && styles.favoriteTextActive]}>
                  {favorite ? 'Starred for ledger' : 'Mark favorite'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Label</Text>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="Name this find (e.g., Red agate)"
                placeholderTextColor="#9ca3af"
                style={styles.labelInput}
                accessibilityLabel="Label for this find"
              />
            </View>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[styles.presetButton, styles.presetPrimary]}
                onPress={() => {
                  setCategory('Agate');
                  setStatus('cataloged');
                  setLabel((prev) => (prev ? prev : 'Agate find'));
                  setNote((prev) => prev || 'Saved as Agate');
                }}
                disabled={saving}
              >
                <Text style={styles.presetTextPrimary}>One-tap: Agate + Cataloged</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => {
                  setCategory('Unsorted');
                  setStatus('draft');
                }}
                disabled={saving}
              >
                <Text style={styles.presetText}>Mark Draft</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.section}>
              <View style={styles.identifyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Identify (AI)</Text>
                  <Text style={styles.metaText}>Optional helper for sorting</Text>
                </View>
                <TouchableOpacity style={styles.identifyButton} onPress={runIdentify} disabled={aiLoading}>
                  {aiLoading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.identifyText}>Run AI</Text>}
                </TouchableOpacity>
              </View>
              {aiError ? <Text style={styles.errorText}>{aiError}</Text> : null}
              {aiLoading ? <Text style={styles.metaText}>Analyzing photo...</Text> : null}
              {aiResult ? (
                <View style={styles.aiCard}>
                  <Text style={styles.aiTitle}>
                    Best guess: {aiResult.best_guess?.label ?? 'Unknown'} ({Math.round((aiResult.best_guess?.confidence ?? 0) * 100)}%)
                  </Text>
                  <Text style={styles.metaText}>Category: {aiResult.best_guess?.category ?? 'unknown'}</Text>
                  {aiResult.alternatives?.length ? (
                    <View style={styles.aiSection}>
                      <Text style={styles.label}>Alternatives</Text>
                      {aiResult.alternatives.map((alt, idx: number) => (
                        <Text key={idx} style={styles.metaText}>
                          {alt.label} ({Math.round((alt.confidence ?? 0) * 100)}%)
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {aiResult.observable_reasons?.length ? (
                    <View style={styles.aiSection}>
                      <Text style={styles.label}>Reasons</Text>
                      {aiResult.observable_reasons.map((reason: string, idx: number) => (
                        <Text key={idx} style={styles.metaText}>- {reason}</Text>
                      ))}
                    </View>
                  ) : null}
                  {aiResult.caution?.length ? (
                    <View style={styles.aiSection}>
                      <Text style={styles.label}>Caution</Text>
                      {aiResult.caution.map((c: string, idx: number) => (
                        <Text key={idx} style={styles.metaText}>- {c}</Text>
                      ))}
                    </View>
                  ) : null}
                  {aiResult.red_flags?.length ? (
                    <View style={styles.aiSection}>
                      <Text style={styles.label}>Red flags</Text>
                      {aiResult.red_flags.map((c: string, idx: number) => (
                        <Text key={idx} style={styles.metaText}>- {c}</Text>
                      ))}
                    </View>
                  ) : null}
                  <TouchableOpacity style={styles.applyButton} onPress={applyTags}>
                    <Text style={styles.applyText}>Apply tags</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="What did you notice?"
                placeholderTextColor="#9ca3af"
                multiline
                style={styles.input}
                accessibilityLabel="Notes about this find"
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORY_OPTIONS.map((option) => {
                  const selected = (category ?? 'Unsorted') === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setCategory(option)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.chipRow}>
                {STATUS_OPTIONS.map((option) => {
                  const selected = status === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setStatus(option.value)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={onClose} disabled={saving}>
                <Text style={styles.secondaryText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Save</Text>}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.backButton} onPress={onClose} disabled={saving}>
              <Text style={styles.backButtonText}>Back to capture</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Offline OK. Changes sync later.</Text>
          </ScrollView>
        </View>
      </View>
      <Modal visible={posterVisible} animationType="slide" onRequestClose={() => setPosterVisible(false)}>
        <SafeAreaView style={styles.posterSafeArea}>
          <ScrollView contentContainerStyle={styles.posterModalContent}>
            <SinglePosterView item={item} onClose={() => setPosterVisible(false)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Modal>
  );
}

function createStyles() {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    posterSafeArea: {
      flex: 1,
      backgroundColor: '#fafaf9',
    },
    posterModalContent: {
      padding: 20,
    },
    sheet: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      overflow: 'hidden',
    },
    content: {
      padding: 20,
      gap: 18,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    posterButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      backgroundColor: '#fff',
    },
    posterText: {
      fontWeight: '800',
      color: '#0f172a',
    },
    hero: {
      width: '100%',
      height: 280,
      borderRadius: 14,
      backgroundColor: '#f3f4f6',
    },
    metaRow: {
      gap: 8,
    },
    metaText: {
      color: '#0f172a',
      fontSize: 18,
      fontWeight: '800',
    },
    metaSubtle: {
      color: '#6b7280',
      fontSize: 14,
      fontWeight: '700',
    },
    presetRow: {
      gap: 10,
    },
    presetButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      backgroundColor: '#fff',
      alignItems: 'center',
    },
    presetPrimary: {
      backgroundColor: '#0f172a',
      borderColor: '#0f172a',
    },
    presetText: {
      color: '#0f172a',
      fontWeight: '800',
      fontSize: 15,
    },
    presetTextPrimary: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 15,
    },
    identifyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
    },
    aiCard: {
      marginTop: 10,
      padding: 14,
      borderRadius: 12,
      backgroundColor: '#f1f5f9',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      gap: 8,
    },
    aiTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#0f172a',
    },
    aiSection: {
      gap: 4,
      marginTop: 4,
    },
    applyButton: {
      marginTop: 6,
      backgroundColor: '#111',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    applyText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: 15,
    },
    identifyButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#0f172a',
      backgroundColor: '#fff',
      alignItems: 'center',
      minWidth: 120,
    },
    identifyText: {
      color: '#0f172a',
      fontWeight: '800',
      fontSize: 14,
    },
    errorText: {
      color: '#b91c1c',
      fontWeight: '800',
      marginTop: 6,
    },
    section: {
      gap: 8,
    },
    label: {
      fontSize: 17,
      fontWeight: '800',
      color: '#111',
    },
    labelInput: {
      borderWidth: 2,
      borderColor: '#cbd5e1',
      borderRadius: 14,
      padding: 14,
      fontSize: 18,
      color: '#0f172a',
      backgroundColor: '#f8fafc',
    },
    input: {
      minHeight: 120,
      borderWidth: 2,
      borderColor: '#cbd5e1',
      borderRadius: 14,
      padding: 14,
      textAlignVertical: 'top',
      fontSize: 16,
      color: '#0f172a',
      backgroundColor: '#f8fafc',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#d1d5db',
      backgroundColor: '#fff',
      minWidth: 112,
      alignItems: 'center',
    },
    chipSelected: {
      backgroundColor: '#111',
      borderColor: '#111',
    },
    chipText: {
      color: '#111',
      fontWeight: '800',
      fontSize: 15,
    },
    chipTextSelected: {
      color: '#fff',
    },
    favoriteChip: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      backgroundColor: '#f8fafc',
      alignItems: 'center',
    },
    favoriteChipActive: {
      backgroundColor: '#111',
      borderColor: '#111',
    },
    favoriteText: {
      color: '#111',
      fontWeight: '800',
      fontSize: 15,
    },
    favoriteTextActive: {
      color: '#fff',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 14,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: '#111',
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
    },
    primaryText: {
      color: '#fff',
      fontSize: 19,
      fontWeight: '800',
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: '#fff',
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    secondaryText: {
      color: '#111',
      fontSize: 19,
      fontWeight: '800',
    },
    backButton: {
      marginTop: 4,
      backgroundColor: '#f8fafc',
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    backButtonText: {
      color: '#0f172a',
      fontSize: 16,
      fontWeight: '800',
    },
    hint: {
      color: '#6b7280',
      fontSize: 12,
      textAlign: 'center',
    },
  });
}
