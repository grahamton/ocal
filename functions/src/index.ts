import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import { IdentifyRequestSchema, IdentifyResponseSchema } from './schemas';
import { z } from 'zod';

/**
 * Minimal identifyRock Cloud Function.
 *
 * Env vars:
 * - PROVIDER = 'openai' | 'gemini'   (optional; default 'openai')
 * - OPENAI_API_KEY
 * - OPENAI_MODEL (optional)
 *
 * Notes:
 * - For production, prefer uploading images to Cloud Storage and sending a signed URL
 *   rather than embedding base64 in the request body.
 */

type Req = functions.https.Request;
type Res = functions.Response;

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export const identifyRock = functions.https.onRequest(async (req: Req, res: Res) => {
  if (req.method !== 'POST') {
    res.set('Allow', 'POST').status(405).send('Method Not Allowed');
    return;
  }

  let body;
  try {
    body = IdentifyRequestSchema.parse(req.body);
  } catch (err) {
    const zErr = err as z.ZodError;
    res.status(400).json({ error: 'Invalid request', details: zErr.format() });
    return;
  }

  const provider = process.env.PROVIDER ?? 'openai';

  const systemPrompt = `
You are Ocal Curator, a concise assistant that identifies rocks from photos and provides short context and safety flags.
When given a photo (data URL) and coordinates, respond with a single JSON object ONLY, matching this schema:
{
  "labels": ["label1", "label2", ...],
  "confidence": number between 0 and 1,
  "context_text": "2-4 sentence explanation (optional)",
  "safety_flags": ["hazard1", ...] (optional),
  "id": "optional short id"
}
Do NOT include any other text outside the JSON. If unsure, set confidence low and include "unknown" in labels.
`;

  const userMessage = `Image: ${body.imageBase64}\nLatitude: ${body.latitude ?? 'unknown'}\nLongitude: ${body.longitude ?? 'unknown'}\nMetadata: ${JSON.stringify(body.metadata ?? {})}`;

  try {
    let assistantText = '';

    if (provider === 'openai') {
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini-vision';

      if (!OPENAI_API_KEY) {
        res.status(500).json({ error: 'Server misconfigured: missing OPENAI_API_KEY' });
        return;
      }

      const resp = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 800,
          temperature: 0.0,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        res.status(502).json({ error: 'Upstream OpenAI error', detail: txt });
        return;
      }

      const respJson = await resp.json();
      assistantText = respJson?.choices?.[0]?.message?.content ?? '';
    } else if (provider === 'gemini') {
      // Placeholder: implement Gemini / Google Generative API call here.
      res.status(501).json({ error: 'Gemini provider not implemented in this template.' });
      return;
    } else {
      res.status(500).json({ error: `Unknown provider ${provider}` });
      return;
    }

    // Extract JSON object from assistantText
    let parsed: any = null;
    try {
      const start = assistantText.indexOf('{');
      const end = assistantText.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const str = assistantText.slice(start, end + 1);
        parsed = JSON.parse(str);
      } else {
        parsed = null;
      }
    } catch (err) {
      parsed = null;
    }

    if (parsed) {
      try {
        const validated = IdentifyResponseSchema.parse({
          id: parsed.id,
          labels: parsed.labels ?? (parsed.label ? [parsed.label] : undefined),
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
          context_text: parsed.context_text ?? parsed.context ?? '',
          safety_flags: parsed.safety_flags ?? parsed.flags ?? [],
        });
        res.status(200).json(validated);
        return;
      } catch (valErr) {
        functions.logger.warn('AI returned JSON that failed validation', { error: (valErr as any).toString(), raw: parsed });
      }
    }

    // Fallback
    res.status(200).json({
      labels: ['unknown'],
      confidence: 0,
      context_text: assistantText,
      safety_flags: [],
    });
  } catch (err: any) {
    functions.logger.error('identifyRock error', err);
    res.status(500).json({ error: 'Server error', detail: String(err?.message ?? err) });
  }
});