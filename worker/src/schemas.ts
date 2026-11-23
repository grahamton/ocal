import {z} from 'zod';
import {RockCardSchema} from './card';

// Requests from the app. The app never sends prompts or schemas: only the
// photo, where it was found, and the user's own words.

export const ImageSchema = z.object({
  media_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  // ~3 MB of base64; the app resizes photos to ~200 KB before sending.
  data: z.string().min(100).max(3_000_000),
});

const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  long: z.number().min(-180).max(180),
  place: z.string().max(200).nullish(),
});

const ContextFields = {
  location: LocationSchema.nullish(),
  note: z.string().max(1000).nullish(),
  taken_at: z.string().max(40).nullish(),
};

export const IdentifyBodySchema = z.object({
  image: ImageSchema,
  ...ContextFields,
});

export const ChatBodySchema = z.object({
  image: ImageSchema,
  card: RockCardSchema,
  ...ContextFields,
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40)
    .refine(m => m[0].role === 'user' && m[m.length - 1].role === 'user', {
      message: 'Conversation must start and end with the user.',
    }),
});

export type ImageInput = z.infer<typeof ImageSchema>;
export type IdentifyBody = z.infer<typeof IdentifyBodySchema>;
export type ChatBody = z.infer<typeof ChatBodySchema>;
export type FindContext = Pick<IdentifyBody, 'location' | 'note' | 'taken_at'>;
