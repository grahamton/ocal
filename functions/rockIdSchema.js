// JSON Schema for RockID Assistant structured outputs. Keep lengths tight to avoid overflow.
exports.RockIdSchema = {
  name: 'rock_id_result',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'best_guess',
      'alternatives',
      'observable_reasons',
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
        additionalProperties: false,
        required: ['label', 'confidence', 'category'],
        properties: {
          label: { type: 'string', minLength: 1, maxLength: 80 },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          category: {
            type: 'string',
            enum: ['rock', 'mineral', 'fossil', 'artifact_like', 'unknown'],
          },
        },
      },
      alternatives: {
        type: 'array',
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
      observable_reasons: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 140 } },
      region_fit: {
        type: 'object',
        additionalProperties: false,
        required: ['location_hint', 'fit', 'note'],
        properties: {
          location_hint: { type: ['string', 'null'], maxLength: 120 },
          fit: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'] },
          note: { type: ['string', 'null'], maxLength: 160 },
        },
      },
      followup_photos: { type: 'array', maxItems: 5, items: { type: 'string', maxLength: 120 } },
      followup_questions: { type: 'array', maxItems: 5, items: { type: 'string', maxLength: 120 } },
      catalog_tags: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'color', 'pattern', 'luster', 'translucency', 'grain_size', 'features', 'condition'],
        properties: {
          type: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 40 } },
          color: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 30 } },
          pattern: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 40 } },
          luster: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 30 } },
          translucency: { type: 'array', maxItems: 1, items: { type: 'string', enum: ['opaque', 'translucent', 'transparent', 'unknown'] } },
          grain_size: { type: 'array', maxItems: 1, items: { type: 'string', enum: ['fine', 'medium', 'coarse', 'mixed', 'unknown'] } },
          features: { type: 'array', maxItems: 10, items: { type: 'string', maxLength: 40 } },
          condition: { type: 'array', maxItems: 1, items: { type: 'string', enum: ['fresh', 'weathered', 'polished', 'broken', 'unknown'] } },
        },
      },
      confidence_notes: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 160 } },
      caution: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 160 } },
      red_flags: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 160 } },
    },
  },
};
