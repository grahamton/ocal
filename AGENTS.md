# Ocal: Agent Guidance

Rock identification app for a **74-year-old beachcomber** (the owner's dad) and a few friends. Photograph a rock; **Ranger Al**, a friendly retired geologist, says what it might be and chats about it.

## 🛠 Operational Commands
- **App** (`app/`):
  - `npm install`, then `npx expo start --dev-client` for development.
  - `npm run lint`, `npx tsc --noEmit`.
  - Native rebuild: `npx expo prebuild --platform android`, then in `android/` run `./gradlew assembleDebug`.
- **Worker** (`worker/`):
  - `npm install`, `npm run dev` (local on :8787; needs `.dev.vars`), `npm run typecheck`, `npm run deploy`.
- Live Worker: `https://ocal-ranger.rainbowfetch-cms-auth.workers.dev`

## 🏗 Tech Stack & Architecture
- **App:** React Native (Expo SDK 52) with Expo Router. Android first.
- **Data:** On-device SQLite (`app/src/shared/localDb.ts`). Photos stay on the device.
- **AI:** Claude Sonnet 5.5 through the Cloudflare Worker in `worker/`.
  - The Worker owns the prompt (`worker/src/prompt.ts`) and the card schema (`worker/src/card.ts`).
  - The app never sends prompts.
- **No Firebase, no Gemini.** See [conductor/tech-stack.md](./conductor/tech-stack.md).

## 📜 Core Mandates
1. **Elder-friendly first:**
   - Text ≥ 18px (never below 16px), touch targets ≥ 56dp, high contrast.
   - Plain words, no hidden gestures.
   - Must work at 1.5× to 2× system font size.
2. **The Silent Partner:** minimal friction. Auto-save everything; no inbox or sorting chores.
3. **Offline-First:** capture and browsing work with no signal; identification catches up later.
4. **No Tailwind:** use React Native `StyleSheet` exclusively.
5. **Path Aliases:** always use `@/*` for imports within `app/src`.
6. **File Limits:** keep files < 200 lines. Propose a refactor if exceeded; split styles into `*.styles.ts`.
7. **Secrets:** the Anthropic key lives only in Worker secrets and `worker/.dev.vars` (gitignored).

## 🔗 Docs
- [Agent Handoff](./AGENT_HANDOFF.md): current state, file map, how to test on a phone.
- [Design Handoff](./docs/DESIGN_HANDOFF.md): elder-friendly UI review brief.
- [Agent Guidance](./docs/agent_guidance.md): persona and Ranger Al's voice.
- [Tech Stack](./conductor/tech-stack.md), [Roadmap](./ROADMAP.md), [Changelog](./CHANGELOG.md).
