# Ranger Al: Full Interaction Context


## 1. High Level Persona (AGENTS.md)
# Ocal: Agent Guidance (v2.0 - "The Magic Container")

## Current Date: 2026-01-01

- this is for model knowledge in case out of date tools/models are suggested

## 1. Core Philosophy: "The Silent Partner"

Ocal is a field geologist's digital notebook for seniors (Carol & Jim). It is high-contrast, offline-first, and respectful of the user's time.

- **The "Magic Container" Rule:** We have removed the Inbox. Users capture finds, and they simply _appear_ in the Gallery. The sorting and identifying happens quietly in the background.
- **Curator, Not Teacher:** The AI should provide _context_ (age, formation, history), not _description_ (visual evidence the user can already see).
- **Safety First:** The AI must passively warn users about legal restrictions (e.g., National Parks) based on location.

---

## 2. The User Persona

- **Who:** Carol & Jim (65+), retired professionals living on the coast.
- **Physical Context:** Bright sunlight, cold hands, reading glasses often forgotten.
- **Mental Model:** "I want to snap a photo and keep walking. I'll look at the details when I have my coffee.".
- **Key Friction:** They hate "managing" data. Do not ask them to categorize, sort, or move files.

---

## 3. Architecture & Workflow (The "Truth")

_Reference Sources (Screenshots) and (Architecture)_

### A. Navigation Structure

- **Tabs:** Only **CAPTURE** and **GALLERY**. (The "Inbox" is dead).
- **Gallery Headers:** **"All"** and **"Favorites"**. (The "Review" tab is dead).

### B. The "Auto-Queue" Data Flow

1.  **Capture:** User taps "Save" in `CaptureScreen`.
2.  **Immediate Persistence:** Item is saved to SQLite (`finds` table) with `status: 'pending'`.
3.  **Visual Feedback:** The item appears immediately at the top of the `GalleryScreen` grid with the **"Rough" (Dashed)** icon.
4.  **Background Service:** `IdentifyQueueService` detects the pending item and initiates the API call to Gemini.
5.  **Optimistic UI:** The UI never blocks. The card updates live when the background service finishes.

---

## 4. The "Curator" AI Logic

_Reference Sources,,_

### A. System Prompt Strategy

**Goal:** Shift from "Visual Identification" to "Geologic Context."

- **Forbidden:** Do not list visual features (e.g., "fan-like shape," "red color") unless specifically debugging. The user has eyes.
- **Required:** Provide **Deep Context** based on Location + ID.

**Example Input:**

- _Image:_ Translucent orange stone.
- _Location:_ Waldport, OR.

**Example Output (The Curator):**

- **ID:** Carnelian Agate.
- **Age:** Miocene Epoch (~23 Million Years).
- **Formation:** Likely weathered from the **Astoria Formation** or **Columbia River Basalts** (Unit `uTvc`).
- **Context:** "These agates formed in gas cavities of ancient lava flows and were released as the host rock eroded into the sea.".

### B. Identification Rules (Knowledge Base)

Inject these rules into the RAG/Prompt context:

1.  **Agate vs. Jasper:** Agate is translucent (light passes through). Jasper is opaque (no light). If mixed, it is "Jaspagate".
2.  **Regional Specials:**
    - **Short Beach/Oceanside:** Known for **Green Jasper**.
    - **Big Sur (Jade Cove):** Nephrite Jade (Green, Blue, Vulcan). _Warning: Strict collection rules_.
    - **Puget Sound:** Petrified Wood (State Gem), often buried by volcanic ash.

---

## 5. Safety & Ethics Protocols

_Reference Sources,,_

The AI must act as a Ranger. If the GPS coordinates match these zones, inject a **warning badge** into the UI:

1.  **National Parks/Monuments:** "Collecting Prohibited".
2.  **Kiket Island (WA):** "Kukutali Preserve - Observation Only".
3.  **Jade Cove (CA):** "Strict Rules: Below mean high tide only. No lift bags. Hand tools only.".
4.  **Glass Beach (Fort Bragg):** "Collecting discouraged/prohibited" (Depleted resource).

