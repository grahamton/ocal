import Anthropic from '@anthropic-ai/sdk';
import {zodOutputFormat} from '@anthropic-ai/sdk/helpers/zod';
import {RockCard, RockCardSchema} from './card';
import {
  ANGLES,
  CHAT_INSTRUCTIONS,
  IDENTIFY_INSTRUCTIONS,
  KNOWLEDGE_BASE,
  LENGTH_NOTES,
  PERSONA,
} from './prompt';
import type {AlLength, ChatBody, FindContext, ImageInput, RecentCard} from './schemas';

// Stable prefix: persona + KB. The 1h cache breakpoint on the KB means every
// identify/chat within the hour re-reads ~15k tokens at ~0.1x price.
const SYSTEM: Anthropic.Beta.BetaTextBlockParam[] = [
  {type: 'text', text: PERSONA},
  {type: 'text', text: KNOWLEDGE_BASE, cache_control: {type: 'ephemeral', ttl: '1h'}},
];

// Refusals are very unlikely for rocks, but fall back server-side if one happens.
const FALLBACK = {
  betas: ['server-side-fallback-2026-07-01'] as Anthropic.Beta.AnthropicBeta[],
  fallbacks: 'default' as const,
};

export class RangerError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const imageBlock = (image: ImageInput): Anthropic.Beta.BetaImageBlockParam => ({
  type: 'image',
  source: {type: 'base64', media_type: image.media_type, data: image.data},
});

const describeContext = (ctx: FindContext): string => {
  const lines: string[] = [];
  if (ctx.location) {
    const place = ctx.location.place ? ` (${ctx.location.place})` : '';
    lines.push(`Found near ${ctx.location.lat.toFixed(3)}, ${ctx.location.long.toFixed(3)}${place}.`);
  } else {
    lines.push('Location unknown (probably a Pacific coast beach).');
  }
  if (ctx.taken_at) lines.push(`Photo taken ${ctx.taken_at}.`);
  if (ctx.note) lines.push(`<beachcomber_note>${ctx.note}</beachcomber_note>`);
  return lines.join('\n');
};

// Variety for a fresh card: a random angle, the length the user asked for,
// and what Al already told them recently (to avoid repeating it). All of this
// goes in the user turn so the cached system prompt stays byte-stable.
const describeVariety = (length: AlLength, recent: RecentCard[]): string => {
  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
  const lines = [LENGTH_NOTES[length], `For variety this time: ${angle}`];
  if (recent.length) {
    lines.push(
      'You already told this beachcomber the following about their last few finds. Do not reuse these openers, checks, fun facts or questions; find fresh ones for this stone:',
      ...recent.map(
        r =>
          `- ${r.name}: opened "${r.opener}"; checks: ${r.checks.join(' | ') || 'none'}; ` +
          `fun fact: ${r.fun_fact ?? 'none'}; asked: ${r.asked ?? 'none'}`,
      ),
    );
  }
  return lines.join('\n');
};

// One line per call in `wrangler dev` / Workers logs: watch cache_read climb
// after the first request (the KB is billed at ~0.1x when read from cache).
const logUsage = (route: string, msg: Anthropic.Beta.BetaMessage) => {
  const u = msg.usage;
  console.log(
    `[${route}] ${msg.model} in=${u.input_tokens} cache_write=${u.cache_creation_input_tokens ?? 0} ` +
      `cache_read=${u.cache_read_input_tokens ?? 0} out=${u.output_tokens} stop=${msg.stop_reason}`,
  );
};

const firstText = (msg: Anthropic.Beta.BetaMessage): string => {
  if (msg.stop_reason === 'refusal') {
    throw new RangerError('Ranger Al would rather not answer that one.', 422);
  }
  const block = msg.content.find(
    (b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text',
  );
  if (!block) throw new RangerError('Ranger Al went quiet. Try again.', 502);
  return block.text;
};

export async function identify(
  client: Anthropic,
  model: string,
  image: ImageInput,
  ctx: FindContext,
  length: AlLength = 'full',
  recent: RecentCard[] = [],
): Promise<RockCard> {
  const msg = await client.beta.messages.create({
    ...FALLBACK,
    model,
    max_tokens: 16000,
    output_config: {effort: 'medium', format: zodOutputFormat(RockCardSchema)},
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          imageBlock(image),
          {
            type: 'text',
            text: `${describeContext(ctx)}\n\n${IDENTIFY_INSTRUCTIONS}\n\n${describeVariety(length, recent)}`,
          },
        ],
      },
    ],
  });
  logUsage('identify', msg);
  const text = firstText(msg);
  const parsed = RockCardSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new RangerError('Ranger Al mumbled. Try again.', 502);
  return parsed.data;
}

export async function chat(
  client: Anthropic,
  model: string,
  body: ChatBody,
): Promise<string> {
  // Opening turn carries the photo + earlier card; it's identical every time
  // for this find, so the cache breakpoint on it covers follow-up questions.
  const opening: Anthropic.Beta.BetaMessageParam = {
    role: 'user',
    content: [
      imageBlock(body.image),
      {
        type: 'text',
        text: `${describeContext(body)}\n\nYour earlier rock card for this find:\n${JSON.stringify(body.card)}\n\n${CHAT_INSTRUCTIONS}\n${LENGTH_NOTES[body.length ?? 'full']}`,
        cache_control: {type: 'ephemeral'},
      },
    ],
  };
  const msg = await client.beta.messages.create({
    ...FALLBACK,
    model,
    max_tokens: 8000,
    output_config: {effort: 'low'},
    system: SYSTEM,
    messages: [opening, ...body.messages],
  });
  logUsage('chat', msg);
  return firstText(msg);
}
