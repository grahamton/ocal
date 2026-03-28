"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyRock = exports.identify = exports.identifyRockHandler = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const generative_ai_1 = require("@google/generative-ai");
const schemas_1 = require("./schemas");
const prompt_1 = require("./prompt");
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const identifyRockHandler = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    let body;
    try {
        body = schemas_1.IdentifyRequestSchema.parse(req.body);
    }
    catch (err) {
        const zErr = err;
        logger.error('Invalid request body', zErr.format());
        res.status(400).json({ error: 'Invalid request', details: zErr.format() });
        return;
    }
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        logger.error('Missing GEMINI_API_KEY');
        res.status(500).json({ error: 'Server misconfigured: missing GEMINI_API_KEY' });
        return;
    }
    const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash';
    const temperature = body.temperature ?? 0.7;
    const systemPrompt = body.system_prompt ?? prompt_1.ROCK_ID_SYSTEM_PROMPT;
    const parts = [];
    const dataUrls = body.image_data_urls ?? [];
    for (const dataUrl of dataUrls) {
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
            parts.push({
                inlineData: {
                    mimeType: match[1],
                    data: match[2],
                },
            });
        }
    }
    if (body.image_urls && body.image_urls.length > 0) {
        for (const url of body.image_urls) {
            parts.push({ text: `Image URL to analyze: ${url}` });
        }
    }
    const textPrompt = (0, prompt_1.buildRockIdUserPrompt)({
        location_hint: body.location_hint,
        context_notes: body.context_notes,
        user_goal: body.user_goal,
        session_context: body.session_context,
    });
    parts.push({ text: textPrompt });
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
        const generationConfig = {
            temperature,
            responseMimeType: 'application/json',
        };
        if (body.output_schema) {
            generationConfig.responseSchema = body.output_schema.schema ?? body.output_schema;
        }
        const model = genAI.getGenerativeModel({
            model: MODEL,
            systemInstruction: systemPrompt,
            generationConfig,
        });
        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
        const responseText = result.response.text();
        let parsed = null;
        try {
            parsed = JSON.parse(responseText);
        }
        catch {
            const start = responseText.indexOf('{');
            const end = responseText.lastIndexOf('}');
            if (start !== -1 && end > start) {
                try {
                    parsed = JSON.parse(responseText.slice(start, end + 1));
                }
                catch {
                    parsed = null;
                }
            }
        }
        if (!parsed) {
            logger.warn('Could not parse Gemini response', { responseText });
            throw new Error('Failed to parse AI response as JSON');
        }
        res.status(200).json({
            result: parsed,
            meta: {
                model: MODEL,
                version: '3.1.0',
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('identify error', { message, stack: err.stack });
        res.status(500).json({ error: 'AI Identification failed', detail: message });
    }
};
exports.identifyRockHandler = identifyRockHandler;
exports.identify = (0, https_1.onRequest)({
    secrets: ['GEMINI_API_KEY'],
    timeoutSeconds: 60,
    memory: '512MiB',
    region: 'us-central1'
}, exports.identifyRockHandler);
exports.identifyRock = exports.identify;
//# sourceMappingURL=index.js.map