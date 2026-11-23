# Ocal: Rock Buddy

Snap a photo of a beach rock, and **Ranger Al**, a friendly retired geologist, tells you what it might be, how to check, and whether it's a keeper. Then you can ask him about it.

Built for a 74-year-old Oregon beachcomber: big text, big buttons, plain words, and it works without signal.

## How it works
- **Take photo:** saved on your phone instantly, even offline.
- **Ranger Al looks:** a Cloudflare Worker sends the photo to Claude Sonnet 5.5 and returns a "rock card":
  - a short name, plus how sure Al is in words
  - his story, "try this" checks, look-alikes, and keeper or leaverite
- **Ask Ranger Al:** chat about any rock.
- **My Rocks:** your collection, with favorites, notes, and a zoomable photo viewer.

Everything except the AI call stays on the phone (SQLite plus local photos).

## Getting started
```bash
# Worker (Claude): needs worker/.dev.vars with ANTHROPIC_API_KEY and APP_ACCESS_CODE
cd worker && npm install && npm run dev

# App: app/.env needs EXPO_PUBLIC_RANGER_URL and EXPO_PUBLIC_OCAL_KEY (same access code)
cd app && npm install && npx expo start --dev-client
```
- On a phone in dev, `localhost` is rewritten to your PC automatically.
- Deploying the Worker: see [worker/README.md](./worker/README.md).

## Docs
- [AGENTS.md](./AGENTS.md): rules for anyone (human or AI) changing the code.
- [AGENT_HANDOFF.md](./AGENT_HANDOFF.md): current state and file map.
- [docs/DESIGN_HANDOFF.md](./docs/DESIGN_HANDOFF.md): elder-friendly UI review.
- [conductor/tech-stack.md](./conductor/tech-stack.md) · [CHANGELOG.md](./CHANGELOG.md) · [ROADMAP.md](./ROADMAP.md)

## License
**Proprietary / All Rights Reserved.** See [LICENSE](./LICENSE).
