# Ocal: Senior Agent Guidance

Offline-first rock identification app for senior beachcombers.

## 🛠 Operational Commands
- **Install:** `npm install` (run in `app/` and `functions/`)
- **Start Web:** `npm run web` (in `app/`)
- **Lint:** `npm run lint` (in `app/`)
- **Format:** `npm run format` (in `app/`)
- **Unit Tests:** `npm run test` (in `app/`)

## 🏗 Tech Stack & Architecture
- **Frontend:** React Native (Expo) with Expo Router.
- **Backend:** Firebase (Auth, Firestore, Cloud Storage, Functions).
- **AI:** Google Gemini (via Cloud Functions).
- **State:** Zustand for UI state, React Context for session/auth.
- **Source of Truth:** Firestore (`users/{uid}/finds/{id}`).

## 📜 Core Mandates
1. **The Silent Partner:** Minimal UI friction. No "inbox" or tedious sorting.
2. **Senior-Friendly UI:** High contrast, large text (min 16px), large touch targets.
3. **Offline-First:** All capture and local viewing must work without data.
4. **No Tailwind:** Use React Native `StyleSheet` exclusively.
5. **Path Aliases:** Always use `@/*` for imports within `app/src`.
6. **File Limits:** Keep files < 200 lines. Propose refactor if exceeded.

## 🔗 Detailed Documentation
For deeper context on personas, AI logic, and visual language, see:
- [Core Agent Guidance](./docs/agent_guidance.md)
- [Product Definition](./conductor/product.md)
- [Tech Stack Deep Dive](./conductor/tech-stack.md)
- [Roadmap](./ROADMAP.md)