---

## 6. The Visual Language (Status Icons)

_Reference Sources_

Never use text to indicate status. Use the **Dynamic Icon System**:

1.  **Rough (Pending):**
    - _Visual:_ Dashed Outline of a pebble.
    - _Meaning:_ "Saved to device. Waiting for AI."
2.  **Polishing (Processing):**
    - _Visual:_ Pulsing animation of the outline.
    - _Meaning:_ "The Curator is analyzing..."
3.  **Polished (Result):**
    - _Visual:_ Solid Shape.
      - **Circle/Oval:** Mineral/Agate/Jasper.
      - **Spiral:** Fossil (Ammonite/Shell).
      - **Triangle:** Artifact/Shard.

---

## 7. Tech Stack & Styling

- **Styling:** No Tailwind. Use React Native `StyleSheet` with `ThemeContext`.
- **Typography:** Large text. Minimum body size `16px`. Headers `24px+`.
- **Theme:**
  - **Capture:** High Contrast (Black/Neon).
  - **Gallery:** Journal (Paper/Teal/Glassmorphism).
- **State:** React Context (`SessionContext`). No Redux.

---

## 8. Current Implementation Priorities

1.  **Phase 5: Poster Mode:** Build the "Fossil Plate" grid generator for social sharing.
2.  **Multimodal Experiments:** Test video/multi-image input with Gemini 2.0 for 3D understanding.
3.  **Refine Geologic Context:** Use feedback from the new AI output to tune prompts for specific formations.


## 2. Client Side Prompt (rockIdPrompt.ts)
import { RockIdSchema } from './rockIdSchema';

export const ROCK_ID_SYSTEM_PROMPT = `
You are "Ranger Al," a retired Geologist and friendly guide.
Goal: Identify the specimen and provide rich Geologic Context tailored to the Pacific Coast.

Persona Rules:
- You are "Ranger Al", a retired Pacific Coast park ranger.
- You are knowledgeable about coastal specimens and excited to learn more.
- focus on facts, geology, and history.
- BE CONCISE. Avoid flowery language or filler.
- DO NOT express personal affection (e.g., "I love you") or be overly familiar. Keep it professional.
- Use a "teacher/mentor" tone.

Output Rules:
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


## 3. Server Side Prompt (rockIdPrompt.js)
const { RockIdSchema } = require('./rockIdSchema');

// System prompt with guardrails for RockID Assistant.
const ROCK_ID_SYSTEM_PROMPT = `
You are "Ranger Al," a retired Geologist and Park Ranger guiding a senior beachcomber.
Goal: Identify the specimen and provide rich Geologic Context tailored to the Pacific Coast.

Identity & Tone:
- You are "Ranger Al", a retired Pacific Coast park ranger.
- You are knowledgeable, safe, and respectful.
- Use short, declarative sentences. Avoid slang or gamification.
- BE CONCISE. No flowery language or filler.
- Be encouraging (e.g., "A wonderful specimen").
- DO NOT express personal affection (e.g., "I love you") or be overly familiar. Keep it professional.

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
- Output must be valid JSON matching the provided schema exactly.
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

function buildRockIdUserPrompt(params = {}) {
  const { location_hint, context_notes, user_goal, session_context } = params;

  let prompt = [
    'Identify this specimen for cataloging.',
    `location_hint: ${location_hint ?? ''}`,
    `context_notes: ${context_notes ?? ''}`,
    `user_goal: ${user_goal ?? ''}`
  ];

  if (session_context) {
     if (session_context.sessionName) prompt.push(`session_name: ${session_context.sessionName}`);
     if (session_context.sessionLocation) prompt.push(`session_location: ${session_context.sessionLocation}`);
     if (session_context.sessionTime) prompt.push(`session_time: ${session_context.sessionTime}`);
  }

  prompt.push('Return JSON only.');

  return prompt.join('\n');
}

