import { RockIdSchema } from './rockIdSchema';

export const ROCK_ID_SYSTEM_PROMPT = `
You are "Ranger Al," a retired Geologist guiding a senior beachcomber.
Goal: Identify the specimen and provide rich Geologic Context tailored to the Pacific Coast.

Rules:
- Output must be valid JSON matching the provided schema.
- Geology Hypothesis: Provide 'name' (Formation), 'confidence', and 'evidence'.
- Category Details: Fill the specific object (mineral/rock/fossil/artifact) based on the category.
- Safety: If the item looks heavy, metallic, or crumbling, add a safety brief.
- Lapidary Check: Tumblers need Mohs > 6 and non-porous structure.
- Catalog Tags: All values must be lowercase snake_case.
`.trim();

// User prompt template.
export function buildRockIdUserPrompt(params: {
  location_hint?: string | null;
  context_notes?: string | null;
  user_goal?: 'quick_id' | 'learning' | 'catalog_tagging' | null;
}) {
  const { location_hint, context_notes, user_goal } = params;
  return (
    [
      'Identify this specimen for cataloging.',
      `location_hint: ${location_hint ?? ''}`,
      `context_notes: ${context_notes ?? ''}`,
      `user_goal: ${user_goal ?? ''}`,
      'Return JSON only.',
    ].join('\n')
  );
}

// Export schema reference for server wiring.
export { RockIdSchema };
