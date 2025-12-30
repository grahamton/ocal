# Identify Function (Firebase HTTPS)

Single HTTPS function supporting OpenAI (default) and Gemini providers for the RockID Assistant.

## Setup
1) From `functions/`: install deps
```bash
npm install
```
2) Set secrets
```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
```
3) Deploy
```bash
firebase deploy --only functions:identify
```

## Request shape
`POST https://<region>-<project>.cloudfunctions.net/identify`
```json
{
  "provider": "gemini", // or "openai"
  "image_urls": ["https://..."], // up to 6
  "image_data_urls": ["data:image/jpeg;base64,..."], // optional, up to 6 combined
  "location_hint": "Waldport OR, beach south of town",
  "context_notes": "found in gravel, translucent, bands visible",
  "user_goal": "quick_id" // or learning, catalog_tagging
}
```

### Sample curl
```bash
curl -X POST https://identify-yq7xepmata-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{"provider":"gemini","image_urls":["https://upload.wikimedia.org/wikipedia/commons/1/17/Ametrine_Amehguy.jpg"],"location_hint":"test","context_notes":"test"}'
```

## Response
Strict JSON matching `rock_id_result` schema (see `rockIdSchema.js`). The function validates the model output against this schema and returns 400 on missing images, 405 on non-POST, and 500 on generation/validation errors.