module.exports = {
  RockIdSchema,
  ROCK_ID_SYSTEM_PROMPT,
  buildRockIdUserPrompt,
};


## 4. Configuration & Schema Logic (RangerConfig.ts)
export type RangerMode = "explore" | "ship";

export const getRangerSystemPrompt = (mode: RangerMode = "explore") => {
  const basePrompt = `
You are "Ranger Al," a retired Pacific Coast park ranger guiding a senior beachcomber.
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
- Catalog Tags: All values must be lowercase snake_case.
- Category: Use 'fossil' ONLY if the specimen is primarily a fossil body or fragment. Fossiliferous rock stays 'rock'.
- Context Output:
  1. Age: Geologic epoch (e.g., "Miocene (~20 MYA)").
  2. Geology Hypothesis: Provide 'name' (Formation), 'confidence' (high/medium/low), and 'evidence' (array of cues).
  3. Type: Use the Simplified Terminology (e.g., "Volcanic Stone (Basalt)").
  4. Historical Fact: A fascinating, single-sentence fact about seeing the past. Max 180 chars. Focus on how it formed.
- Category Details:
  - If Mineral: Provide crystal system, chemical formula, hardness, and optical properties.
  - If Rock: Provide texture, composition, and environment.
  - If Fossil: Provide taxonomy, living relative, and preservation mode.
  - If Artifact: Provide origin and age range.
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
      description: 'Structured identification result for a rock, mineral, or fossil specimen.',
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
          description: 'The most likely identification based on visible features.',
          // additionalProperties removed for Gemini compatibility
          required: ['label', 'confidence', 'category'],
          properties: {
            label: { type: 'string', minLength: 1, maxLength: 80, description: 'Common name of the specimen (e.g. "Banded Agate").' },
            confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Confidence score (0.0 to 1.0).' },
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
           description: '2-3 sentence summary of the find from Ranger Al. No AI mention.'
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
                crystal_system: { type: 'string', nullable: true },
                chemical_formula: { type: 'string', nullable: true },
                hardness_scale: { type: 'string', nullable: true },
                optical_properties: { type: 'string', nullable: true }
              }
            },
            rock: {
              type: 'object',
              nullable: true,
              properties: {
                texture_type: { type: 'string', nullable: true },
                mineral_composition: { type: 'string', nullable: true },
                depositional_environment: { type: 'string', nullable: true }
              }
            },
            fossil: {
              type: 'object',
              nullable: true,
              properties: {
                taxonomy: { type: 'string', nullable: true },
                living_relative: { type: 'string', nullable: true },
                preservation_mode: { type: 'string', nullable: true }
              }
            },
            artifact: {
              type: 'object',
              nullable: true,
              properties: {
                likely_origin: { type: 'string', nullable: true },
                estimated_age_range: { type: 'string', nullable: true }
              }
            }
          }
        },
        alternatives: {
          type: 'array',
          description: 'Other possible identifications if the best guess is uncertain.',
          maxItems: 5,
          items: {
            type: 'object',
            // additionalProperties removed for Gemini compatibility
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
          // additionalProperties removed for Gemini compatibility
          required: ['age', 'geology_hypothesis', 'type', 'historical_fact'],
          properties: {
            age: { type: 'string', maxLength: 60, description: 'Geologic epoch/period (e.g. "Miocene (~23 MYA)").' },
            geology_hypothesis: {
                type: 'object',
                // additionalProperties removed for Gemini compatibility
                required: ['name', 'confidence', 'evidence'],
                properties: {
                    name: { type: 'string', nullable: true, maxLength: 60, description: 'Specific formation name if supported by evidence, else null.' },
                    confidence: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Confidence in the formation assignment.' },
                    evidence: { type: 'array', items: { type: 'string' }, maxItems: 3, description: 'Cues used (e.g. "location_map", "visual_texture").' }
                }
            },
            type: { type: 'string', maxLength: 60, description: 'Scientific classification (e.g. "Marine Bivalve").' },
            historical_fact: { type: 'string', maxLength: 300, description: 'Fascinating fact about the era/environment.' }
          }
        },
        lapidary_guidance: {
          type: "object",
          description: "Advice for polishing or tumbling this specimen.",
          // additionalProperties removed for Gemini compatibility
          required: ["is_tumble_candidate", "tumble_reason"],
          properties: {
            is_tumble_candidate: {
              type: "boolean",
              description:
                "True if hard enough (Mohs > 6) and non-porous. False if soft/crumbly.",
            },
            tumble_reason: {
              type: "string",
              maxLength: 165,
              description:
                'Why it is or isn\'t a candidate (e.g. "Hardness 7, takes high polish").',
            },
            special_care: {
              type: "string",
              maxLength: 100,
              description:
                'Optional tips (e.g. "Use plastic pellets for cushioning").',
            },
          },
        },
        region_fit: {
          type: "object",
          description: "Assessment of plausibility given the location hint.",
          // additionalProperties removed for Gemini compatibility
          required: ["location_hint", "fit", "note"],
          properties: {
            location_hint: {
              type: "string",
              nullable: true,
              maxLength: 120,
              description: "The provided location context, or null.",
            },
            fit: {
              type: "string",
              enum: ["high", "medium", "low", "unknown"],
              description: "How well the ID matches the local geology.",
            },
            note: {
              type: "string",
              nullable: true,
              maxLength: 160,
              description:
                'Brief explanation of the fit (e.g. "Common in Lake Superior region").',
            },
          },
        },
        followup_photos: {
          type: "array",
          description:
            'Requests for specific additional angles or lighting (e.g. "wet photo", "backlit").',
          maxItems: 5,
          items: { type: "string", maxLength: 120 },
        },
        followup_questions: {
          type: "array",
          description:
            'Simple tests the user can perform (e.g. "scratch with steel", "check magnetism").',
          maxItems: 5,
          items: { type: "string", maxLength: 120 },
        },
        catalog_tags: {
          type: "object",
          description: "Structured attributes for filtering and organizing.",
          // additionalProperties removed for Gemini compatibility
          required: [
            "type",
            "color",
            "pattern",
            "luster",
            "translucency",
            "grain_size",
            "features",
            "condition",
          ],
          properties: {
            type: {
              type: "array",
              maxItems: 6,
              items: { type: "string", maxLength: 40 },
              description: 'Broad types (e.g. "sedimentary", "quartz").',
            },
            color: {
              type: "array",
              maxItems: 6,
              items: { type: "string", maxLength: 30 },
              description: "Dominant colors.",
            },
            pattern: {
              type: "array",
              maxItems: 6,
              items: { type: "string", maxLength: 40 },
              description: 'Visual patterns (e.g. "banded", "spotted").',
            },
            luster: {
              type: "array",
              maxItems: 4,
              items: { type: "string", maxLength: 30 },
              description: 'Surface reflectiveness (e.g. "waxy", "vitreous").',
            },
            translucency: {
              type: "array",
              maxItems: 1,
              items: {
                type: "string",
                enum: ["opaque", "translucent", "transparent", "unknown"],
              },
              description: "Light transmission (single value).",
            },
            grain_size: {
              type: "array",
              maxItems: 4,
              items: {
                type: "string",
                enum: ["fine", "medium", "coarse", "mixed", "unknown"],
              },
              description: "Texture granularity (single value).",
            },
            features: {
              type: "array",
              maxItems: 10,
              items: { type: "string", maxLength: 40 },
              description: "Other notable features.",
            },
            condition: {
              type: "array",
              maxItems: 1,
              items: {
                type: "string",
                enum: ["fresh", "weathered", "polished", "broken", "unknown"],
              },
              description: "Physical state (single value).",
            },
          },
        },
        confidence_notes: {
          type: "array",
          maxItems: 6,
          items: { type: "string", maxLength: 160 },
          description:
            'Reasons for uncertainty (e.g. "image blurry", "no location").',
        },
        caution: {
          type: "array",
          maxItems: 6,
          items: { type: "string", maxLength: 160 },
          description: "Safety warnings or lookalikes.",
        },
        red_flags: {
          type: "array",
          maxItems: 4,
          items: { type: "string", maxLength: 160 },
          description: "Serious inconsistencies found.",
        },
      },
    },
  };
};

// Deprecated: For backward compatibility if needed, but prefer strict usage.
// Defaulting to Explore mode for current development phase.
export const RANGER_SYSTEM_PROMPT = getRangerSystemPrompt("explore");
export const RANGER_SCHEMA = getRangerSchema("explore");


## 5. Schema Definition (rockIdSchema.ts)
// JSON Schema for RockID Assistant structured outputs. Keep lengths tight to avoid overflow.
export const RockIdSchema = {
  name: 'rock_id_result',
  strict: true,
  schema: {
    type: 'object',
    description: 'Structured identification result for a rock, mineral, or fossil specimen.',
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
        description: 'The most likely identification based on visible features.',
        additionalProperties: false,
        required: ['label', 'confidence', 'category'],
        properties: {
          label: { type: 'string', minLength: 1, maxLength: 80, description: 'Common name of the specimen (e.g. "Banded Agate").' },
          confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Confidence score (0.0 to 1.0).' },
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
         description: '2-3 sentence summary of the find from Ranger Al. No AI mention.'
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
              crystal_system: { type: 'string', nullable: true, maxLength: 60 },
              chemical_formula: { type: 'string', nullable: true, maxLength: 60 },
              hardness_scale: { type: 'string', nullable: true, maxLength: 60 },
              optical_properties: { type: 'string', nullable: true, maxLength: 100 }
            }
          },
          rock: {
            type: 'object',
            nullable: true,
            properties: {
              texture_type: { type: 'string', nullable: true, maxLength: 100 },
              mineral_composition: { type: 'string', nullable: true, maxLength: 100 },
              depositional_environment: { type: 'string', nullable: true, maxLength: 100 }
            }
          },
          fossil: {
            type: 'object',
            nullable: true,
            properties: {
              taxonomy: { type: 'string', nullable: true, maxLength: 100 },
              living_relative: { type: 'string', nullable: true, maxLength: 80 },
              preservation_mode: { type: 'string', nullable: true, maxLength: 80 }
            }
          },
          artifact: {
            type: 'object',
            nullable: true,
            properties: {
              likely_origin: { type: 'string', nullable: true, maxLength: 150, description: 'Brief hypothesis on origin (e.g. "Bottle glass, mid-20th century").' },
              estimated_age_range: { type: 'string', nullable: true, maxLength: 60 }
            }
          }
        }
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
        description: 'Geologic and historical context inferred from the identification and location.',
        additionalProperties: false,
        required: ['age', 'geology_hypothesis', 'type', 'historical_fact'],
        properties: {
          age: { type: 'string', maxLength: 60, description: 'Geologic time period (e.g. "Miocene (~23 MYA)").' },
          geology_hypothesis: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'confidence', 'evidence'],
            properties: {
                name: { type: ['string', 'null'], maxLength: 60, description: 'Specific formation name if supported by evidence, else null.' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Confidence in the formation assignment.' },
                evidence: { type: 'array', items: { type: 'string' }, maxItems: 3, description: 'Cues used (e.g. "location_map", "visual_texture").' }
            }
          },
          type: { type: 'string', maxLength: 60, description: 'Scientific classification (e.g. "Marine Bivalve").' },
          historical_fact: { type: 'string', maxLength: 300, description: 'A fascinating "Did You Know?" fact about this specimen in its ancient environment.' }
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
          note: { type: ['string', 'null'], maxLength: 160, description: 'Brief explanation of the fit. Do not state formation as fact if fit is low.' },
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
        description: 'Structured attributes for filtering and organizing. All values must be snake_case.',
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
      sourceImages: { uri: string; shotType?: string }[];
      locationUsed: boolean;
      userGoal: string;
    };
    result: RockIdResult;
}
