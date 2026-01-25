export type RangerMode = 'explore' | 'ship';

export const getRangerSystemPrompt = (mode: RangerMode = 'explore') => {
  const basePrompt = `
You are "Ranger Al," a retired Geologist and friendly guide for senior beachcomber.
Goal: Identify the specimen and provide rich Geologic Context tailored to the Pacific Coast.

Identity & Tone:
- You are "Ranger Al," a retired Geologist and friendly guide for senior beachcombers.
- Tone: Warm, professional, and encouraging. Think "Campfire Storyteller," not "Textbook."
- Style: You may use descriptive language to connect the user's find to the geologic history.
- Validation: Always validate the user's "eye." Even if it is a common Leaverite, compliment the color or shape that likely caught their attention before identifying it.

Terminology Rules (Senior Friendly):
- "Volcanic Stone" instead of Igneous.
- "Sand & Mud Stone" instead of Sedimentary.
- "Cooked Stone" instead of Metamorphic.
- "Sea Glass" for frosted man-made glass.
- "Shell-like Fracture" instead of Conchoidal Fracture.
- Use the Simplified Terminology for types:
  - Minerals: "Mineral (Quartz)", "Mineral (Agate)".
  - Rocks: "Volcanic Stone (Basalt)", "Sand and Mud Stone (Sandstone)".

Knowledge Base (Pacific Coast):
- Default Context: Pacific Northwest / West Coast beaches (Oregon, Washington, California).
- "The Keepers": Agates, Jaspers, Petrified Wood (Translucent, Waxy).
- "The Storytellers": Fossils (Marine Bivalves, Gastropods).
- "The Leaverites": Basalt, Granite, Brick (Opaque, Dull).
- Reality Check: If a rock looks like "Obsidian" but is on a sedimentary beach, suggest "Dark Basalt" or "Sea Glass" unless confident.
- Lapidary Check: Tumblers need Mohs > 6 and non-porous structure. Agates/Jaspers = YES. Basalt/Sandstone = NO.

Rules:
- Output must be valid JSON matching the provided schema.
- Ranger Summary: Provide a 2-3 sentence summary of the find. No AI mention.
  - Celebrate "The Keepers" explicitly (e.g., "This is a keeper!").
  - Humility: If confidence is low, admit uncertainty (e.g., "It's a bit of a mystery, but...").
- Catalog Tags: All values must be lowercase snake_case.
- Category: Use 'fossil' ONLY if the specimen is primarily a fossil body or fragment. Fossiliferous rock stays 'rock'.
- Context Output:
  1. Age: Geologic epoch (e.g., "Miocene (~20 MYA)").
  2. Geology Hypothesis: Provide 'name' (Formation), 'confidence' (high/medium/low), and 'evidence' (array of cues).
  3. Type: Use the Simplified Terminology (e.g., "Volcanic Stone (Basalt)").
  4. Historical Fact: Connect this specific specimen to the location's deep history. (e.g., "This agate formed in a gas bubble in lava that flowed here 20 million years ago," rather than just "Agates form in lava.")
- Category Details:
  - If Mineral: Provide crystal system, chemical formula, hardness, and optical properties.
  - If Rock: Provide texture, composition, and environment.
  - If Fossil: Provide taxonomy, living relative, and preservation mode.
  - If Artifact: Provide origin and age range.
- Lapidary Output:
  1. is_tumble_candidate: boolean. True only for Agate, Jasper, Quartz, Petrified Wood. False for Basalt, Granite (pitting), Sandstone (too soft).
  2. tumble_reason: Very short technical reason. Max 10 words. (e.g. "Mohs 7+ hardness, non-porous").
  3. special_care: Optional tips (e.g. "Use plastic pellets to prevent bruising").
- Safety: Do NOT warn about physical hazards (sharp edges, heavy rocks) unless it is immediate danger (e.g., unexploded ordnance).
- Preservation: If the identification is an artifact (glass/pottery) or fossil, gently remind the user to "leave it where you found it" if they are likely in a protected zone, but prioritize the history first.
- Location: Use provided location to infer specific formations (e.g. Waldport -> Alsea/Astoria formations).
- Session Context:
  1. Use "session_time" (Morning/Evening) to account for lighting/shadows in your visual analysis.
  2. Use "session_location" effectively if generic coordinates are missing.
  3. If "session_name" suggests a specific activity (e.g. "River Hike"), bias towards relevant rock types (e.g. river tumbled).
`.trim();

  if (mode === 'explore') {
    return `${basePrompt}\n\nMODE: EXPLORE. You are in Discovery Mode. You may add extra fields to the JSON output if they provide valuable context or new insights. Feel free to experiment with the structure while maintaining the core required fields. Geology Hypothesis must be a best effort.`;
  }

  if (mode === 'ship') {
    return `${basePrompt}\n\nMODE: SHIP. Enforce strict adherence to schema. Red flags must be an empty array if no issues. If geology confidence is low, set name to null.`;
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
      description:
        'Structured identification result for a rock, mineral, or fossil specimen.',
      // additionalProperties removed for Gemini compatibility
      required: [
        'best_guess',
        'ranger_summary',
        'alternatives',
        'specimen_context',
        'lapidary_guidance',
        'red_flags',
      ],
      properties: {
        best_guess: {
          type: 'object',
          description:
            'The most likely identification based on visible features.',
          // additionalProperties removed for Gemini compatibility
          required: ['label', 'confidence', 'category'],
          properties: {
            label: {
              type: 'string',
              minLength: 1,
              maxLength: 80,
              description: 'Common name of the specimen (e.g. "Banded Agate").',
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confidence score (0.0 to 1.0).',
            },
            category: {
              type: 'string',
              description: 'Broad classification category.',
              enum: ['rock', 'mineral', 'fossil', 'manmade', 'unknown'],
            },
          },
        },
        ranger_summary: {
          type: 'string',
          maxLength: 300,
          description:
            '2-3 sentence summary of the find from Ranger Al. No AI mention.',
        },
        category_details: {
          type: 'object',
          description: 'Detailed analysis specific to the category.',
          // additionalProperties removed for Gemini compatibility
          properties: {
            mineral: {
              type: 'object',
              nullable: true,
              properties: {
                crystal_system: {type: 'string', nullable: true},
                chemical_formula: {type: 'string', nullable: true},
                hardness_scale: {type: 'string', nullable: true},
                optical_properties: {type: 'string', nullable: true},
              },
            },
            rock: {
              type: 'object',
              nullable: true,
              properties: {
                texture_type: {type: 'string', nullable: true},
                mineral_composition: {type: 'string', nullable: true},
                depositional_environment: {type: 'string', nullable: true},
              },
            },
            fossil: {
              type: 'object',
              nullable: true,
              properties: {
                taxonomy: {type: 'string', nullable: true},
                living_relative: {type: 'string', nullable: true},
                preservation_mode: {type: 'string', nullable: true},
              },
            },
            artifact: {
              type: 'object',
              nullable: true,
              properties: {
                likely_origin: {type: 'string', nullable: true},
                estimated_age_range: {type: 'string', nullable: true},
              },
            },
          },
        },
        alternatives: {
          type: 'array',
          description:
            'Other possible identifications if the best guess is uncertain.',
          maxItems: 5,
          items: {
            type: 'object',
            // additionalProperties removed for Gemini compatibility
            required: ['label', 'confidence'],
            properties: {
              label: {type: 'string', minLength: 1, maxLength: 80},
              confidence: {type: 'number', minimum: 0, maximum: 1},
            },
          },
        },
        specimen_context: {
          type: 'object',
          description: 'Geologic context tailored to location and age.',
          // additionalProperties removed for Gemini compatibility
          required: ['age', 'geology_hypothesis', 'type', 'historical_fact'],
          properties: {
            age: {
              type: 'string',
              maxLength: 60,
              description: 'Geologic epoch/period (e.g. "Miocene (~23 MYA)").',
            },
            geology_hypothesis: {
              type: 'object',
              // additionalProperties removed for Gemini compatibility
              required: ['name', 'confidence', 'evidence'],
              properties: {
                name: {
                  type: 'string',
                  nullable: true,
                  maxLength: 60,
                  description:
                    'Specific formation name if supported by evidence, else null.',
                },
                confidence: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'Confidence in the formation assignment.',
                },
                evidence: {
                  type: 'array',
                  items: {type: 'string'},
                  maxItems: 3,
                  description:
                    'Cues used (e.g. "location_map", "visual_texture").',
                },
              },
            },
            type: {
              type: 'string',
              maxLength: 60,
              description: 'Scientific classification (e.g. "Marine Bivalve").',
            },
            historical_fact: {
              type: 'string',
              maxLength: 300,
              description: 'Fascinating fact about the era/environment.',
            },
          },
        },
        lapidary_guidance: {
          type: 'object',
          description: 'Advice for polishing or tumbling this specimen.',
          // additionalProperties removed for Gemini compatibility
          required: ['is_tumble_candidate', 'tumble_reason'],
          properties: {
            is_tumble_candidate: {
              type: 'boolean',
              description:
                'True if hard enough (Mohs > 6) and non-porous. False if soft/crumbly.',
            },
            tumble_reason: {
              type: 'string',
              maxLength: 165,
              description:
                'Why it is or isn\'t a candidate (e.g. "Hardness 7, takes high polish").',
            },
            special_care: {
              type: 'string',
              maxLength: 100,
              description:
                'Optional tips (e.g. "Use plastic pellets for cushioning").',
            },
          },
        },
        region_fit: {
          type: 'object',
          description: 'Assessment of plausibility given the location hint.',
          // additionalProperties removed for Gemini compatibility
          required: ['location_hint', 'fit', 'note'],
          properties: {
            location_hint: {
              type: 'string',
              nullable: true,
              maxLength: 120,
              description: 'The provided location context, or null.',
            },
            fit: {
              type: 'string',
              enum: ['high', 'medium', 'low', 'unknown'],
              description: 'How well the ID matches the local geology.',
            },
            note: {
              type: 'string',
              nullable: true,
              maxLength: 160,
              description:
                'Brief explanation of the fit (e.g. "Common in Lake Superior region").',
            },
          },
        },
        followup_photos: {
          type: 'array',
          description:
            'Requests for specific additional angles or lighting (e.g. "wet photo", "backlit").',
          maxItems: 5,
          items: {type: 'string', maxLength: 120},
        },
        followup_questions: {
          type: 'array',
          description:
            'Simple tests the user can perform (e.g. "scratch with steel", "check magnetism").',
          maxItems: 5,
          items: {type: 'string', maxLength: 120},
        },
        catalog_tags: {
          type: 'object',
          description: 'Structured attributes for filtering and organizing.',
          // additionalProperties removed for Gemini compatibility
          required: [
            'type',
            'color',
            'pattern',
            'luster',
            'translucency',
            'grain_size',
            'features',
            'condition',
          ],
          properties: {
            type: {
              type: 'array',
              maxItems: 6,
              items: {type: 'string', maxLength: 40},
              description: 'Broad types (e.g. "sedimentary", "quartz").',
            },
            color: {
              type: 'array',
              maxItems: 6,
              items: {type: 'string', maxLength: 30},
              description: 'Dominant colors.',
            },
            pattern: {
              type: 'array',
              maxItems: 6,
              items: {type: 'string', maxLength: 40},
              description: 'Visual patterns (e.g. "banded", "spotted").',
            },
            luster: {
              type: 'array',
              maxItems: 4,
              items: {type: 'string', maxLength: 30},
              description: 'Surface reflectiveness (e.g. "waxy", "vitreous").',
            },
            translucency: {
              type: 'array',
              maxItems: 1,
              items: {
                type: 'string',
                enum: ['opaque', 'translucent', 'transparent', 'unknown'],
              },
              description: 'Light transmission (single value).',
            },
            grain_size: {
              type: 'array',
              maxItems: 4,
              items: {
                type: 'string',
                enum: ['fine', 'medium', 'coarse', 'mixed', 'unknown'],
              },
              description: 'Texture granularity (single value).',
            },
            features: {
              type: 'array',
              maxItems: 10,
              items: {type: 'string', maxLength: 40},
              description: 'Other notable features.',
            },
            condition: {
              type: 'array',
              maxItems: 1,
              items: {
                type: 'string',
                enum: ['fresh', 'weathered', 'polished', 'broken', 'unknown'],
              },
              description: 'Physical state (single value).',
            },
          },
        },
        confidence_notes: {
          type: 'array',
          maxItems: 6,
          items: {type: 'string', maxLength: 160},
          description:
            'Reasons for uncertainty (e.g. "image blurry", "no location").',
        },
        caution: {
          type: 'array',
          maxItems: 6,
          items: {type: 'string', maxLength: 160},
          description: 'Safety warnings or lookalikes.',
        },
        red_flags: {
          type: 'array',
          maxItems: 4,
          items: {type: 'string', maxLength: 160},
          description: 'Serious inconsistencies found.',
        },
      },
    },
  };
};

// Deprecated: For backward compatibility if needed, but prefer strict usage.
// Defaulting to Explore mode for current development phase.
export const RANGER_SYSTEM_PROMPT = getRangerSystemPrompt('explore');
export const RANGER_SCHEMA = getRangerSchema('explore');
