# Ocal — Oregon Coast Agate Log

Quick, forgiving field logger for rockhounds. Capture finds in seconds on the beach; sort, identify, and share later when back online.

## Beach Mode UX (field use)
- Big, high-contrast buttons for bright sunlight; minimal text.
- Offline first: camera, GPS capture, and save never wait for network; sync queues for later.
- One-handed reach: primary actions (Snap Photo, Save) anchored to the thumb zone.
- Safe defaults: auto-grab GPS + timestamp; no required typing on the beach.

## Core Flows
**Quick Capture (on the beach, target ≤5s)**  
- Open → immediate giant camera button.  
- Snap one or multiple photos.  
- Auto-log GPS and timestamp in the background.  
- Save drops the item into an **Unsorted** inbox; no typing required.

**Sorting Table (home/coffee shop)**  
- Review **Unsorted** list with thumbnails.  
- Tap **Identify** to run Rock Buddy AI on photos + location.  
- AI output: `Primary Guess`, `Confidence (Low/Med/High)`, `Visual cues`, `Fun Fact`.  
- User can accept suggestion or enter a custom label (e.g., "The big red one").  
- Add notes by typing or dictation (e.g., "Found near the big log at Yachats.").  
- Change status from `draft` to `cataloged` when done.

**Trophy Room (gallery)**  
- Map view: clustered pins along the Oregon coast.  
- Calendar view: filter by month (e.g., "Finds from October 2025").  
- Grid view: masonry layout of photos.

## Android Implementation Notes
- Stack: Kotlin + Jetpack Compose; CameraX for capture; Coil for image loading; Hilt for DI.
- Permissions flow: coarse/fine location with rationale; graceful degradation to last-known if GPS is slow.
- Local storage: Room for metadata; file storage/app-specific media dir for photos; mark `synced=false` until uploads succeed.
- Background work: WorkManager for retries/sync; foreground service only when camera/location needed while app is backgrounded.
- Offline maps/tides: cache map tiles (Google Maps SDK download areas or MapLibre with packaged tiles); cache tide tables per area/date.
- Poster generator: Compose canvas/Android PDFDocument for on-device 3x3 or 4x4 grid export to JPG/PDF; share sheet integration.
- Voice: hook dictation via `RecognizerIntent` for notes when sorting.
- Testing focus: airplane-mode flow (capture/save), cold-start camera latency, GPS fallback timing, WorkManager retry/backoff.

## Rock Buddy (ID Agent) Spec
- Persona: friendly, concise field geologist for the PNW.
- Inputs: 1–n images, GPS lat/long (critical for context).
- Output structure:
  - Primary Guess: [Name]
  - Confidence: [Low/Med/High]
  - Visual cues: "Identified by the waxy luster and banding."
  - Fun Fact: single short sentence.
- Behavior: guide-level brevity, not encyclopedic; respects local geology.

## Poster Generator (shareable payoff)
- Flow: Select **Create Poster** → choose filter ("Last Month" or trip) → pick rocks (checkboxes).
- Layout engine: auto-arrange 3x3 or 4x4 grid with consistent margins.
- Labels: auto-caption (e.g., "Agate — Nov 12"); allow user edits.
- Export: high-res PDF/JPG for email or printing.

## Simplified Data Model
```json
{
  "findId": "uuid",
  "photos": ["local_path_1.jpg", "cloud_url_1.jpg"],
  "location": { "lat": 44.31, "long": -124.10, "name": "Waldport, OR" },
  "timestamp": "2025-10-27T10:00:00Z",
  "manualDetails": { "userLabel": "Nice Agate", "notes": "Found right at the tide line." },
  "aiAnalysis": { "suggestedType": "Agate", "confidence": "High", "reasoning": "Conchoidal fracture visible." },
  "status": "draft",
  "synced": false,
  "favorite": false
}
```
- Extend with trip grouping and poster selections as needed.

## Offline & Sync Approach
- Store captures locally (Room + media dir). Queue uploads; retry on connectivity. Keep user-visible "Saved offline" state.
- Cache maps/tiles and tide tables when online; degrade gracefully offline.
- Background sync job sends photos/metadata and updates reverse-geocoded names.

## UI Principles
- Large tap targets (44–60 px), high contrast, minimal fields during capture.
- Thumb-zone placement for primary CTAs; secondary actions at top.
- Progress cues: "Saved offline" badge; sync state indicator when back on WiFi.

## Code Style & Quality (repo hygiene)
- Linting: run `npm run lint` before finishing any task; no unused variables.
- Testing: add simple unit tests for utilities; UI tests should assert main buttons are visible.
- Refactoring: stay modular but avoid over-slicing. Split when sections are reused, hard to scan, have distinct logic/tests, or files creep past ~250–300 lines. Keep simple, single-use UI blocks inline when that makes the flow clearer.
- Dependencies: do not add new npm packages without explicit permission.
- Comments: keep them minimal; prioritize clear naming.

## Future Nice-to-Haves
- Tide widget showing upcoming low tides for current GPS.
- Favorites to spotlight the best find of the day/trip.
- Trip grouping (e.g., "Yachats weekend") for faster poster creation.

## Open Questions / Next Steps
- Finalize map provider/offline strategy (Google offline areas vs MapLibre + packaged tiles).
- Decide AI pipeline: on-device precheck vs cloud; queue images + GPS for later processing.
- Pick poster rendering path: Compose canvas-only vs PDFDocument or server render.
- Define MVP test matrix for offline capture, WorkManager retries, and GPS fallback timing.

## QA
- Manual QA steps: see `QA_CHECKLIST.md` (offline capture, cold start camera, offline edits, AI smoke).

## AI Identify Endpoint
- Cloud Function URL: `https://identify-yq7xepmata-uc.a.run.app`
- Default provider: Gemini (`gemini-2.5-flash`), can override with `provider: 'openai'`.
- Client env: set `EXPO_PUBLIC_IDENTIFY_URL` (see `app/.env.example`).
- Sample curl:
```bash
curl -X POST https://identify-yq7xepmata-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{"provider":"gemini","image_urls":["https://upload.wikimedia.org/wikipedia/commons/1/17/Ametrine_Amehguy.jpg"],"location_hint":"test","context_notes":"test"}'
```
- Deletion: delete removes the photo everywhere (Unsorted + Gallery). Use “Hide from Unsorted” to mark Cataloged without deleting.

## Secrets
- Stored in Firebase Secret Manager: `GEMINI_API_KEY`, `OPENAI_API_KEY`.
- Rotate via `firebase functions:secrets:set GEMINI_API_KEY` then `firebase deploy --only functions:identify`.
