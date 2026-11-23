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
          <Text style={[s.text, {color: t.role === 'user' ? colors.onAccent : colors.text}]}>
            {t.content}
          </Text>
        </View>
      ))}
      {suggestions.length > 0 && (
        <Text style={[s.text, {color: colors.textSecondary}]}>
          Tap a question, or type your own:
        </Text>
      )}
      {suggestions.map(q => (
        <TouchableOpacity
          key={q}
          style={[s.starter, {borderColor: colors.accent, backgroundColor: colors.card}]}
          onPress={() => send(q)}
          disabled={sending}
          accessibilityRole="button">
          <Text style={[s.starterText, {color: colors.accent}]}>{q}</Text>
          <Ionicons name="arrow-forward" size={24} color={colors.accent} />
        </TouchableOpacity>
      ))}
      {sending && <ActivityIndicator color={colors.accent} />}
      {error && <Text style={[s.text, {color: colors.danger}]}>{error}</Text>}
      <View style={s.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type here..."
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
          <Text style={[s.sendText, {color: colors.onAccent}]}>Send</Text>
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
  starter: {
    minHeight: 60,
    borderWidth: 2,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  starterText: {flex: 1, fontSize: 18, fontWeight: '800', lineHeight: 24},
  inputRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  input: {
    flex: 1,
    minHeight: 60,
    maxHeight: 140,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
  },
  send: {minWidth: 84, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  sendText: {color: '#fff', fontSize: 18, fontWeight: '800'},
});
