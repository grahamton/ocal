import { onRequest, Request } from 'firebase-functions/v2/https';
import { Response } from 'firebase-functions';
import * as logger from 'firebase-functions/logger';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { IdentifyRequestSchema } from './schemas';
import { buildRockIdUserPrompt, ROCK_ID_SYSTEM_PROMPT } from './prompt';
import { z } from 'zod';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * identify Cloud Function (v2).
 *
 * Accepts a POST request from the Ocal app client.
 * Uses Gemini to identify rock specimens and returns a full RockIdResult.
 *
 * Secrets:
 *   GEMINI_API_KEY  — required
 */

export const identifyRockHandler = async (req: Request, res: Response) => {
  // CORS
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Validate request
  let body: z.infer<typeof IdentifyRequestSchema>;
  try {
    body = IdentifyRequestSchema.parse(req.body);
  } catch (err) {
    const zErr = err as z.ZodError;
    logger.error('Invalid request body', zErr.format());
    res.status(400).json({ error: 'Invalid request', details: zErr.format() });
    return;
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    logger.error('Missing GEMINI_API_KEY');
    res.status(500).json({ error: 'Server misconfigured: missing GEMINI_API_KEY' });
    return;
  }

  const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash';
  const temperature = body.temperature ?? 0.7;
  const systemPrompt = body.system_prompt ?? ROCK_ID_SYSTEM_PROMPT;

  // Build the user message parts
  const parts: Part[] = [];

  // Add image(s) from data URLs
  const dataUrls = body.image_data_urls ?? [];
  for (const dataUrl of dataUrls) {
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

  // Add image URLs if provided
  if (body.image_urls && body.image_urls.length > 0) {
    for (const url of body.image_urls) {
      parts.push({ text: `Image URL to analyze: ${url}` });
    }
  }

  // Build contextual text prompt using the helper
  const textPrompt = buildRockIdUserPrompt({
    location_hint: body.location_hint,
    context_notes: body.context_notes,
    user_goal: body.user_goal,
    session_context: body.session_context,
  });

  parts.push({ text: textPrompt });

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const generationConfig: any = {
      temperature,
      responseMimeType: 'application/json',
    };

    if (body.output_schema) {
      generationConfig.responseSchema = body.output_schema.schema ?? body.output_schema;
    }

    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
      generationConfig,
    });

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const responseText = result.response.text();

    let parsed: any = null;
    try {
      parsed = JSON.parse(responseText);
    } catch {
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
      logger.warn('Could not parse Gemini response', { responseText });
      throw new Error('Failed to parse AI response as JSON');
    }

    res.status(200).json({
      result: parsed,
      meta: {
        model: MODEL,
        version: '3.1.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('identify error', { message, stack: err.stack });
    res.status(500).json({ error: 'AI Identification failed', detail: message });
  }
};

// Export both names for compatibility
export const identify = onRequest({
  secrets: ['GEMINI_API_KEY'],
  timeoutSeconds: 60,
  memory: '512MiB',
  region: 'us-central1'
}, identifyRockHandler);

export const identifyRock = identify;
