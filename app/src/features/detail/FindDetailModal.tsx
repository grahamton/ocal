import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { identifyRock } from '../../ai/identifyRock';
import { updateFindMetadata } from '../../shared/db';
import { FindRecord } from '../../shared/types';
import { PosterPreviewModal } from './components/PosterPreviewModal';
import { AiResult } from './types';
import { FlipCard } from '../../shared/components/FlipCard';
import { CardFront } from './components/CardFront';
import { CardBack } from './components/CardBack';

type Props = {
  visible: boolean;
  item: FindRecord | null;
  onClose: () => void;
  onSaved: () => void;
};

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

  // Flip state
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (item && visible) {
      setLabel(item.label ?? '');
      setNote(item.note ?? '');
      setCategory(item.category ?? null);
      setStatus(item.status);
      setFavorite(item.favorite);
      setSessionId(item.sessionId ?? null);
      setAiError(null);
      setAiResult(null);
      setAiLoading(false);
      setIsFlipped(false); // Always start showing the rock
    }
  }, [item, visible]);

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
      // Flip back to front to show "saved" state visually?
      // Or just close? For now, standard save behavior.
      setIsFlipped(false);
      onSaved();
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
    if (aiResult.observable_reasons?.[0]) setNote((prev) => prev || (aiResult.observable_reasons || []).join('; '));
  };

  if (!item) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>

        {/* The Card Container */}
        <View style={styles.cardContainer}>
          <FlipCard
            isFlipped={isFlipped}
            style={{ flex: 1 }}
            front={
               <CardFront
                  item={{...item, label, category, favorite}}
                  onFlip={() => !isFlipped && setIsFlipped(true)}
               />
            }
            back={
               <CardBack
                 item={item}
                 sessionId={sessionId}
                 label={label}
                 setLabel={setLabel}
                 category={category}
                 setCategory={setCategory}
                 status={status}
                 setStatus={setStatus}
                 note={note}
                 setNote={setNote}
                 favorite={favorite}
                 setFavorite={setFavorite}
                 aiResult={aiResult}
                 aiError={aiError}
                 aiLoading={aiLoading}
                 onRunIdentify={runIdentify}
                 onApplyTags={applyTags}
                 onPoster={() => setPosterVisible(true)}
                 onClose={onClose}
                 onSave={handleSave}
               />
            }
          />
        </View>

      </View>
      <PosterPreviewModal visible={posterVisible} item={item} onClose={() => setPosterVisible(false)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)', // Darker cinematic backdrop
    justifyContent: 'center',
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  cardContainer: {
    flex: 1,
    maxWidth: 600, // Tablet safe
    alignSelf: 'center',
    width: '100%',
  },
});
