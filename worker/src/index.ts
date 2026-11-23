import Anthropic from '@anthropic-ai/sdk';
import {z} from 'zod';
import {chat, identify, RangerError} from './ranger';
import {ChatBodySchema, IdentifyBodySchema} from './schemas';

/**
 * Ocal "Ranger Al" Worker.
 *   POST /identify  photo -> rock card
 *   POST /chat      photo + card + conversation -> Al's reply
 * Every request needs the shared app access code in `X-Ocal-Key`.
 */

interface Env {
  ANTHROPIC_API_KEY: string;
  APP_ACCESS_CODE: string;
  CLAUDE_MODEL: string;
  RATE_LIMITER?: {limit(opts: {key: string}): Promise<{success: boolean}>};
}

const MAX_BODY_BYTES = 4_000_000;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {'Content-Type': 'application/json'},
  });

const err = (message: string, status: number) => json({error: message}, status);

const enc = new TextEncoder();
const safeEqual = (a: string, b: string): boolean => {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.byteLength !== bb.byteLength) return false;
  return crypto.subtle.timingSafeEqual(ab, bb);
};

async function readBody<T>(req: Request, schema: z.ZodType<T>): Promise<T | Response> {
  const size = Number(req.headers.get('Content-Length') ?? 0);
  if (size > MAX_BODY_BYTES) return err('Photo is too big. Try again.', 413);
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return err('Invalid JSON.', 400);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return err('Invalid request.', 400);
  return parsed.data;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === 'GET' && url.pathname === '/health') {
      return json({ok: true, model: env.CLAUDE_MODEL});
    }
    if (req.method !== 'POST') return err('Not found.', 404);

    const key = req.headers.get('X-Ocal-Key') ?? '';
    if (!env.APP_ACCESS_CODE || !safeEqual(key, env.APP_ACCESS_CODE)) {
      return err('Unauthorized.', 401);
    }

    if (env.RATE_LIMITER) {
      const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
      const {success} = await env.RATE_LIMITER.limit({key: ip});
      if (!success) return err('Ranger Al needs a breather. Try again in a minute.', 429);
    }

    const client = new Anthropic({apiKey: env.ANTHROPIC_API_KEY});

    try {
      if (url.pathname === '/identify') {
        const body = await readBody(req, IdentifyBodySchema);
        if (body instanceof Response) return body;
        const card = await identify(
          client,
          env.CLAUDE_MODEL,
          body.image,
          body,
          body.length ?? 'full',
          body.recent ?? [],
        );
        return json({card, model: env.CLAUDE_MODEL, at: new Date().toISOString()});
      }
      if (url.pathname === '/chat') {
        const body = await readBody(req, ChatBodySchema);
        if (body instanceof Response) return body;
        const reply = await chat(client, env.CLAUDE_MODEL, body);
        return json({reply});
      }
      return err('Not found.', 404);
    } catch (e) {
      if (e instanceof RangerError) return err(e.message, e.status);
      if (e instanceof Anthropic.RateLimitError) {
        return err('Ranger Al is busy. Try again shortly.', 503);
      }
      if (e instanceof Anthropic.APIError) {
        console.error('Claude API error', e.status, e.message);
        return err('Ranger Al is out on a walk. Try again soon.', 502);
      }
      console.error('Unexpected error', e);
      return err('Something went wrong.', 500);
    }
  },
};
