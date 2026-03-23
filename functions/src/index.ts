import * as functions from 'firebase-functions';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { IdentifyRequestSchema } from './schemas';
import { z } from 'zod';

/**
 * identifyRock Cloud Function.
 *
 * Accepts a POST request from the Ocal app client (identifyRock.ts).
 * Uses Gemini to identify rock specimens and returns a full RockIdResult
 * matching the Ranger Al schema defined in the client's RangerConfig.ts.
 *
 * Env vars:
 *   GEMINI_API_KEY  — required
 *   GEMINI_MODEL    — optional, defaults to 'gemini-2.0-flash'
 */

type Req = functions.https.Request;
type Res = functions.Response;

const DEFAULT_SYSTEM_PROMPT = `
You are "Ranger Al," a retired Geologist and friendly guide for senior beachcombers on the Pacific Coast.
Identify the specimen and provide rich geologic context. Output must be valid JSON.
`.trim();

export const identifyRock = functions.https.onRequest(async (req: Req, res: Res) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.set('Allow', 'POST').status(405).send('Method Not Allowed');
    return;
  }

  // Validate request
  let body: z.infer<typeof IdentifyRequestSchema>;
  try {
    body = IdentifyRequestSchema.parse(req.body);
  } catch (err) {
    const zErr = err as z.ZodError;
    res.status(400).json({ error: 'Invalid request', details: zErr.format() });
    return;
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: 'Server misconfigured: missing GEMINI_API_KEY' });
    return;
  }

  const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const temperature = body.temperature ?? 0.7;
  const systemPrompt = body.system_prompt ?? DEFAULT_SYSTEM_PROMPT;

  // Build the user message parts
  const parts: Part[] = [];

  // Add image(s) — prefer data URLs, fall back to image URLs
  const dataUrls = body.image_data_urls ?? [];
  for (const dataUrl of dataUrls) {
    // Strip the data URL prefix: data:image/jpeg;base64,<data>
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }

  // Build contextual text prompt
  const contextLines: string[] = [];

  if (body.location_hint) {
    contextLines.push(`Location: ${body.location_hint}`);
  }
  if (body.context_notes) {
    contextLines.push(`User notes: ${body.context_notes}`);
  }
  if (body.user_goal) {
    contextLines.push(`Goal: ${body.user_goal}`);
  }
  if (body.session_context) {
    const ctx = body.session_context as Record<string, unknown>;
    if (ctx.locationName) contextLines.push(`Session location: ${ctx.locationName}`);
    if (ctx.startTime) {
      const sessionTime = new Date(ctx.startTime as number).toLocaleString();
      contextLines.push(`Session started: ${sessionTime}`);
    }
    if (ctx.name) contextLines.push(`Session name: ${ctx.name}`);
  }

  const textPrompt = contextLines.length > 0
    ? `Please identify this specimen.\n\n${contextLines.join('\n')}\n\nRespond with a JSON object only.`
    : 'Please identify this specimen. Respond with a JSON object only.';

  parts.push({ text: textPrompt });

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const generationConfig: Record<string, unknown> = {
      temperature,
      responseMimeType: 'application/json',
    };

    // If the client provided an output schema, use it for structured output
    if (body.output_schema) {
      generationConfig.responseSchema = body.output_schema.schema ?? body.output_schema;
    }

    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
      generationConfig: generationConfig as Parameters<typeof genAI.getGenerativeModel>[0]['generationConfig'],
    });

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const responseText = result.response.text();

    // Parse JSON from the response
    let parsed: unknown = null;
    try {
      // Gemini with responseMimeType=application/json returns clean JSON
      parsed = JSON.parse(responseText);
    } catch {
      // Fallback: extract JSON object from text
      const start = responseText.indexOf('{');
      const end = responseText.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          parsed = JSON.parse(responseText.slice(start, end + 1));
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed) {
      functions.logger.warn('identifyRock: Could not parse Gemini response', { responseText });
      res.status(200).json({
        best_guess: { label: 'Unknown', confidence: 0, category: 'unknown' },
        ranger_summary: 'Unable to identify this specimen from the photo.',
        alternatives: [],
        specimen_context: {
          age: 'Unknown',
          geology_hypothesis: { name: null, confidence: 'low', evidence: [] },
          type: 'Unknown',
          historical_fact: '',
        },
        lapidary_guidance: { is_tumble_candidate: false, tumble_reason: 'Could not assess.' },
        red_flags: [],
      });
      return;
    }

    res.status(200).json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    functions.logger.error('identifyRock error', { message });
    res.status(500).json({ error: 'Server error', detail: message });
  }
});
