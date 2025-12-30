import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// import { identifyRock } from '../../ai/identifyRock';
import { updateFindMetadata, getFind } from '../../shared/db';
import { FindRecord } from '../../shared/types';
import { IdentifyQueueService } from '../../ai/IdentifyQueueService';

import { RockIdResult } from '../../ai/rockIdSchema';
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
  const [aiResult, setAiResult] = useState<RockIdResult | null>(null);


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
      setAiResult(item.aiData || null);
      setAiLoading(false);
      setIsFlipped(false); // Always start showing the rock
    }
  }, [item, visible]);

  // Poll for queue updates if we are waiting for AI or checking status
  useEffect(() => {
    if (!visible || !item || aiResult) return;

    let mounted = true;
    const checkQueue = async () => {
      const qItem = await IdentifyQueueService.getQueueStatus(item.id);

      if (!mounted) return;

      if (qItem && (qItem.status === 'pending' || qItem.status === 'processing')) {
        setAiLoading(true);
        setTimeout(checkQueue, 2000); // Poll again
      } else if (qItem && qItem.status === 'completed') {
        // Reload data!
        const fresh = await getFind(item.id);
        if (fresh && fresh.aiData && mounted) {
           setAiResult(fresh.aiData);
           setAiLoading(false);
        }
      } else if (qItem && qItem.status === 'failed') {
         setAiError(qItem.error || 'Request failed');
         setAiLoading(false);
      } else {
         // No queue item, and no result. stop polling.
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
        category: category === 'Unsorted' ? null : category,
        status: 'cataloged', // Force cataloged on "File It"
        favorite,
        sessionId,
      });
      // Close handled by parent callback usually
      setIsFlipped(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };



  const runIdentify = async () => {
    if (!item || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      await IdentifyQueueService.addToQueue(item.id);
      // Logic handled by polling effect now
    } catch (err) {
      setAiError((err as Error)?.message || 'Queue failed');
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
          <View style={styles.floatingControls}>
             <TouchableOpacity
                style={styles.floatingBtn}
                onPress={() => setIsFlipped(p => !p)}
                activeOpacity={0.8}
             >
                <Text style={styles.floatingBtnText}>Flip</Text>
             </TouchableOpacity>
             <TouchableOpacity
                style={[styles.floatingBtn, styles.floatingBtnClose]}
                onPress={onClose}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
             >
                <Text style={styles.floatingBtnText}>✕</Text>
             </TouchableOpacity>
          </View>

          <FlipCard
            isFlipped={isFlipped}
            style={{ flex: 1 }}
            front={
               <CardFront
                  item={{...item, label, category, favorite}}
                  onFlip={() => setIsFlipped(true)}
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

                 onClose={onClose} // Passed but handled by parent too
                 onSave={handleSave}
                 onFlipBack={() => setIsFlipped(false)}
               />
            }
          />
        </View>

      </View>

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
    position: 'relative', // Context for floating buttons
  },
  floatingControls: {
    position: 'absolute',
    top: -60,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    zIndex: 20,
  },
  floatingBtn: {
    height: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  floatingBtnClose: {
     paddingHorizontal: 0,
     width: 44,
     backgroundColor: 'rgba(239, 68, 68, 0.4)', // Subtle red tint for close
     borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  floatingBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Outfit_700Bold', // Ensure font is loaded in App
  },
});
