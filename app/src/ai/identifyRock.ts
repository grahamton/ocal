export type IdentifyInput = {
  imageUrls?: string[];
  imageDataUrls?: string[];
  locationHint?: string | null;
  contextNotes?: string | null;
  userGoal?: 'quick_id' | 'learning' | 'catalog_tagging' | null;
  provider?: 'openai' | 'gemini';
  endpoint?: string; // override function URL; default uses ENV or relative path
};

export async function identifyRock(input: IdentifyInput) {
  const url =
    input.endpoint ||
    process.env.EXPO_PUBLIC_IDENTIFY_URL ||
    'https://<region>-<project>.cloudfunctions.net/identify';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: input.provider ?? 'gemini',
      image_urls: input.imageUrls ?? [],
      image_data_urls: input.imageDataUrls ?? [],
      location_hint: input.locationHint ?? null,
      context_notes: input.contextNotes ?? null,
      user_goal: input.userGoal ?? 'quick_id',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Identify request failed');
  }

  return res.json();
}
