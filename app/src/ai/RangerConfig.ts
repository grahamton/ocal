export type RangerMode = 'explore' | 'ship';

export const getRangerSystemPrompt = (mode: RangerMode = 'explore') => {
  const basePrompt = `
You are "Ranger Al," a retired Geologist and Park Ranger guiding a senior beachcomber.
Goal: Identify the specimen and provide rich Geologic Context tailored to the Pacific Coast.

Identity & Tone:
- You are knowledgeable, safe, and respectful. Think "Knowledgeable Park Ranger".
- Use short, declarative sentences. Avoid slang or gamification.
- Be encouraging (e.g., "A wonderful specimen").

Terminology Rules (Senior Friendly):
- "Volcanic Stone" instead of Igneous.
- "Sand & Mud Stone" instead of Sedimentary.
- "Cooked Stone" instead of Metamorphic.
- "Sea Glass" for frosted man-made glass.

Knowledge Base (Pacific Coast):
- Default Context: Pacific Northwest / West Coast beaches (Oregon, Washington, California).
- "The Keepers": Agates, Jaspers, Petrified Wood (Translucent, Waxy).
- "The Storytellers": Fossils (Marine Bivalves, Gastropods).
- "The Leaverites": Basalt, Granite, Brick (Opaque, Dull).
- Reality Check: If a rock looks like "Obsidian" but is on a sedimentary beach, suggest "Dark Basalt" or "Sea Glass" unless confident.
- Lapidary Check: Tumblers need Mohs > 6 and non-porous structure. Agates/Jaspers = YES. Basalt/Sandstone = NO.

Rules:
- Output must be valid JSON matching the provided schema.
- Context Output:
  1. Age: Geologic epoch (e.g., "Miocene (~20 MYA)").
  2. Formation: The specific geological source name ONLY. Max 30 chars. Do NOT include dates/eras here (e.g., return "Astoria Formation", NOT "Astoria Formation (Miocene)").
  3. Type: Use the Simplified Terminology (e.g., "Volcanic Stone (Basalt)").
  4. Historical Fact: A fascinating, single-sentence fact about seeing the past. Max 180 chars. Focus on how it formed.
- Lapidary Output:
  1. is_tumble_candidate: boolean. True only for Agate, Jasper, Quartz, Petrified Wood. False for Basalt, Granite (pitting), Sandstone (too soft).
  2. tumble_reason: Very short technical reason. Max 10 words. (e.g. "Mohs 7+ hardness, non-porous").
  3. special_care: Optional tips (e.g. "Use plastic pellets to prevent bruising").
- Safety: If the item looks heavy, metallic, or crumbling, add a safety brief in the fact or identification.
- Location: Use provided location to infer specific formations (e.g. Waldport -> Alsea/Astoria formations).
- Session Context:
  1. Use "session_time" (Morning/Evening) to account for lighting/shadows in your visual analysis.
  2. Use "session_location" effectively if generic coordinates are missing.
  3. If "session_name" suggests a specific activity (e.g. "River Hike"), bias towards relevant rock types (e.g. river tumbled).
`.trim();

  if (mode === 'explore') {
    return `${basePrompt}\n\nMODE: EXPLORE. You are in Discovery Mode. You may add extra fields to the JSON output if they provide valuable context or new insights. Feel free to experiment with the structure while maintaining the core required fields.`;
  }

  return basePrompt;
};

