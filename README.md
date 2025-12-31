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

- **Inbox Deck**: Swipe through finds. "Keep" auto-queues them for background AI processing.
- **Scientist View**: "Field Lab" analysis shows AI confidence, visual evidence (e.g., "conchoidal fracture"), and alternative IDs.
- **Social**: Share finds directly to friends/family via native share sheet.
- **Edit**: Tap to rename or add notes. Changes persist offline.

**Trophy Room (gallery)**

- **Specimen Tiles**: Clean, "Jewelry Store" layout with shadows and minimal metadata.
- **Pull-to-Refresh**: Manual sync control.
- **Map view**: (Planned) clustered pins along the Oregon coast.

## Implementation Notes (React Native / Expo)

- **Stack**: React Native + Expo (Managed Workflow); TypeScript.
- **Storage**: `expo-sqlite` for metadata; `expo-file-system` for local photo storage.
- **Camera**: `expo-camera`.
- **Location**: `expo-location`.
- **Architecture**: distinct feature modules (`src/features/`) with a shared database layer.
- **Navigation**: Custom state-based navigation (currently monolithic in `App.tsx` for simplicity).

### Offline Strategy

- Captures are saved immediately to local SQLite and the app's document directory.
- Sync logic (planned) will queue uploads when network is available.

## Development

### Setup

```bash
cd app
npm install
```

### Running

```bash
npm start
# Press 'a' for Android, 'i' for iOS (simulator)
```

## Rock Buddy (ID Agent) Spec

- Persona: friendly, concise field geologist for the PNW.
- Inputs: 1–n images, GPS lat/long (critical for context).
- Output structure:
  - Primary Guess: [Name]
  - Confidence: [Low/Med/High]
  - Visual cues: "Identified by the waxy luster and banding."
  - Fun Fact: single short sentence.

## AI Identify Endpoint

- Cloud Function URL: `https://identify-yq7xepmata-uc.a.run.app`
- Default provider: Gemini (`gemini-2.5-flash`), can override with `provider: 'openai'`.
- Client env: set `EXPO_PUBLIC_IDENTIFY_URL` (see `app/.env.example`).

## Secrets

- Stored in Firebase Secret Manager: `GEMINI_API_KEY`, `OPENAI_API_KEY`.
- Rotate via `firebase functions:secrets:set GEMINI_API_KEY` then `firebase deploy --only functions:identify`.
