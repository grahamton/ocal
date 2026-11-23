import React, {useEffect, useState} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import * as localDb from '@/shared/localDb';
import {FindRecord, Session} from '@/shared/types';
import useIdentifyQueue from '@/ai/IdentifyQueueService';
import {useTheme} from '@/shared/ThemeContext';

import {DetailHeader} from './components/DetailHeader';
import {RockCardView} from './components/RockCardView';
import {AskAlChat} from './components/AskAlChat';
import {FieldNotesSection} from './components/FieldNotesSection';
import {PhotoViewer} from './components/PhotoViewer';

type Props = {
  item: FindRecord | null;
  onClose: () => void;
  onSaved?: () => void;
};

/**
 * One find, top to bottom: photo (tap to zoom), name, Ranger Al's card,
 * chat, your notes, then share/delete. Everything saves as you go; there
 * is no Save button to forget.
 */
export function FindDetailModal({item, onClose}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const {retry} = useIdentifyQueue();

  useEffect(() => {
    if (!item) return;
    setNote(item.note ?? '');
    setSession(null);
    if (item.sessionId) {
      localDb.getSession(item.sessionId).then(s => s && setSession(s));
    }
    // Only reset local note text when switching to a different find.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) return null;

  const toggleFavorite = () => localDb.updateFind(item.id, {favorite: !item.favorite});
  const saveNote = () => {
    const trimmed = note.trim() || null;
    if (trimmed !== (item.note ?? null)) localDb.updateFind(item.id, {note: trimmed});
  };

  const handleDelete = () => {
    Alert.alert('Delete this rock?', 'The photo and what Ranger Al said will be gone for good.', [
      {text: 'Keep it', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await localDb.deleteFind(item.id);
          onClose();
        },
      },
    ]);
  };

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(item.photoUri);
      else Alert.alert('Sharing is not available on this phone.');
    } catch {
      Alert.alert('Could not share the photo.');
    }
  };

  return (
    <View style={[s.container, {backgroundColor: colors.background}]}>
      <View style={[s.topBar, {borderBottomColor: colors.border, backgroundColor: colors.background}]}>
        <TouchableOpacity
          style={[s.back, {borderColor: colors.text}]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Back to my rocks">
          <Ionicons name="chevron-back" size={28} color={colors.text} />
          <Text style={[s.backText, {color: colors.text}]}>My Rocks</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{paddingBottom: insets.bottom + 32}}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setViewerOpen(true)}
          accessibilityRole="imagebutton"
          accessibilityLabel="Photo of your rock. Tap to look closer.">
          <Image source={{uri: item.photoUri}} style={s.photo} resizeMode="cover" />
          <View style={s.zoomHint}>
            <Ionicons name="search" size={22} color="#fff" />
            <Text style={s.zoomHintText}>Tap to look closer</Text>
          </View>
        </TouchableOpacity>

        <View style={s.body}>
          <DetailHeader
            localItem={item}
            label={item.label ?? ''}
            favorite={item.favorite}
            onToggleFavorite={toggleFavorite}
            session={session}
            colors={colors}
          />
        </View>

        <RockCardView find={item} onRetry={() => retry(item.id)} colors={colors} />
        <AskAlChat find={item} colors={colors} />

        <View style={s.body}>
          <FieldNotesSection note={note} setNote={setNote} onBlur={saveNote} colors={colors} />

          <TouchableOpacity
            style={[s.action, {borderColor: colors.border, backgroundColor: colors.card}]}
            onPress={handleShare}
            accessibilityRole="button">
            <Ionicons name="share-outline" size={26} color={colors.text} />
            <Text style={[s.actionText, {color: colors.text}]}>Share photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.action, {borderColor: colors.danger}]}
            onPress={handleDelete}
            accessibilityRole="button">
            <Ionicons name="trash-outline" size={26} color={colors.danger} />
            <Text style={[s.actionText, {color: colors.danger}]}>Delete this rock</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PhotoViewer uri={item.photoUri} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  container: {flex: 1},
  photo: {width: '100%', aspectRatio: 1},
  zoomHint: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  zoomHintText: {color: '#fff', fontSize: 18, fontWeight: '700'},
  body: {paddingHorizontal: 16, paddingTop: 16, gap: 16},
  topBar: {paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1},
  back: {
    alignSelf: 'flex-start',
    minHeight: 52,
    paddingLeft: 8,
    paddingRight: 18,
    borderRadius: 26,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {fontSize: 20, fontWeight: '700'},
  action: {
    minHeight: 60,
    borderWidth: 2,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionText: {fontSize: 20, fontWeight: '700'},
});
