import {Platform} from 'react-native';
import Constants from 'expo-constants';
import * as ImageManipulator from 'expo-image-manipulator';
import {FindRecord} from '@/shared/types';
import {ChatTurn, RockCard} from '@/ai/rockCard';
import {getAlLength, recentCards} from '@/ai/alStyle';

// Client for the Ranger Al Cloudflare Worker (worker/). The app sends only
// the photo, location and the user's own words; prompts live on the Worker.

const KEY = process.env.EXPO_PUBLIC_OCAL_KEY ?? '';
const TIMEOUT_MS = 90_000;
const MAX_EDGE = 1280; // Claude downsizes past ~1568px anyway; this keeps uploads ~200 KB

// On a phone in dev, "localhost" is the phone itself: swap in the dev
// machine Metro is served from, so `wrangler dev` on the PC is reachable.
const resolveBase = (): string => {
  const raw = (process.env.EXPO_PUBLIC_RANGER_URL ?? 'http://localhost:8787').replace(/\/+$/, '');
  if (Platform.OS === 'web') return raw;
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (!devHost) return raw;
  return raw.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/, `//${devHost}`);
};
const BASE = resolveBase();

/** No signal / server unreachable: safe to retry later. */
export class RangerOfflineError extends Error {}
/** The Worker answered with an error. */
export class RangerError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const imageCache = new Map<string, string>();

async function prepareImage(uri: string): Promise<{media_type: 'image/jpeg'; data: string}> {
  let data = imageCache.get(uri);
  if (!data) {
    const {width, height} = await ImageManipulator.manipulateAsync(uri, []);
    const resize = width >= height ? {width: MAX_EDGE} : {height: MAX_EDGE};
    const out = await ImageManipulator.manipulateAsync(
      uri,
      Math.max(width, height) > MAX_EDGE ? [{resize}] : [],
      {compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true},
    );
    if (!out.base64) throw new Error('Could not read photo.');
    data = out.base64;
    imageCache.set(uri, data);
    if (imageCache.size > 5) imageCache.delete(imageCache.keys().next().value!);
  }
  return {media_type: 'image/jpeg', data};
}

const findContext = (find: FindRecord) => ({
  location:
    find.lat != null && find.long != null
      ? {lat: find.lat, long: find.long, place: find.location_text ?? null}
      : null,
  note: find.note || null,
  taken_at: find.timestamp,
});

async function post<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Ocal-Key': KEY},
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new RangerOfflineError('No signal - Ranger Al will look when you are back online.');
  } finally {
    clearTimeout(timer);
  }
  const data = (await res.json().catch(() => ({}))) as {error?: string} & T;
  if (!res.ok) {
    // 5xx/429 are transient on the Worker side; treat like "try later".
    if (res.status >= 500 || res.status === 429) {
      throw new RangerOfflineError(data.error ?? 'Ranger Al is busy. Will try again soon.');
    }
    throw new RangerError(data.error ?? 'Ranger Al could not look at this one.', res.status);
  }
  return data;
}

export async function identifyFind(find: FindRecord): Promise<{card: RockCard; model: string}> {
  const image = await prepareImage(find.photoUri);
  const [recent, length] = await Promise.all([recentCards(find), getAlLength()]);
  return post('/identify', {image, ...findContext(find), recent, length});
}

export async function askAl(find: FindRecord, turns: ChatTurn[]): Promise<string> {
  if (!find.card) throw new RangerError('Ranger Al has not looked at this one yet.', 400);
  const image = await prepareImage(find.photoUri);
  const {reply} = await post<{reply: string}>('/chat', {
    image,
    card: find.card,
    ...findContext(find),
    length: await getAlLength(),
    messages: turns.map(({role, content}) => ({role, content})),
  });
  return reply;
}
