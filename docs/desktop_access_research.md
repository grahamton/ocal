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

1. **Phase 12 - Web Companion (The "Real" Solution):**

   - **Architecture:** PWA (Expo Web) driven by **Cloud Sync**.
   - **Why:** Delivers true cross-device access (Phone <-> Laptop). Users want to see their _existing_ finds on the big screen, not just a blank camera app.
   - **Prerequisites:** Requires **Phase 9 (Cloud Sync)** to be implemented first. A web app without data is useless.

2. **Stopgap (If desperate):**
   - Ship the Android APK to Chromebook Play Store.
   - **Warning:** This is "Local Only". Data does not sync. Low value for existing users.

## Strategic Decision (Jan 2026)

We are committing to **Phase 12 (Web Companion)**. We will skip the "Stopgap" unless a specific partner demands an offline field-laptop solution.

## Immediate Action Items

- **Roadmap:** Add "Phase 12 - Web Companion" to ROADMAP.md.
- **Research Phase 9:** Cloud Sync is now a blocking dependency for Desktop. We need to prioritize `docs/database_enhancements_research.md`.
