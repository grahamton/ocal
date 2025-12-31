const { onRequest } = require("firebase-functions/v2/https");
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Ajv = require("ajv");
const { RockIdSchema } = require("./rockIdSchema");
const {
  ROCK_ID_SYSTEM_PROMPT,
  buildRockIdUserPrompt,
} = require("./rockIdPrompt");

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(RockIdSchema.schema);

function clampImages(body) {
  const urls = Array.isArray(body.image_urls)
    ? body.image_urls.filter(Boolean)
    : [];
  const dataUrls = Array.isArray(body.image_data_urls)
    ? body.image_data_urls.filter(Boolean)
    : [];
  return [...urls, ...dataUrls].slice(0, 6);
}

async function callOpenAI({ userPrompt, images }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY secret");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const content = [{ type: "input_text", text: userPrompt }];
  for (const img of images) {
    content.push({ type: "input_image", image_url: img });
  }

  const resp = await client.responses
    .create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: ROCK_ID_SYSTEM_PROMPT }],
        },
        { role: "user", content },
      ],
      text: {
        format: {
          type: "json_schema",
          name: RockIdSchema.name,
          strict: RockIdSchema.strict,
          schema: RockIdSchema.schema,
        },
      },
    })
    .catch((err) => {
      console.error("OpenAI call failed", err?.message || err);
      throw err;
    });

  return resp.output_text;
}

function toGeminiParts({ userPrompt, images }) {
  const parts = [
    { text: `SYSTEM:\n${ROCK_ID_SYSTEM_PROMPT}` },
    { text: `SCHEMA:\n${JSON.stringify(RockIdSchema.schema)}` },
    { text: `USER:\n${userPrompt}` },
  ];
  for (const img of images) {
    if (typeof img === "string" && img.startsWith("data:")) {
      const match = img.match(/^data:(.+?);base64,(.*)$/);
      if (match) {
        const mimeType = match[1];
        const data = match[2];
        parts.push({ inlineData: { data, mimeType } });
        continue;
      }
    }
    parts.push({ text: `image_url: ${img}` });
  }
  parts.push({
    text: "Return JSON only matching the provided schema. Keep confidence monotonic.",
  });
  return parts;
}

async function callGemini({ userPrompt, images }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY secret");
  }

  // Direct REST call to v1 Gemini to avoid client version issues.
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const contents = [{ parts: toGeminiParts({ userPrompt, images }) }];

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => resp.statusText);
    console.error("Gemini call failed", resp.status, errText);
    throw new Error(`Gemini HTTP ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => {
        if (p.text) return p.text;
        if (p.inlineData?.data) {
          return Buffer.from(p.inlineData.data, "base64").toString("utf8");
        }
        return "";
      })
      .join("\n") || "";
  return text;
}

exports.identify = onRequest(
  {
    timeoutSeconds: 30,
    memory: "512MiB",
    region: "us-central1",
    secrets: ["OPENAI_API_KEY", "GEMINI_API_KEY"],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body || {};
    const provider = (body.provider || "openai").toLowerCase();
    if (!["openai", "gemini"].includes(provider)) {
      return res.status(400).json({ error: "Unsupported provider", provider });
    }
    const images = clampImages(body);
    if (images.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const userPrompt = buildRockIdUserPrompt({
      location_hint: body.location_hint ?? "",
      context_notes: body.context_notes ?? "",
      user_goal: body.user_goal ?? "quick_id",
    });

    const cleanJson = (text) => {
      if (!text) return null;
      // strip markdown fences
      const stripped = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      try {
        return JSON.parse(stripped);
      } catch (e) {
        const match = stripped.match(/{[\s\S]*}/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch {
            return null;
          }
        }
        return null;
      }
    };

    try {
      const raw =
        provider === "gemini"
          ? await callGemini({ userPrompt, images })
          : await callOpenAI({ userPrompt, images });

      const parsed = cleanJson(raw);
      if (!parsed) {
        return res
          .status(500)
          .json({
            error: "Response was not valid JSON",
            detail: raw?.slice(0, 400) ?? "empty",
          });
      }

      const valid = validate(parsed);
      if (!valid) {
        return res
          .status(500)
          .json({ error: "Schema validation failed", detail: validate.errors });
      }

      return res.json(parsed);
    } catch (err) {
      const msg = err?.message || String(err);
      console.error("Identify handler failed", err); // Make sure it hits Cloud Logs
      return res
        .status(500)
        .json({ error: "Identify failed", detail: msg, stack: err?.stack });
    }
  }
);
