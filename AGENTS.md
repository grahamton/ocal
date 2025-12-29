# AGENTS — Ocal (Oregon Coast Agate Log)

Guidance for AI agents and humans working on Ocal. Primary user is a non-technical outdoor enthusiast in “Beach Mode.” Philosophy: tools, not toys. Keep the app modular (anti-monolith).

## UX Guidelines (Beach Mode)

- Touch targets: minimum 48px; prefer 64px for primary actions (Camera, Save).
- High contrast: black on white; avoid subtle greys for text.
- Offline first: Capture and Save must work without network; sync silently later.
- Error messages: friendly, non-technical (e.g., “Couldn't save rock” vs “Error 500”).
- One-hand bias: keep core actions in the thumb zone; keep flows under 5 seconds on the beach.

## Tech Stack & Architecture

- Framework: React (Web PWA) or React Native (Expo).
- Styling: Tailwind CSS (utility classes over custom CSS files).
- State/data: local-first; IndexedDB or AsyncStorage is the source of truth; no auth required to use the app.
- Directory structure: `src/features/` (capture, gallery, analysis), `src/shared/` (UI components, utilities).
- Modularity: prefer small, composable pieces; avoid monolithic modules.

## Implementation Phases

- Current: **Phase 1 — The Bucket (Capture Core)**: camera access, geolocation, local storage list. No editing, no cloud, no AI.
- Phase 2 — The Sorting Table: detail view, editing notes, manual categories.
- Phase 3 — The Rock Buddy (AI): vision API integration for ID suggestions.
- Phase 4 — The Poster: grid generation and image export.
- When coding, reference the phase explicitly (e.g., “Context: Phase 1. Create the main camera button…”).

## Code Style & Quality

- Linting: run `npm run lint` before finishing any task; no unused variables.
- Testing: write simple unit tests for utilities (e.g., coordinate formatting). UI tests should assert main buttons are visible.
- Refactoring: stay modular but avoid over-slicing. Split when sections are reused, hard to scan, have distinct logic/tests, or files creep past ~250–300 lines. Keep simple, single-use UI blocks inline when that makes the flow clearer.
- Dependencies: do not add new npm packages without explicit user permission.
- Comments: keep them minimal; prioritize clear naming.

## No-Go Zones (Scope Creep)

- No social features (likes, feeds, profiles).
- No gamification (streaks, XP).
- No complex auth; never block first-launch with sign-up.

## Offline & Sync Expectations

- Field use must be fully functional offline (capture, store, view local list).
- Sync is a background concern; never block capture on connectivity.

## Prompts & Handoffs

- Be explicit about phase and scope in prompts and PR descriptions.
- Call out blockers early (e.g., camera permission, storage limits).
- Default to Beach Mode priorities: speed, clarity, offline reliability.\*\*\*
