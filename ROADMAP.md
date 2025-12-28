# Ocal Roadmap

Context: Beach Mode, tools-not-toys, anti-monolith. Primary user is a non-technical outdoor enthusiast. Current focus: Phase 2 (Sorting Table).

## Phase 1 - The Bucket (Capture Core)
- Scope: Camera access, geolocation, local-only storage/list; no editing, no cloud, no AI.
- Milestones:
  - Scaffold app (React Native/Expo or PWA), Tailwind-style utilities.
  - Permissions flows for camera + location; graceful degraded location fallback.
  - Giant camera button â†’ capture photo(s) â†’ save locally with GPS + timestamp â†’ Unsorted list view.
  - Offline-first save; mark records `synced=false`; simple list with thumbnails.
- Tests/QA: Lint clean; unit for coordinate formatting; UI test that main buttons render; airplane-mode capture/save; cold-start camera latency.
- Status: Implemented in app; pending manual QA for airplane-mode capture/save and cold-start camera latency.
- Risks: Permission friction; slow GPS; storage limits; device variance for Camera.

## Phase 2 - Sorting Table **current**
- Scope: Detail view, editing notes, manual categories.
- Milestones:
  - Open Unsorted item â†’ detail screen; add/edit label and notes (typing/dictation).
  - Change status draftâ†’cataloged; add simple category/tag.
  - Local-only persistence with optimistic UI.
- Tests/QA: Validate edits persist offline; UI test for visibility of edit controls; lint/unit coverage for data mappers.
- Status: Implemented in app (labels, notes, category, status, presets, gallery access); manual QA for offline edit persistence still pending.
- Risks: Input UX in sunlight; large text entry ergonomics.

## Phase 3 - Rock Buddy (AI)
- Scope: Vision API suggestions using photos + GPS.
- Milestones:
  - Queue image+GPS for cloud call; retry/sync strategy.
  - Response format: Primary Guess, Confidence (Low/Med/High), Visual cues, Fun Fact.
  - UI affordance: â€œIdentifyâ€ action on detail; accept/override suggestion.
- Tests/QA: Mocked AI responses; retry/backoff logic; UI shows suggestion and override path.
- Risks: Latency offline â†’ ensure queue; model accuracy; cost controls.

## Phase 4 - Poster
- Scope: Grid generation and image export.
- Milestones:
  - Select finds by filter (â€œLast Monthâ€, trip) + checkboxes.
  - Layout engine for 3x3 or 4x4 with captions (editable).
  - Export high-res PDF/JPG; share sheet.
- Tests/QA: Layout determinism; export fidelity on varied devices; large image handling.
- Risks: Memory on-device; rendering speed; print resolution correctness.

## Operating Rules
- Local-first; no auth required. No social, no gamification, no first-launch signup.
- Run `npm run lint` before finishing tasks; keep files <200 lines or propose refactor.
- Do not add new npm packages without explicit permission.
- When coding, reference phase explicitly (e.g., â€œContext: Phase 1. Implement camera buttonâ€¦â€).




