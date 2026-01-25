/**
 * Minimal serverless-style handler: POST JSON { imageBase64, latitude, longitude, metadata? }
 *
 * - Uses OPENAI_API_KEY from environment.
 * - Sends a system + user prompt to an OpenAI chat/vision-capable model.
 * - Expects the model to return a JSON object in assistant text. We attempt to parse it,
 *   otherwise fall back to returning the assistant text in `context_text`.
 *
 * Adaptation notes:
 * - For Next.js API route: export default async function handler(req, res) { ... }
 * - For Express: app.post('/api/identify', async (req, res) => { ... })
 *
 * WHY:
 * - Keep API key server-side.
 * - Return structured JSON so the app can show a confidence, labels, safety badges, etc.
 */

import fetch from 'node-fetch'; // if your runtime doesn't have fetch, enable or replace
import { IncomingMessage, ServerResponse } from 'http';

type IdentifyRequest = {
  imageBase64: string; // "data:image/jpeg;base64,...." or raw base64; include data: prefix if possible
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
};

// Minimal generic response shape - tailor to UI needs
type IdentifyResult = {
  id?: string; // optional identifier for the result
  labels?: string[]; // what the model thinks this is
  confidence?: number; // 0..1
  context_text?: string; // longer natural-language explanation
  safety_flags?: string[]; // e.g. ["hazardous", "near-water"]
  raw?: any; // raw assistant text if parsing fails
};

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'; // fallback, adapt if you use Responses API
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-vision'; // choose a vision-enabled model available to you

async function identifyRockHandler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  // Very small router: only accept POST
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end('Method Not Allowed');
    return;
  }

  // In serverless platforms you'll already have parsed JSON in req.body.
  // If not, you must parse the body first. For brevity we assume JSON-parsed body is present.
  const body: IdentifyRequest = (req as any).body;
  if (!body || !body.imageBase64) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing imageBase64 in request body' }));
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Server misconfigured: missing OPENAI_API_KEY' }));
    return;
  }

  // Build the system/user prompt. We ask the model to respond with JSON so it's easier to parse.
  // Keep the instruction precise: JSON only. Models vary; include a fallback parse strategy.
  const systemPrompt = `
You are Ocal Curator, a concise, high-clarity assistant that helps identify rocks and provides location-aware safety/context.
When given a photo (as a data URL) and coordinates, respond with a single JSON object only, with keys:
- "id": short identifier (optional)
- "labels": array of possible identifications (strings)
- "confidence": number between 0 and 1
- "context_text": short plain-language explanation (2-4 sentences)
- "safety_flags": array of short tags if any hazards or safety notes apply
Return no extra commentary outside the JSON. If unsure, set confidence appropriately and include "unknown" in labels.
`;

  const userMessage = `
Image: ${body.imageBase64}
Latitude: ${body.latitude ?? 'unknown'}
Longitude: ${body.longitude ?? 'unknown'}
Metadata: ${JSON.stringify(body.metadata ?? {})}
`;

  try {
    // Call OpenAI Chat Completions. Many vision-enabled models accept data URLs embedded in the message.
    // If your model or plan doesn't accept images inline, replace this flow with:
    //  - a dedicated vision API OR
    //  - run a local image feature extractor and send features to the model
    const resp = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 800,
        temperature: 0.0, // deterministic for structured output
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      res.statusCode = 502;
      res.end(JSON.stringify({ error: 'Upstream OpenAI error', detail: txt }));
      return;
    }

    const respJson = await resp.json();
    // Chat completion assistant reply text
    const assistantText = respJson?.choices?.[0]?.message?.content ?? '';

    let parsed: IdentifyResult | null = null;
    try {
      // Try to find the first JSON object in the assistant text
      const jsonStart = assistantText.indexOf('{');
      const jsonEnd = assistantText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonStr = assistantText.slice(jsonStart, jsonEnd + 1);
        parsed = JSON.parse(jsonStr);
      } else {
        // no JSON object detected
        parsed = null;
      }
    } catch (err) {
      parsed = null;
    }

    const result: IdentifyResult = parsed ?? {
      raw: assistantText,
      context_text: assistantText,
      labels: ['unknown'],
      confidence: 0,
    };

    // Very small normalization step (ensure confidence is a number between 0 and 1)
    if (typeof result.confidence !== 'number' || Number.isNaN(result.confidence)) {
      result.confidence = 0;
    } else {
      result.confidence = Math.max(0, Math.min(1, result.confidence));
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Server error', detail: String(err.message ?? err) }));
  }
}

// Export for platform adaptation
export default identifyRockHandler;

/**
 * Example adaptation for Next.js (api/identify.ts):
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   // put the body-parsing version of the code above here (req.body available)
 * }
 *
 * Example adaptation for Express:
 * app.post('/api/identify', express.json({ limit: '10mb' }), async (req, res) => { ... });
 *
 * Important: Accepting base64 images in JSON increases payload size. Consider using multipart/form-data
 * or uploading to a private blob store (signed URL) then sending the blob URL to the model-server.
 */