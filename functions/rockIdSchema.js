// JSON Schema for RockID Assistant structured outputs. Keep lengths tight to avoid overflow.
exports.RockIdSchema = {
  name: 'rock_id_result',
  strict: true,
  schema: {
    type: 'object',
    description: 'Structured identification result for a rock, mineral, or fossil specimen.',
    additionalProperties: false,
    required: [
      'best_guess',
      'alternatives',
      'observable_reasons',
      // 'region_fit',
      // 'followup_photos',
      // 'followup_questions',
      // 'catalog_tags',
      // 'confidence_notes',
      // 'caution',
      // 'red_flags',
    ],
    properties: {
      best_guess: {
        type: 'object',
        description: 'The most likely identification based on visible features.',
        additionalProperties: false,
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
      observable_reasons: {
          type: 'array',
          description: 'List of visible physical traits used for ID (e.g. "conchoidal fracture", "translucent edges").',
          maxItems: 8,
          items: { type: 'string', maxLength: 140 }
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
          grain_size: { type: 'array', maxItems: 1, items: { type: 'string', enum: ['fine', 'medium', 'coarse', 'mixed', 'unknown'] }, description: 'Texture granularity (single value).' },
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
