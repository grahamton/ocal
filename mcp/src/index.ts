import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from local .env
dotenv.config();

// Default model to a highly accessible vision-capable model
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const RANGER_SYSTEM_PROMPT = `
You are "Ranger Al," a retired Geologist and friendly guide for senior beachcombers.
Goal: Identify the specimen and provide rich Geologic Context tailored to the Pacific Coast (or other local regions if context indicates).

Identity & Tone:
- Tone: Warm, professional, and encouraging. Think "Campfire Storyteller," not "Textbook."
- Style: Use descriptive language to connect the user's find to deep geologic history.
- Validation: Always validate the user's "eye." Even if it is a common "Leaverite" (leave it right there!), compliment the color, texture, or shape that caught their attention before identifying it.

Terminology Rules (Senior Friendly):
- "Volcanic Stone" instead of Igneous.
- "Sand & Mud Stone" instead of Sedimentary.
- "Cooked Stone" instead of Metamorphic.
- "Sea Glass" for frosted man-made glass.
- "Shell-like Fracture" instead of Conchoidal Fracture.
- Use Simplified Terminology for types:
  - Minerals: "Mineral (Quartz)", "Mineral (Agate)".
  - Rocks: "Volcanic Stone (Basalt)", "Sand and Mud Stone (Sandstone)".

Rules:
- Ranger Summary: Provide a 2-3 sentence summary of the find in your storytelling voice.
  - Celebrate "The Keepers" explicitly (e.g., "This is a keeper!").
  - Humility: If confidence is low, admit uncertainty (e.g., "It's a bit of a mystery, but...").
- Lapidary Check: Tumblers need Mohs > 6 and non-porous structure. Agates/Jaspers = YES. Basalt/Sandstone = NO.
- Output MUST be valid JSON matching the requested schema.
`;

const RANGER_SCHEMA = {
  type: 'object',
  properties: {
    best_guess: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Common name of the specimen (e.g. "Banded Agate")' },
        confidence: { type: 'number', description: 'Confidence score (0.0 to 1.0)' },
        category: { type: 'string', enum: ['rock', 'mineral', 'fossil', 'manmade', 'unknown'] }
      },
      required: ['label', 'confidence', 'category']
    },
    ranger_summary: { type: 'string', description: '2-3 sentence summary of the find from Ranger Al.' },
    specimen_context: {
      type: 'object',
      properties: {
        age: { type: 'string', description: 'Geologic epoch/period (e.g. "Miocene (~20 MYA)")' },
        type: { type: 'string', description: 'Simplified classification (e.g. "Volcanic Stone (Basalt)")' },
        historical_fact: { type: 'string', description: 'Fascinating fact about the era/environment of formation.' }
      },
      required: ['age', 'type', 'historical_fact']
    },
    lapidary_guidance: {
      type: 'object',
      properties: {
        is_tumble_candidate: { type: 'boolean', description: 'True if hard enough (Mohs > 6) and non-porous' },
        tumble_reason: { type: 'string', description: 'Why it is or isn\'t a candidate' },
        special_care: { type: 'string', description: 'Optional tumbling tips' }
      },
      required: ['is_tumble_candidate', 'tumble_reason']
    },
    alternatives: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          confidence: { type: 'number' }
        },
        required: ['label', 'confidence']
      }
    }
  },
  required: ['best_guess', 'ranger_summary', 'specimen_context', 'lapidary_guidance', 'alternatives']
};

// Initialize Google Generative AI
const getAI = (): GoogleGenerativeAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable.');
  }
  return new GoogleGenerativeAI(apiKey);
};

// Create the MCP server
const server = new Server(
  {
    name: 'ranger-al-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register list_tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'identify_rock_specimen',
        description: 'Analyze an image of a rock or mineral to identify it and receive geological/lapidary advice from Ranger Al.',
        inputSchema: {
          type: 'object',
          properties: {
            imagePath: {
              type: 'string',
              description: 'The absolute file path to the local image of the rock specimen.',
            },
            locationHint: {
              type: 'string',
              description: 'Optional human-readable location where the rock was found (e.g. "Waldport, Oregon beach").',
            },
            userNotes: {
              type: 'string',
              description: 'Optional notes, observation details, or waxy/translucent description.',
            },
          },
          required: ['imagePath'],
        },
      },
      {
        name: 'ask_ranger_al',
        description: 'Ask Ranger Al any question about geology, rockhounding, minerals, or fossils.',
        inputSchema: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'The question to ask Ranger Al (e.g. "Why are beach agates translucent?").',
            },
          },
          required: ['question'],
        },
      },
      {
        name: 'get_tumble_advice',
        description: 'Get custom, witty rock tumbling and polishing advice for a specific rock or mineral type.',
        inputSchema: {
          type: 'object',
          properties: {
            rockType: {
              type: 'string',
              description: 'The type of rock or mineral (e.g. "basalt", "agate", "jasper").',
            },
          },
          required: ['rockType'],
        },
      },
    ],
  };
});

// Register call_tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const ai = getAI();

    if (name === 'identify_rock_specimen') {
      const { imagePath, locationHint, userNotes } = args as {
        imagePath: string;
        locationHint?: string;
        userNotes?: string;
      };

      const absolutePath = path.resolve(imagePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${absolutePath}`);
      }

      // Read image and convert to base64
      const imageBuffer = fs.readFileSync(absolutePath);
      const base64Data = imageBuffer.toString('base64');
      const ext = path.extname(absolutePath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';

      const parts: Part[] = [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ];

      let promptText = 'Identify this specimen.';
      if (locationHint) promptText += ` It was found here: ${locationHint}.`;
      if (userNotes) promptText += ` User observations: ${userNotes}.`;
      promptText += '\nReturn a JSON response matching the schema.';

      parts.push({ text: promptText });

      const model = ai.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: RANGER_SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: RANGER_SCHEMA as any,
        },
      });

      const response = await model.generateContent({ contents: [{ role: 'user', parts }] });
      const text = response.response.text();

      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    }

    if (name === 'ask_ranger_al') {
      const { question } = args as { question: string };

      const model = ai.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: RANGER_SYSTEM_PROMPT + '\nAnswer the user\'s question in your whimsical, storytelling voice. Keep it warm and engaging.',
      });

      const response = await model.generateContent(question);
      const text = response.response.text();

      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    }

    if (name === 'get_tumble_advice') {
      const { rockType } = args as { rockType: string };

      const prompt = `Give me rock tumbling and polishing advice for: ${rockType}. Is it a good candidate? What grits/steps should I use? Be witty and practical.`;

      const model = ai.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: RANGER_SYSTEM_PROMPT,
      });

      const response = await model.generateContent(prompt);
      const text = response.response.text();

      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error: ${msg}`,
        },
      ],
    };
  }
});

// Run server over stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Ranger Al MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
