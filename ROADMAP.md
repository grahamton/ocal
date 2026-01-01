# Ocal Roadmap

Context: Beach Mode, tools-not-toys, silent partner. Primary user is a non-technical outdoor enthusiast. Current focus: Transitioning to Phase 3 (Rock Buddy AI) while polishing Phase 2 (Deck UI).

## Phase 1 - The Bucket (Capture Core)

- Scope: Camera access, geolocation, local-only storage/list; no editing, no cloud, no AI.
- Milestones:
  - Scaffold app (React Native/Expo or PWA), Tailwind-style utilities.
  - Permissions flows for camera + location; graceful degraded location fallback.
  - Giant camera button -> capture photo(s) -> save locally with GPS + timestamp -> Unsorted list view.
  - Offline-first save; mark records `synced=false`; simple list with thumbnails.
- Tests/QA: Lint clean; unit for coordinate formatting; UI test that main buttons render; airplane-mode capture/save; cold-start camera latency.
- Status: **Complete**. Core capture loop is stable.
- Risks: Permission friction; slow GPS; storage limits; device variance for Camera.

## Phase 2 - Sorting Table (Deck & Ledger) **Complete**

- Scope: Review workflow ("Deck of Cards"), "Field Journal" Detail View ("Card"), Session Context.
- Milestones:
  - [x] Refactor Inbox to "Deck of Cards" (Single item view, huge Keep/Trash buttons).
  - [x] "Field Journal" Detail View (CardFront/CardBack) with distinct "Flip" interaction and Themes.
  - [x] Session data model + Dashboard + Ledger.
  - [x] "Silent Partner" UX (Persistent Keep, consistent navigation, decluttered UI).
  - [x] Manual QA for offline edit persistence.
- Tests/QA: Validate edits persist offline; UI test for visibility of edit controls; lint/unit coverage for data mappers; verify session-linked saves and ledger visibility offline.
- Status: **Complete**. Refactored from Glassmorphism to "Field Journal" aesthetic (Cream/Ink). Session logic is stable.
- Risks: "Card Flip" interaction conflicts with scrolling (mitigated by CardBack specific non-flip zones).

## Phase 3 - Rock Buddy (AI) & Engagement **Complete**

- Scope: Vision API suggestions, "Scientist View" analysis, and Social Sharing.
- Milestones:
  - [x] Scaffolding: `identifyRock` client function & `RockIdResult` schema.
  - [x] UI: "Scientist View" (Field Lab) with Confidence Meter & Visual Cues.
  - [x] Queue system: robust `IdentifyQueueService` for background processing.
  - [x] Backend: Firebase Cloud Functions (local simulator verified).
  - [x] Workflow: "Deck of Cards" Inbox with auto-queueing on "Keep".
  - [x] Social: Native Share functionality.
- Tests/QA: Polling logic for queue; Schema validation relaxed for robustness; Pull-to-Refresh added.
- Risks: Latency offline (mitigated by queue); model accuracy (mitigated by "Scientist View" transparency).

## Phase 4 - Poster

- Scope: Grid generation and image export; follow “fossil plate” style from workflow analysis with monochrome/colour toggles and optional background clearing.
- Milestones:
  - Select finds by filter (“Last Month”, trip) + checkboxes.
  - Layout engine for 3x3 or 4x4 with captions (editable).
  - Export high-res PDF/JPG; share sheet.
- Tests/QA: Layout determinism; export fidelity on varied devices; large image handling.
- Risks: Memory on-device; rendering speed; print resolution correctness.
- Status: **Research complete** - Prototypes in `feature/after-the-gallery` branch

## Phase 5 - Session Enhancements (Backlog)

- Scope: Improve session visibility, AI context integration, and workflow
- Milestones:
  - AI context enrichment (pass session location/time to Ranger Al)
  - Enhanced session UI (filters, metadata display)
  - Session-first workflow (optional future)
- Status: **Research complete** - See `docs/session_improvements_research.md`
- Risks: Requires testing AI accuracy improvements; full workflow overhaul depends on cloud sync

## Future Considerations

- **Cloud Sync**: Cross-device access and real-time sync (see `docs/desktop_access_research.md`)
- **Desktop/Web Access**: Chromebook/Windows support via PWA or Android build
- **Data Export**: CSV/JSON export for external analysis (prototyped in Phase 4 branch)

## Operating Rules

- Local-first; no auth required. No social, no gamification, no first-launch signup.
- Run `npm run lint` before finishing tasks; keep files <200 lines or propose refactor.
- Do not add new npm packages without explicit permission.
- When coding, reference phase explicitly (e.g., “Context: Phase 1. Implement camera button”).
