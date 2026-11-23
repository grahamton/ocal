import {z} from 'zod';

/**
 * The "rock card" Ranger Al returns for a photo. Deliberately small and
 * friendly: enough to show something fun, the rest happens in chat.
 *
 * Structured outputs ignore array length / string length limits, so sizes
 * are asked for in the prompt instead of enforced here.
 */
export const RockCardSchema = z.object({
  photo_ok: z
    .boolean()
    .describe('False if no specimen is visible or the photo is too blurry/dark to judge.'),
  photo_tip: z
    .string()
    .nullable()
    .describe('When photo_ok is false: one friendly tip for a better shot. Otherwise null.'),
  name: z.string().describe('Best guess in plain words, e.g. "Banded Agate" or "Mystery Pebble".'),
  kind: z.enum(['mineral', 'rock', 'fossil', 'sea_glass', 'artifact', 'not_a_rock', 'unknown']),
  confidence: z.enum(['pretty_sure', 'good_hunch', 'could_be', 'honest_mystery']),
  also_could_be: z.array(z.string()).describe('0-3 look-alikes worth considering.'),
  story: z.string().describe("Ranger Al's 2-4 sentence take, warm and curious."),
  clues: z.array(z.string()).describe('2-4 things in the photo that point to this guess.'),
  try_this: z
    .array(z.string())
    .describe('1-3 simple hands-on checks to narrow it down (light, scratch, wet it, magnet).'),
  keeper: z.enum(['keeper', 'storyteller', 'leaverite']),
  tumbles_well: z.boolean().nullable().describe('Good rock-tumbler candidate? Null if unsure.'),
  fun_fact: z.string().nullable(),
  al_wonders: z
    .array(z.string())
    .describe('1-2 questions Al is curious about, to invite a conversation.'),
});

export type RockCard = z.infer<typeof RockCardSchema>;
