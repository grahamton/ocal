# Ocal Roadmap

Context: Beach Mode, tools-not-toys, anti-monolith. Primary user is a non-technical outdoor enthusiast. Current focus: Phase 2 (Sorting Table). Aligned with App Workflow Analysis (sessions + cataloger dashboard + ledger + poster path).

## Phase 1 - The Bucket (Capture Core)
- Scope: Camera access, geolocation, local-only storage/list; no editing, no cloud, no AI.
- Milestones:
  - Scaffold app (React Native/Expo or PWA), Tailwind-style utilities.
  - Permissions flows for camera + location; graceful degraded location fallback.
  - Giant camera button -> capture photo(s) -> save locally with GPS + timestamp -> Unsorted list view.
  - Offline-first save; mark records `synced=false`; simple list with thumbnails.
- Tests/QA: Lint clean; unit for coordinate formatting; UI test that main buttons render; airplane-mode capture/save; cold-start camera latency.
- Status: Implemented in app; pending manual QA for airplane-mode capture/save and cold-start camera latency.
- Risks: Permission friction; slow GPS; storage limits; device variance for Camera.

## Phase 2 - Sorting Table **current**
- Scope: Detail view, editing notes, manual categories, plus session-aware cataloger prep from workflow analysis.
- Milestones:
  - Open Unsorted item -> detail screen; add/edit label and notes (typing/dictation).
  - Change status draft->cataloged; add simple category/tag.
  - Local-only persistence with optimistic UI.
  - Session groundwork (workflow analysis): session data model + storage, session context, cataloger dashboard list, session detail scaffold, active-session ledger surfaced in capture.
- Tests/QA: Validate edits persist offline; UI test for visibility of edit controls; lint/unit coverage for data mappers; verify session-linked saves and ledger visibility offline.
- Status: Implemented in app (labels, notes, category, status, presets, gallery access; session model + dashboard + ledger scaffold). Manual QA for offline edit persistence and session flows still pending.
- Risks: Input UX in sunlight; large text entry ergonomics; session/ledger UX sprawl if not contained.

## Phase 3 - Rock Buddy (AI)
- Scope: Vision API suggestions using photos + GPS; iterate on session detail batch actions (AI on selections).
- Milestones:
  - Queue image+GPS for cloud call; retry/sync strategy.
  - Response format: Primary Guess, Confidence (Low/Med/High), Visual cues, Fun Fact.
  - UI affordance: Identify action on detail; accept/override suggestion.
- Tests/QA: Mocked AI responses; retry/backoff logic; UI shows suggestion and override path.
- Risks: Latency offline + ensure queue; model accuracy; cost controls.

## Phase 4 - Poster
- Scope: Grid generation and image export; follow “fossil plate” style from workflow analysis with monochrome/colour toggles and optional background clearing.
- Milestones:
  - Select finds by filter (“Last Month”, trip) + checkboxes.
  - Layout engine for 3x3 or 4x4 with captions (editable).
  - Export high-res PDF/JPG; share sheet.
- Tests/QA: Layout determinism; export fidelity on varied devices; large image handling.
- Risks: Memory on-device; rendering speed; print resolution correctness.

## Operating Rules
- Local-first; no auth required. No social, no gamification, no first-launch signup.
- Run `npm run lint` before finishing tasks; keep files <200 lines or propose refactor.
- Do not add new npm packages without explicit permission.
- When coding, reference phase explicitly (e.g., “Context: Phase 1. Implement camera button”).
