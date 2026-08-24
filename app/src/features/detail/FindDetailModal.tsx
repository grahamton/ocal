import React, {useEffect, useState} from 'react';
import {ScrollView, View, TouchableOpacity, Image, Alert, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as firestoreService from '@/shared/firestoreService';
import {FindRecord, Session} from '@/shared/types';
import useIdentifyQueue from '@/ai/IdentifyQueueService';
import {useTheme} from '@/shared/ThemeContext';
import {styles} from './FindDetailModal.styles';

// Subcomponents
import {DetailHeader} from './components/DetailHeader';
import {RangerLabCard} from './components/RangerLabCard';
import {FieldNotesSection} from './components/FieldNotesSection';
import {DetailActionFooter} from './components/DetailActionFooter';

type Props = {
  item: FindRecord | null;
  onClose: () => void;
  onSaved: () => void;
  onFilterBySession?: (sessionId: string) => void;
};

export function FindDetailModal({
  item,
  onClose,
  onSaved,
  onFilterBySession,
}: Props) {
  const {colors, mode} = useTheme();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [localItem, setLocalItem] = useState<FindRecord | null>(item);
  const aiResult = localItem?.aiData?.result || null;
  const [session, setSession] = useState<Session | null>(null);
  const {addToQueue} = useIdentifyQueue();

  useEffect(() => {
    if (item) {
      setLabel(item.label ?? '');
      setNote(item.note ?? '');
      setFavorite(item.favorite);
      setAiError(null);
      setLocalItem(item);
      setAiLoading(item.status === 'pending_ai_analysis');
      setSession(null);

      if (item.sessionId) {
        firestoreService.getSession(item.sessionId).then(s => {
          if (s) setSession(s);
        });
      }
    }
  }, [item]);

  const handleSave = async () => {
    if (!item || saving) return;
    setSaving(true);
    try {
      await firestoreService.updateFind(item.id, {
        label: label.trim() || null,
        note: note.trim() || null,
        status: 'cataloged',
        favorite,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete this find?', 'This cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item?.id) {
              await firestoreService.deleteFind(item.id);
              onClose?.();
            }
          } catch {
            Alert.alert('Error', 'Could not delete');
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(item.photoUri);
      } else {
        Alert.alert(
          'Sharing not available',
          'Sharing is not supported on this device/simulator.',
        );
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
      await addToQueue(item.id);
    } catch {
      setAiError('Could not start analysis.');
      setAiLoading(false);
    }
  };

  if (!localItem) return null;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <TouchableOpacity
        style={[styles.closeBtn, {zIndex: 50}]}
        onPress={onClose}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.heroContainer}>
        <Image
          source={{uri: localItem.photoUri}}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {backgroundColor: 'rgba(0,0,0,0.1)'},
          ]}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <DetailHeader
          localItem={localItem}
          label={label}
          favorite={favorite}
          setFavorite={setFavorite}
          session={session}
          onFilterBySession={onFilterBySession}
          colors={colors}
          mode={mode}
        />

        <RangerLabCard
          aiResult={aiResult}
          aiLoading={aiLoading}
          aiError={aiError}
          runIdentify={runIdentify}
          colors={colors}
          mode={mode}
        />

        {aiResult && (
          <FieldNotesSection
            note={note}
            setNote={setNote}
            colors={colors}
          />
        )}
        <View style={{height: 80}} />
      </ScrollView>

      <DetailActionFooter
        saving={saving}
        handleShare={handleShare}
        handleDelete={handleDelete}
        handleSave={handleSave}
        colors={colors}
      />
    </View>
  );
}
