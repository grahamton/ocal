# Ranger Al Worker

Cloudflare Worker that gives the Ocal app its AI: Claude Sonnet 5.5 looks at a
beach find and returns a "rock card", then chats about it.

| Route | Body | Returns |
|---|---|---|
| `GET /health` | – | `{ok, model}` |
| `POST /identify` | `{image: {media_type, data}, location?, note?, taken_at?}` | `{card, model, at}` |
| `POST /chat` | `{image, card, location?, note?, messages: [{role, content}]}` | `{reply}` |

Every POST needs header `X-Ocal-Key: <APP_ACCESS_CODE>`. The app never sends
prompts: Ranger Al's persona, instructions and the geology KB
(`docs/kb/pacific_coast_geology_kb.json`) live here in `src/prompt.ts`, and the
KB is prompt-cached for an hour.

## Run locally

```bash
npm install
cp .dev.vars.example .dev.vars   # add your Anthropic key + an access code
npm run dev                      # http://localhost:8787
```

The app's `app/.env` must use the same access code (`EXPO_PUBLIC_OCAL_KEY`).
On a phone running through Metro, `localhost` is rewritten to your PC.
Windows Firewall may need to allow port 8787.

## Deploy

```bash
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put APP_ACCESS_CODE
npm run deploy
```

Then set `EXPO_PUBLIC_RANGER_URL` in `app/.env` to the `https://…workers.dev`
URL wrangler prints, and rebuild the APK.

## Guard rails

- Access code + Workers rate limit (20 requests/min per IP).
- Set a monthly spend limit in the Anthropic console too.
- Photos are resized on the phone to ~1280px before upload.
