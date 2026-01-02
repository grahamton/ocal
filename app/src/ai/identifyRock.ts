import { RockIdResult, AnalysisEvent } from './rockIdSchema';
import { getRangerSystemPrompt, getRangerSchema, RangerMode } from './RangerConfig';

export type IdentifyInput = {
  imageUrls?: string[];
  imageDataUrls?: string[];
  locationHint?: string | null;
  contextNotes?: string | null;
  userGoal?: 'quick_id' | 'learning' | 'catalog_tagging' | null;
  sessionContext?: {
    sessionName?: string;
    sessionTime?: string;
    sessionLocation?: string;
  } | null;
  provider?: 'openai' | 'gemini';
  endpoint?: string; // override function URL; default uses ENV or relative path
  outputMode?: RangerMode;
};

export async function identifyRock(input: IdentifyInput): Promise<AnalysisEvent> {
  const url =
    input.endpoint ||
    process.env.EXPO_PUBLIC_IDENTIFY_URL ||
    'https://<region>-<project>.cloudfunctions.net/identify';

  const mode = input.outputMode || 'explore'; // Default to Explore mode for discovery

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
      session_context: input.sessionContext ?? null,
      system_prompt: getRangerSystemPrompt(mode),
      output_schema: getRangerSchema(mode),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err?.detail
      ? ` - ${typeof err.detail === 'object' ? JSON.stringify(err.detail) : err.detail}`
      : '';
    throw new Error(`${err?.error || 'Identify request failed'}${detail}`);
  }

  const result = await res.json() as RockIdResult;

  // Client-side Safety Net: Normalize catalog tags
  if (result.catalog_tags) {
     const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '_');
     const keysToNormalize = ['type', 'color', 'pattern', 'luster', 'features'];

     for (const key of keysToNormalize) {
        if (Array.isArray((result.catalog_tags as any)[key])) {
           (result.catalog_tags as any)[key] = (result.catalog_tags as any)[key].map(normalize);
        }
     }
  }

  // Wrap in AnalysisEvent
  const analysisEvent: AnalysisEvent = {
    meta: {
      schemaVersion: '1.0.0',
      aiModel: 'gemini-1.5-flash', // Hardcoded for now, should ideally come from env or response
      aiModelVersion: '001',
      promptHash: 'na', // TODO: Implement real hash
      pipelineVersion: '1.0.0',
      runId: 'uuid-' + Date.now(), // Simple UUID for prototype
      timestamp: new Date().toISOString(),
    },
    input: {
      sourceImages: [
        ...(input.imageUrls || []).map(uri => ({ uri })),
        ...(input.imageDataUrls || []).map(uri => ({
            uri: uri.startsWith('data:') ? '[Base64 Data Omitted]' : uri
        })),
      ],
      locationUsed: !!input.locationHint,
      userGoal: input.userGoal || 'quick_id',
    },
    result: result
  };

  console.log('Traceability Event:', JSON.stringify(analysisEvent).substring(0, 100) + '...');

  return analysisEvent;
}
