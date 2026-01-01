# Chromebook/Windows Access Research

## Goals
- Give Carol and Jim a comfortable way to browse, organize, and back up their collections beyond a phone-only experience.
- Preserve the "silent partner" workflow: captures should still feel automatic and low-friction, and cross-device access must not introduce management chores.

## Current State
- **Platform:** React Native + Expo targeting iOS/Android only; `expo start --web` exists but native-first dependencies make web builds unvalidated.
- **Data:** Local-only SQLite + FileSystem per device; no cloud sync or cross-device access.
- **Capture stack:** Camera, location, and offline queueing are optimized for phones; desktop-class capture is not designed.

## Delivery Options
### 1) Ship the existing Android build to Chromebooks (Play Store)
- **Pros:** Lowest lift; keeps camera/location/queueing intact; offline behavior unchanged.
- **Cons:** Only solves Chromebook users who can run Android apps; Windows users excluded; still local-only storage per device.
- **Risks:** Larger screen UX unoptimized; keyboard/mouse affordances missing; unclear Play Store policy for ChromeOS-only targets.

### 2) Expo Web + PWA (React Native Web)
- **Pros:** Single codebase; installable on ChromeOS/Edge; easy distribution (HTTPS). Good fit for read/manage workflows (Gallery, filtering, favoriting).
- **Cons:** Native modules need web-safe shims or fallbacks (`expo-file-system`, `expo-sqlite`, `expo-camera`, `expo-location`). Some features (camera, background tasks) may be degraded on desktop browsers.
- **Risks:** Offline-first parity depends on IndexedDB + service workers; requires cloud sync to make desktop valuable; significant QA on responsive layouts.

### 3) React Native for Windows (native desktop app)
- **Pros:** Native file system access and local database; best Windows integration (shell, keyboard shortcuts).
- **Cons:** Divergent tooling from Expo; many Expo modules unsupported; highest engineering cost; duplicate surface area to maintain.
- **Risks:** Forked UI/components and build pipelines; slows mobile velocity.

## Data & Sync Considerations
- Desktop value hinges on **cross-device access**; without cloud sync, users still manage isolated vaults per device.
- Likely stack: **Firestore/Storage** for records + media, with conflict-tolerant merges; maintain SQLite + FileSystem offline cache with delta sync.
- Need background sync + retries that respect the queue model and avoid forcing manual conflict resolution.

## Recommended Path (Phased)
1) **Short-term:** Deliver Chromebook access via the Android build (Play Store), with minimal layout fixes for large screens. Document ChromeOS support and test capture/queue basics.
2) **Web PWA pilot (read/manage-first):**
   - Stand up Expo Web build focused on Gallery/Detail browsing and favorites; disable camera if unavailable.
   - Introduce shims for file storage (use browser blobs/IndexedDB) and SQLite (WebSQL/IndexedDB adapter) to keep UI functional.
   - Add responsive styles and keyboard/mouse affordances (hover states, focus rings, larger tap targets still maintained).
3) **Cross-device sync:** Layer in cloud-backed collections so phone and web stay consistent. Start with one-way publish (mobile → cloud → web view), then add edits from web.
4) **Windows native appraisal:** Revisit React Native for Windows only if PWA adoption is strong and we need deeper OS hooks (file drag/drop, printing). Until then, avoid fragmenting the codebase.

## Immediate Action Items
- Create a compatibility matrix for Expo modules on web (camera, file system, SQLite, background tasks) and define fallbacks.
- Prototype Expo Web build for Gallery-only route; measure bundle size and performance on mid-range Chromebooks.
- Draft a sync ADR covering Firestore/Storage schema, conflict handling, and how queue status maps to cloud state.
- Plan UX updates for larger displays (grid density, sidebar filters, keyboard navigation) without breaking the senior-friendly visual language.
