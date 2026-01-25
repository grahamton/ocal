// JSON Schema for RockID Assistant structured outputs. Keep lengths tight to avoid overflow.
export const RockIdSchema = {
  name: 'rock_id_result',
  strict: true,
  schema: {
    type: 'object',
    description:
      'Structured identification result for a rock, mineral, or fossil specimen.',
    additionalProperties: false,
    required: [
      'best_guess',
      'ranger_summary',
      'alternatives',
      'specimen_context',
      'lapidary_guidance',
      'region_fit',
      'followup_photos',
      'followup_questions',
      'catalog_tags',
      'confidence_notes',
      'caution',
      'red_flags',
    ],
    properties: {
      best_guess: {
        type: 'object',
        description:
          'The most likely identification based on visible features.',
        additionalProperties: false,
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
          '2-3 sentence summary/story from Ranger Al. This is the ONLY place for general narrative. Do not repeat specific fields.',
      },
      category_details: {
        type: 'object',
        description: 'Detailed analysis specific to the category.',
        additionalProperties: false,
        properties: {
          mineral: {
            type: 'object',
            nullable: true,
            properties: {
              crystal_system: {
                type: 'string',
                nullable: true,
                maxLength: 60,
                description: 'Scientific Name ONLY (e.g. "Hexagonal").',
              },
              chemical_formula: {
                type: 'string',
                nullable: true,
                maxLength: 60,
                description: 'Standard formula (e.g. "SiO2").',
              },
              hardness_scale: {
                type: 'string',
                nullable: true,
                maxLength: 60,
                description: 'Mohs value or range (e.g. "7").',
              },
              optical_properties: {
                type: 'string',
                nullable: true,
                maxLength: 100,
                description: 'Brief keywords (e.g. "Double refractive").',
              },
            },
          },
          rock: {
            type: 'object',
            nullable: true,
            properties: {
              texture_type: {
                type: 'string',
                nullable: true,
                maxLength: 80,
                description:
                  'Scientific term ONLY (e.g. "Phaneritic", "Glassy"). NO description.',
              },
              mineral_composition: {
                type: 'string',
                nullable: true,
                maxLength: 100,
                description: 'Comma-separated list of minerals.',
              },
              depositional_environment: {
                type: 'string',
                nullable: true,
                maxLength: 100,
                description: 'Brief environment name (e.g. "Riverbed").',
              },
            },
          },
          fossil: {
            type: 'object',
            nullable: true,
            properties: {
              taxonomy: {
                type: 'string',
                nullable: true,
                maxLength: 120,
                description:
                  'Scientific classification hierarchy (e.g. "Mollusca > Bivalvia"). NO explanation.',
              },
              living_relative: {
                type: 'string',
                nullable: true,
                maxLength: 80,
                description: 'Common name of modern equivalent.',
              },
              preservation_mode: {
                type: 'string',
                nullable: true,
                maxLength: 80,
                description: 'Geologic process (e.g. "Permineralization").',
              },
            },
          },
          artifact: {
            type: 'object',
            nullable: true,
            properties: {
              likely_origin: {
                type: 'string',
                nullable: true,
                maxLength: 120,
                description:
                  'Short hypothesis (e.g. "Mid-century soda bottle"). NO history lesson.',
              },
              estimated_age_range: {
                type: 'string',
                nullable: true,
                maxLength: 60,
              },
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
          additionalProperties: false,
          required: ['label', 'confidence'],
          properties: {
            label: {type: 'string', minLength: 1, maxLength: 80},
            confidence: {type: 'number', minimum: 0, maximum: 1},
          },
        },
      },
      specimen_context: {
        type: 'object',
        description:
          'Geologic and historical context inferred from the identification and location.',
        additionalProperties: false,
        required: ['age', 'geology_hypothesis', 'type', 'historical_fact'],
        properties: {
          age: {
            type: 'string',
            maxLength: 60,
            description: 'Geologic time period (e.g. "Miocene (~23 MYA)").',
          },
          geology_hypothesis: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'confidence', 'evidence'],
            properties: {
              name: {
                type: ['string', 'null'],
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
            maxLength: 250,
            description:
              'ONE standalone trivia fact. Do NOT overlap with ranger_summary.',
          },
        },
      },
      lapidary_guidance: {
        type: 'object',
        description: 'Advice for polishing or tumbling this specimen.',
        additionalProperties: false,
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
        additionalProperties: false,
        required: ['location_hint', 'fit', 'note'],
        properties: {
          location_hint: {
            type: ['string', 'null'],
            maxLength: 120,
            description: 'The provided location context, or null.',
          },
          fit: {
            type: 'string',
            enum: ['high', 'medium', 'low', 'unknown'],
            description: 'How well the ID matches the local geology.',
          },
          note: {
            type: ['string', 'null'],
            maxLength: 160,
            description:
              'Brief explanation of the fit. Do not state formation as fact if fit is low.',
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
        description:
          'Structured attributes for filtering and organizing. All values must be snake_case.',
        additionalProperties: false,
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
} as const;

// Explicit type matching the schema above
// rockIdSchema.ts
// Defines the exact shape of the JSON output we expect from Ranger Al (Gemini 2.0).

export interface MineralDetail {
  crystal_system?: string; // e.g., "Hexagonal", "Cubic"
  chemical_formula?: string; // e.g., "SiO2"
  hardness_scale?: string; // e.g., "7 (Mohs)"
  optical_properties?: string; // e.g., "Double refractive"
}

export interface RockDetail {
  texture_type?: string; // e.g., "Phaneritic", "Glassy"
  mineral_composition?: string; // e.g., "Quartz, Feldspar, Mica"
  depositional_environment?: string; // e.g., "High-energy beach"
}

export interface FossilDetail {
  taxonomy?: string; // e.g., "Mollusca > Bivalvia"
  living_relative?: string; // e.g., "Modern Clam"
  preservation_mode?: string; // e.g., "Cast", "Permineralization"
}

export interface ArtifactDetail {
  likely_origin?: string; // e.g., "Glass Bottle", "Industrial Slag"
  estimated_age_range?: string; // e.g., "1920s-1950s"
}

export interface RockIdResponse {
  best_guess: {
    label: string;
    confidence: number;
    category: 'rock' | 'mineral' | 'fossil' | 'manmade' | 'unknown';
  };
  ranger_summary: string;
  category_details?: {
    mineral?: MineralDetail;
    rock?: RockDetail;
    fossil?: FossilDetail;
    artifact?: ArtifactDetail;
  };
  alternatives: {
    label: string;
    confidence: number;
  }[];
  specimen_context: {
    age: string;
    geology_hypothesis: {
      name: string | null;
      confidence: 'high' | 'medium' | 'low';
      evidence: string[];
    };
    type: string;
    historical_fact: string;
  };
  lapidary_guidance: {
    is_tumble_candidate: boolean;
    tumble_reason: string;
    special_care?: string;
  };
  region_fit: {
    location_hint: string | null;
    fit: 'high' | 'medium' | 'low' | 'unknown';
    note: string | null;
  };
  followup_photos: string[];
  followup_questions: string[];
  catalog_tags: {
    type: string[];
    color: string[];
    pattern: string[];
    luster: string[];
    translucency: ('opaque' | 'translucent' | 'transparent' | 'unknown')[];
    grain_size: ('fine' | 'medium' | 'coarse' | 'mixed' | 'unknown')[];
    features: string[];
    condition: ('fresh' | 'weathered' | 'polished' | 'broken' | 'unknown')[];
  };
  confidence_notes: string[];
  caution: string[];
  red_flags: string[];
}

export type RockIdResult = RockIdResponse;

export interface AnalysisEvent {
  meta: {
    schemaVersion: string;
    aiModel: string;
    aiModelVersion: string;
    promptHash: string;
    pipelineVersion: string;
    runId: string;
    runNumber?: number;
    timestamp: string;
  };
  input: {
    sourceImages: {uri: string; shotType?: string}[];
    locationUsed: boolean;
    userGoal: string;
  };
  result: RockIdResult;
}
