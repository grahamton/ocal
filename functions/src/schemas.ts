import { z } from 'zod';

/**
 * Request schema for the identifyRock endpoint.
 * - Accepts a data URL (data:image/...;base64,...) for simplicity in minimal example.
 * - latitude/longitude optional (useful for geologic context and safety checks).
 */
export const IdentifyRequestSchema = z.object({
  imageBase64: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

export type IdentifyRequest = z.infer<typeof IdentifyRequestSchema>;

/**
 * AI response schema (what we expect the model to return).
 * This is intentionally conservative and easy for UIs to consume.
 */
export const IdentifyResponseSchema = z.object({
  id: z.string().optional(),
  labels: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
  context_text: z.string().optional(),
  safety_flags: z.array(z.string()).optional(),
});

export type IdentifyResponse = z.infer<typeof IdentifyResponseSchema>;