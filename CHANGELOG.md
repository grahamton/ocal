# Changelog

All notable changes to the **Ocal** project will be documented in this file.

## [3.0.0-dev] - 2026-11-23 ("The Reboot")

### Added
- **Ranger Al on Claude:** Cloudflare Worker (`worker/`) calling Claude Sonnet 5.5.
  - `/identify` returns a playful structured rock card; `/chat` handles follow-ups.
  - The prompt and geology KB live only in the Worker, prompt-cached.
  - Access code, rate limiting, and the API key kept as a secret.
- **Ask Ranger Al chat** on every rock, saved with the find.
- **Self-healing identify queue:** waits for signal and retries on foreground, when the network returns, and on a timer.
- **Zoomable photo viewer:** pinch, drag, double-tap, plus big zoom buttons.
- **Full-size 3:4 camera viewfinder** with the shutter below it.
- **Before/after UI screenshots** (`docs/screenshots/`) and an elder-friendly design brief (`docs/DESIGN_HANDOFF.md`).

### Changed
- **Data:** back to on-device SQLite (`localDb.ts`, `ocal_v2.db`) and local photos.
- **Senior UX pass:**
  - visible status bar, taller tabs ("Take Photo" / "My Rocks")
  - auto-saving notes and favorites, labeled Share/Delete
  - high-contrast walk pill

### Removed
- Firebase (Auth, Firestore, Storage, Functions), Gemini, LiteLLM proxy, PostHog analytics, Zustand.
- Insights, posters/batch select, data health check, the old detail cards, and four drifting copies of the prompt.
- Old `server/`, `mcp/`, `src/` (untracked); stale docs moved to `docs/archive/`.

## [2.0.0] - 2026-03-23

### Added
- **Expo Router Migration**: Implemented file-based routing in the `app/` directory.
- **Universal App Architecture**: Native support for tabs and modals using Expo Router.
- **Zustand State Management**: Introduced `useSelectionStore` for high-performance transient UI state.
- **Gemini 3.1 Upgrade**: Cloud Functions and Client now utilize the `gemini-3.1-flash` model.
- **AI Traceability**: Added a metadata envelope to AI responses, tracking model versions and schema versions.
- **MainHeader Component**: Shared header component for consistent branding and session management across tabs.
- **Play Store Readiness**: Added `versionCode`, production build profiles, and integrated production `google-services.json`.

### Changed
- **Non-Blocking Writes**: Refactored `firestoreService.ts` to use "fire-and-forget" writes, improving offline-first responsiveness.
- **Simplified AI Schemas**: Unified all AI data structures to the strict `AnalysisEvent` type, removing legacy `RockIdResult` unions.
- **Modernized FileSystem**: Migrated from `expo-file-system/legacy` to standard `expo-file-system`.
- **Project Entry**: Updated `package.json` to use `expo-router/entry`.

### Removed
- **Legacy SQLite Layer**: Deleted `db.ts` and `expo-sqlite` dependency.
- **Migration Logic**: Removed SQLite-to-Firestore migration code and UI components as the transition is complete.
- **React Context for Selection**: Replaced `SelectionContext` with Zustand store.
- **Hardcoded AI Metadata**: Client no longer hardcodes model versions; it consumes them dynamically from the API.
