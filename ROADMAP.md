# Ocal Roadmap

Context: Beach Mode, tools-not-toys, silent partner. Primary user is a non-technical outdoor enthusiast. Current focus: Database foundation (Phase 4 - SQLite Migration) to support advanced features while testers validate Phase 3 release.

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

## Phase 3.5 - Explore Mode & AI Discovery **Complete**

- Scope: Enable "Explore" vs "Ship" modes for AI to discover new useful data fields without breaking the app.
- Milestones:
  - [x] Refactor `RangerConfig` for dynamic schemas (Explore = loose, Ship = strict).
  - [x] Add "Raw Data Inspector" to Find Detail view for developer visibility.
  - [x] **Gemini 2.0 Integration**: Upgraded to `gemini-2.0-flash` for deeper reasoning.
  - [x] **"Locked In" Schema**: Implemented strict JSON schema with category-specific details (Mineral/Rock/Fossil/Artifact).
  - [x] **Traceability**: Added `AnalysisEvent` wrapper with `schemaVersion`, `runId`, and `aiModel`.
- Status: **Complete** (Jan 2026).
- Rationale: Allows safe experimentation with prompt engineering.

## Phase 4 - SQLite Migration & Export **Complete**

- Scope: Migrate from AsyncStorage to SQLite for performance, querying, and data export
- Rationale: **Foundation for all future features** - Poster and Session Enhancements require efficient filtering and geospatial queries. Migration is easier now while tester datasets are small. See `docs/roadmap_reprioritization_research.md` and `docs/database_enhancements_research.md` for analysis.
- Milestones:
  - [x] Install `react-native-sqlite-storage` and configure
  - [x] Design schema with indexes (finds, sessions, metadata)
  - [x] Build migration service (AsyncStorage → SQLite with validation)
  - [x] Implement schema versioning for future migrations
  - [x] Add data export utilities (CSV, JSON, SQLite file)
  - [x] Create "Data Manager" UI for backup/restore
  - [x] Test migration with real tester data
- Tests/QA: Migration integrity tests; performance benchmarks; export/import validation; backward compatibility
- Timeline: **2-3 weeks**
- Risks: Data loss during migration (mitigated by backup); schema design mistakes (mitigated by versioning)
- Status: **Complete** (Jan 2026)

## Phase 5 - Poster (In Progress)

- Scope: Grid generation and image export; follow "fossil plate" style from workflow analysis with monochrome/colour toggles and optional background clearing.
- Milestones:
  - [ ] Select finds by filter ("Last Month", trip) + checkboxes _(efficient with SQLite)_
  - [ ] Layout engine for 3x3 or 4x4 with captions (editable)
  - [ ] Export high-res PDF/JPG; share sheet
- Tests/QA: Layout determinism; export fidelity on varied devices; large image handling
- Risks: Memory on-device; rendering speed; print resolution correctness
- Status: **Research complete** - Prototypes in `feature/after-the-gallery` branch
- Dependencies: **Benefits from Phase 4 (SQLite)** for efficient filtering

## Phase 6 - Session Enhancements (Backlog)

- Scope: Improve session visibility, AI context integration, and workflow
- Milestones:
  - AI context enrichment (pass session location/time to Ranger Al)
  - Enhanced session UI (filters, metadata display) _(efficient with SQLite)_
  - Geospatial queries (finds within radius) _(enabled by SQLite)_
  - Session-first workflow (optional future)
- Status: **Research complete** - See `docs/session_improvements_research.md`
- Risks: Requires testing AI accuracy improvements; full workflow overhaul depends on cloud sync
- Dependencies: **Benefits from Phase 4 (SQLite)** for geospatial queries

## Phase 7 - iOS Version (Backlog)

- Scope: Build and distribute iOS version for iPhone/iPad testing
- Milestones:
  - Validate iOS compatibility with Expo Go
  - Enroll in Apple Developer Program
  - Build IPA with EAS Build
  - Distribute via TestFlight
- Status: **Research complete** - See `docs/ios_version_research.md`
- Risks: $99/year Apple Developer cost; potential iOS-specific bugs
- Priority: **Low** - Not a priority for current Android user base

## Phase 8 - UI Tooltips & Feedback (Backlog)

- Scope: Onboarding hints and in-app feedback mechanism
- Rationale: **Deferred for user feedback** - Better to identify real user confusion patterns from Phases 4-6 before adding tooltips. Respects "Silent Partner" philosophy by avoiding premature UI chrome.
- Milestones:
  - In-app feedback form (using `expo-mail-composer`)
  - First-launch tooltips for key features (based on observed user pain points)
  - Optional help modal
- Status: **Research complete** - See `docs/ui_tooltips_feedback_research.md`
- Risks: Tooltip design must respect "Silent Partner" philosophy; feedback requires email setup
- Priority: **Polish** - Add after core features are validated by users

## Phase 9 - Cloud Sync & Advanced Data Tools (Future)

- Scope: Optional cloud sync and advanced data manipulation
- Milestones:
  - Phase 9.1: Optional Firebase sync for cross-device access
  - Phase 9.2: Custom table builder and data manipulation tools
  - Phase 9.3: Self-hosting option for privacy-focused users
- Status: **Research complete** - See `docs/database_enhancements_research.md`
- Risks: Sync conflicts; cloud costs; complexity of dual storage paths; user privacy expectations
- Dependencies: **Requires Phase 4 (SQLite)** as foundation

## Phase 10 - Find Pattern Memory (Backlog)

- Scope: Learn patterns from past finds (beach, weather, tides) to suggest "what to watch for today".
- Milestones:
  - [ ] Schema update: Add weather/tide tags to `sessions`.
  - [ ] Patterns: Build local correlation engine for finds vs. conditions.
  - [ ] Insights: Add "Watch For" cards to session dashboard.
- Status: **Research Spike** - See `docs/find-pattern-memory_research.md`
- Risks: Pattern accuracy depends on data quality (manual tags may be inconsistent).
- Dependencies: **Benefits from Phase 4 (SQLite)** for querying find history.

## Future Considerations

- **Cloud Sync**: Cross-device access and real-time sync (see `docs/desktop_access_research.md`)
- **Desktop/Web Access**: Chromebook/Windows support via PWA or Android build
- **Data Export**: CSV/JSON export for external analysis (will be included in Phase 4)

## Operating Rules

- Local-first; no auth required. No social, no gamification, no first-launch signup.
- Run `npm run lint` before finishing tasks; keep files <200 lines or propose refactor.
- Do not add new npm packages without explicit permission.
- When coding, reference phase explicitly (e.g., "Context: Phase 1. Implement camera button").
