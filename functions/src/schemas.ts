import { z } from 'zod';

/**
 * Request schema for the identifyRock endpoint.
 *
 * Matches the payload sent by the client's identifyRock.ts:
 *   - image_data_urls: base64 data URLs of the rock photo(s)
 *   - image_urls: Firebase Storage URLs (alternative to data URLs)
 *   - location_hint: human-readable location string for geologic context
 *   - context_notes: user notes / label about the find
 *   - user_goal: hint about what the user wants ('quick_id', etc.)
 *   - session_context: active session metadata (name, location, startTime)
 *   - system_prompt: the full Ranger Al system prompt from RangerConfig.ts
 *   - output_schema: the Ranger Al JSON schema from RangerConfig.ts
 *   - provider: AI provider override ('gemini' | 'openai'), defaults to 'gemini'
 *   - temperature: sampling temperature override
 */
export const IdentifyRequestSchema = z.object({
  image_data_urls: z.array(z.string()).optional(),
  image_urls: z.array(z.string()).optional(),
  location_hint: z.string().optional(),
  context_notes: z.string().optional(),
  user_goal: z.string().optional(),
  session_context: z.any().optional(),
  system_prompt: z.string().optional(),
  output_schema: z.any().optional(),
  provider: z.string().optional(),
  temperature: z.number().optional(),
});

export type IdentifyRequest = z.infer<typeof IdentifyRequestSchema>;