// JSON Schema for RockID Assistant structured outputs based on mode.
export const getRangerSchema = (mode: RangerMode = 'explore') => {
  const isStrict = mode === 'ship';

  return {
    name: 'rock_id_result',
    strict: isStrict, // Strict only in Ship mode
    schema: {
      type: 'object',
      description: 'Structured identification result for a rock, mineral, or fossil specimen.',
      additionalProperties: !isStrict, // Allow extra keys in Explore mode
      required: [
        'best_guess',
        'alternatives',
        'specimen_context',
        'lapidary_guidance',
      ],
      properties: {
        best_guess: {
          type: 'object',
          description: 'The most likely identification based on visible features.',
          additionalProperties: !isStrict,
          required: ['label', 'confidence', 'category'],
          properties: {
            label: { type: 'string', minLength: 1, maxLength: 80, description: 'Common name of the specimen (e.g. "Banded Agate").' },
            confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Confidence score (0.0 to 1.0).' },
            category: {
              type: 'string',
              description: 'Broad classification category.',
              enum: ['rock', 'mineral', 'fossil', 'artifact_like', 'unknown'],
            },
          },
        },
        alternatives: {
          type: 'array',
          description: 'Other possible identifications if the best guess is uncertain.',
          maxItems: 5,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label', 'confidence'],
            properties: {
              label: { type: 'string', minLength: 1, maxLength: 80 },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
            },
          },
        },
        specimen_context: {
          type: 'object',
          description: 'Geologic context tailored to location and age.',
          additionalProperties: false,
          required: ['age', 'formation', 'type', 'historical_fact'],
          properties: {
            age: { type: 'string', maxLength: 60, description: 'Geologic epoch/period (e.g. "Miocene (~23 MYA)").' },
            formation: { type: 'string', maxLength: 60, description: 'Specific formation name (e.g. "Astoria Formation").' },
            type: { type: 'string', maxLength: 60, description: 'Scientific classification (e.g. "Marine Bivalve").' },
            historical_fact: { type: 'string', maxLength: 300, description: 'Fascinating fact about the era/environment.' }
          }
        },
        lapidary_guidance: {
          type: 'object',
          description: 'Advice for polishing or tumbling this specimen.',
          additionalProperties: false,
          required: ['is_tumble_candidate', 'tumble_reason'],
          properties: {
            is_tumble_candidate: { type: 'boolean', description: 'True if hard enough (Mohs > 6) and non-porous. False if soft/crumbly.' },
            tumble_reason: { type: 'string', maxLength: 165, description: 'Why it is or isn\'t a candidate (e.g. "Hardness 7, takes high polish").' },
            special_care: { type: 'string', maxLength: 100, description: 'Optional tips (e.g. "Use plastic pellets for cushioning").' }
          }
        },
        region_fit: {
          type: 'object',
          description: 'Assessment of plausibility given the location hint.',
          additionalProperties: false,
          required: ['location_hint', 'fit', 'note'],
          properties: {
            location_hint: { type: ['string', 'null'], maxLength: 120, description: 'The provided location context, or null.' },
            fit: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'], description: 'How well the ID matches the local geology.' },
            note: { type: ['string', 'null'], maxLength: 160, description: 'Brief explanation of the fit (e.g. "Common in Lake Superior region").' },
          },
        },
        followup_photos: {
            type: 'array',
            description: 'Requests for specific additional angles or lighting (e.g. "wet photo", "backlit").',
            maxItems: 5,
            items: { type: 'string', maxLength: 120 }
        },
        followup_questions: {
            type: 'array',
            description: 'Simple tests the user can perform (e.g. "scratch with steel", "check magnetism").',
            maxItems: 5,
            items: { type: 'string', maxLength: 120 }
        },
        catalog_tags: {
          type: 'object',
          description: 'Structured attributes for filtering and organizing.',
          additionalProperties: false,
          required: ['type', 'color', 'pattern', 'luster', 'translucency', 'grain_size', 'features', 'condition'],
          properties: {
            type: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 40 }, description: 'Broad types (e.g. "sedimentary", "quartz").' },
            color: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 30 }, description: 'Dominant colors.' },
            pattern: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 40 }, description: 'Visual patterns (e.g. "banded", "spotted").' },
            luster: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 30 }, description: 'Surface reflectiveness (e.g. "waxy", "vitreous").' },
            translucency: { type: 'array', maxItems: 1, items: { type: 'string', enum: ['opaque', 'translucent', 'transparent', 'unknown'] }, description: 'Light transmission (single value).' },
            grain_size: { type: 'array', maxItems: 4, items: { type: 'string', enum: ['fine', 'medium', 'coarse', 'mixed', 'unknown'] }, description: 'Texture granularity (single value).' },
            features: { type: 'array', maxItems: 10, items: { type: 'string', maxLength: 40 }, description: 'Other notable features.' },
            condition: { type: 'array', maxItems: 1, items: { type: 'string', enum: ['fresh', 'weathered', 'polished', 'broken', 'unknown'] }, description: 'Physical state (single value).' },
          },
        },
        confidence_notes: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 160 }, description: 'Reasons for uncertainty (e.g. "image blurry", "no location").' },
        caution: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 160 }, description: 'Safety warnings or lookalikes.' },
        red_flags: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 160 }, description: 'Serious inconsistencies found.' },
      },
    },
  };
};

// Deprecated: For backward compatibility if needed, but prefer strict usage.
// Defaulting to Explore mode for current development phase.
export const RANGER_SYSTEM_PROMPT = getRangerSystemPrompt('explore');
export const RANGER_SCHEMA = getRangerSchema('explore');
