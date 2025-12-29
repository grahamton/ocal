import { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { identifyRock } from '../../ai/identifyRock';
import { updateFindMetadata } from '../../shared/db';
import { formatCoords } from '../../shared/format';
import { FindRecord } from '../../shared/types';
import { ChipSelector } from './components/ChipSelector';
import { FooterActions } from './components/FooterActions';
import { FavoriteToggle } from './components/FavoriteToggle';
import { IdentifySection } from './components/IdentifySection';
import { MetaSection } from './components/MetaSection';
import { PresetRow } from './components/PresetRow';
import { PosterPreviewModal } from './components/PosterPreviewModal';
import { formatTimestamp } from './utils';
import { findDetailStyles as styles } from './FindDetailModal.styles';
import { AiResult } from './types';

type Props = {
  visible: boolean;
  item: FindRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

const CATEGORY_OPTIONS = ['Unsorted', 'Agate', 'Jasper', 'Fossil', 'Driftwood', 'Other'].map((value) => ({
  value,
}));

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

  const timestampLabel = formatTimestamp(item.timestamp);
  const coordsLabel = formatCoords(item.lat, item.long);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.posterButton} onPress={() => setPosterVisible(true)}>
                <Text style={styles.posterText}>Poster</Text>
              </TouchableOpacity>
            </View>
            <MetaSection
              photoUri={item.photoUri}
              timestampLabel={timestampLabel}
              coordsLabel={coordsLabel}
              sessionId={sessionId}
            />
            <View style={styles.section}>
              <Text style={styles.label}>Favorite</Text>
              <FavoriteToggle favorite={favorite} onToggle={() => setFavorite((prev) => !prev)} />
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
            <PresetRow
              saving={saving}
              onSetAgate={() => {
                setCategory('Agate');
                setStatus('cataloged');
                setLabel((prev) => (prev ? prev : 'Agate find'));
                setNote((prev) => prev || 'Saved as Agate');
              }}
              onSetDraft={() => {
                setCategory('Unsorted');
                setStatus('draft');
              }}
            />
            <IdentifySection aiResult={aiResult} aiError={aiError} aiLoading={aiLoading} onRun={runIdentify} onApply={applyTags} />
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
              <ChipSelector options={CATEGORY_OPTIONS} selected={category ?? 'Unsorted'} onSelect={setCategory} />
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Status</Text>
              <ChipSelector
                options={STATUS_OPTIONS}
                selected={status}
                onSelect={(value) => setStatus(value as 'draft' | 'cataloged')}
              />
            </View>
            <FooterActions saving={saving} onClose={onClose} onSave={handleSave} />
          </ScrollView>
        </View>
      </View>
      <PosterPreviewModal visible={posterVisible} item={item} onClose={() => setPosterVisible(false)} />
    </Modal>
  );
}
