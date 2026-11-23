import AsyncStorage from '@react-native-async-storage/async-storage';
import * as localDb from '@/shared/localDb';
import {FindRecord} from '@/shared/types';

// What the user can control about Ranger Al, plus the short "what Al already
// said" memory sent with each new photo so he doesn't repeat himself.

export type AlLength = 'short' | 'full';
const LENGTH_KEY = 'ocal_al_length';

export async function getAlLength(): Promise<AlLength> {
  const saved = await AsyncStorage.getItem(LENGTH_KEY).catch(() => null);
  return saved === 'short' ? 'short' : 'full';
}

export function setAlLength(length: AlLength): Promise<void> {
  return AsyncStorage.setItem(LENGTH_KEY, length).catch(() => {});
}

export type RecentCard = {
  name: string;
  opener: string;
  fun_fact: string | null;
  checks: string[];
  asked: string | null;
};

const firstSentence = (text: string) =>
  (text.match(/^.*?[.!?](\s|$)/)?.[0] ?? text).trim().slice(0, 140);

const firstWords = (text: string, n = 8) => text.split(/\s+/).slice(0, n).join(' ');

/** The last few other finds Al has looked at, newest first. */
export async function recentCards(current: FindRecord, limit = 5): Promise<RecentCard[]> {
  const all = await localDb.getAllFinds().catch(() => [] as FindRecord[]);
  return all
    .filter(f => f.id !== current.id && f.card)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
    .map(f => {
      const c = f.card!;
      return {
        name: c.name,
        opener: firstSentence(c.story),
        fun_fact: c.fun_fact ? c.fun_fact.slice(0, 160) : null,
        checks: c.try_this.map(t => firstWords(t)),
        asked: c.al_wonders[0] ? firstWords(c.al_wonders[0], 12) : null,
      };
    });
}
