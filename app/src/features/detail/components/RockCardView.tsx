import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {FindRecord} from '@/shared/types';
import {ThemeColors} from '@/shared/ThemeContext';
import {CONFIDENCE_WORDS, KEEPER_WORDS} from '@/ai/rockCard';

type Props = {
  find: FindRecord;
  onRetry: () => void;
  colors: ThemeColors;
};

type SectionProps = {
  title: string;
  items: string[];
  colors: ThemeColors;
  boxed?: boolean;
};

function Section({title, items, colors, boxed}: SectionProps) {
  if (!items.length) return null;
  return (
    <View
      style={[
        s.section,
        boxed && [s.boxed, {borderColor: colors.accent, backgroundColor: colors.background}],
      ]}>
      <Text style={[s.sectionTitle, {color: colors.accent}]}>{title}</Text>
      {items.map(item => (
        <Text key={item} style={[s.bullet, {color: colors.text}]}>
          {'•  '}
          {item}
        </Text>
      ))}
    </View>
  );
}

export function RockCardView({find, onRetry, colors}: Props) {
  const card = find.card;
  const box = [s.box, {backgroundColor: colors.card, borderColor: colors.border}];

  if (!card) {
    const failed = find.status === 'ai_analysis_failed';
    const waiting = find.status === 'draft' && !!find.aiError;
    return (
      <View style={box}>
        {failed || waiting ? (
          <>
            <Ionicons
              name={waiting ? 'cloud-offline-outline' : 'alert-circle-outline'}
              size={32}
              color={colors.textSecondary}
            />
            <Text style={[s.body, {color: colors.text, textAlign: 'center'}]}>
              {waiting
                ? 'No signal yet. Ranger Al will take a look as soon as you are back online.'
                : find.aiError || 'Ranger Al could not look at this one.'}
            </Text>
            <TouchableOpacity
              style={[s.button, {backgroundColor: colors.accent}]}
              onPress={onRetry}
              accessibilityRole="button">
              <Text style={[s.buttonText, {color: colors.onAccent}]}>Try again now</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[s.body, {color: colors.text}]}>Ranger Al is taking a look...</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={box}>
      {!card.photo_ok && card.photo_tip && (
        <View style={[s.tip, {borderColor: colors.accentSecondary}]}>
          <Ionicons name="camera-outline" size={24} color={colors.accentSecondary} />
          <Text style={[s.body, {color: colors.text, flex: 1}]}>{card.photo_tip}</Text>
        </View>
      )}
      <View style={s.badges}>
        <Text style={[s.badge, {backgroundColor: colors.accent, color: colors.onAccent}]}>
          {CONFIDENCE_WORDS[card.confidence]}
        </Text>
        <Text style={[s.badge, s.badgeAmber]}>
          {KEEPER_WORDS[card.keeper]}
        </Text>
      </View>
      <Text style={[s.story, {color: colors.text}]}>{card.story}</Text>
      <Section boxed title="Try this" items={card.try_this} colors={colors} />
      <Section title="What Al noticed" items={card.clues} colors={colors} />
      <Section title="It could also be" items={card.also_could_be} colors={colors} />
      {card.tumbles_well != null && (
        <Text style={[s.body, {color: colors.textSecondary}]}>
          {card.tumbles_well ? 'Good for a rock tumbler.' : 'Not a great tumbler rock.'}
        </Text>
      )}
      {card.fun_fact && (
        <Text style={[s.body, {color: colors.textSecondary, fontStyle: 'italic'}]}>
          {card.fun_fact}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
    alignItems: 'stretch',
  },
  badges: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  badge: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  story: {fontSize: 20, lineHeight: 30},
  section: {gap: 6},
  boxed: {borderWidth: 2, borderRadius: 16, padding: 16},
  badgeAmber: {
    backgroundColor: '#fef3c7',
    color: '#78350f',
    borderWidth: 2,
    borderColor: '#78350f',
  },
  sectionTitle: {fontSize: 22, fontWeight: '800'},
  bullet: {fontSize: 18, lineHeight: 26},
  body: {fontSize: 18, lineHeight: 26},
  tip: {flexDirection: 'row', gap: 10, borderWidth: 2, borderRadius: 12, padding: 12},
  button: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  buttonText: {color: '#fff', fontSize: 18, fontWeight: '700'},
});
