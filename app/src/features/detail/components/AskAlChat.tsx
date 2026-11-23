import React, {useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {FindRecord} from '@/shared/types';
import {ThemeColors} from '@/shared/ThemeContext';
import {ChatTurn} from '@/ai/rockCard';
import {askAl, RangerOfflineError} from '@/ai/ranger';
import * as localDb from '@/shared/localDb';

type Props = {find: FindRecord; colors: ThemeColors};

export function AskAlChat({find, colors}: Props) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turns = find.chat ?? [];
  const card = find.card;
  if (!card) return null;

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    const userTurn: ChatTurn = {role: 'user', content, at: new Date().toISOString()};
    const next = [...turns, userTurn];
    setSending(true);
    setError(null);
    setDraft('');
    await localDb.updateFind(find.id, {chat: next});
    try {
      const reply = await askAl(find, next);
      await localDb.updateFind(find.id, {
        chat: [...next, {role: 'assistant', content: reply, at: new Date().toISOString()}],
      });
    } catch (e) {
      // Roll the question back so it can be re-sent as-is.
      await localDb.updateFind(find.id, {chat: turns});
      setDraft(content);
      setError(
        e instanceof RangerOfflineError
          ? 'No signal right now. Try again when you are back online.'
          : 'Ranger Al did not catch that. Try again.',
      );
    } finally {
      setSending(false);
    }
  };

  const suggestions = turns.length === 0 ? card.al_wonders : [];

  return (
    <View style={[s.box, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <Text style={[s.title, {color: colors.text}]}>Ask Ranger Al</Text>
      {turns.map((t, i) => (
        <View
          key={`${t.at}-${i}`}
          style={[
            s.bubble,
            t.role === 'user'
              ? {alignSelf: 'flex-end', backgroundColor: colors.accent}
              : {alignSelf: 'flex-start', backgroundColor: colors.background},
          ]}>
          <Text style={[s.text, {color: t.role === 'user' ? '#fff' : colors.text}]}>
            {t.content}
          </Text>
        </View>
      ))}
      {suggestions.map(q => (
        <View key={q} style={[s.bubble, {backgroundColor: colors.background}]}>
          <Text style={[s.text, {color: colors.text}]}>{q}</Text>
        </View>
      ))}
      {sending && <ActivityIndicator color={colors.accent} />}
      {error && <Text style={[s.text, {color: colors.danger}]}>{error}</Text>}
      <View style={s.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Tell Al what you see, or ask anything..."
          placeholderTextColor={colors.textSecondary}
          style={[s.input, {color: colors.text, borderColor: colors.border}]}
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[s.send, {backgroundColor: colors.accent, opacity: draft.trim() ? 1 : 0.5}]}
          onPress={() => send(draft)}
          disabled={sending || !draft.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send to Ranger Al">
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  box: {borderWidth: 1, borderRadius: 16, padding: 16, margin: 16, gap: 10},
  title: {fontSize: 22, fontWeight: '800'},
  bubble: {maxWidth: '88%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10},
  text: {fontSize: 18, lineHeight: 26},
  inputRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  input: {
    flex: 1,
    minHeight: 56,
    maxHeight: 140,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
  },
  send: {width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center'},
});
