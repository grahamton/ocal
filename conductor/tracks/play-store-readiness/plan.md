# Implementation Plan: Play Store Readiness & Backend Consolidation

**Track ID**: `play-store-readiness`

## 1. Objective

To resolve bugs and configuration issues blocking the release of Ocal on the Google Play Store. This includes modernizing the backend build process, ensuring API consistency, and meeting all app metadata requirements.

## 2. Requirements

- [x] **Backend Modernization**: Convert Cloud Functions to TypeScript with a proper build pipeline.
- [x] **API Consistency**: Ensure the `identify` and `identifyRock` endpoints use the latest Gemini 3.1 Flash logic.
- [x] **Data Reliability**: Make Firestore writes awaitable to prevent race conditions during AI analysis.
- [x] **Play Store Metadata**: Add mandatory Privacy Policy and explicit permissions to `app.json`.
- [x] **Version Management**: Increment `versionCode` for a fresh store submission.
- [x] **Cleanup**: Remove stale JavaScript files from the `functions/` directory.

## 3. Implementation Steps

### Phase 1: Backend Infrastructure
- [x] Add `zod`, `typescript`, and `@typescript-eslint` to `functions/package.json`.
- [x] Create `functions/tsconfig.json` for compilation.
- [x] Migrate `index.js` logic to `src/index.ts` using modern v2 `onRequest`.
- [x] Create `src/prompt.ts` to centralize Ranger Al system and user prompts.

### Phase 2: App Reliability
- [x] Refactor `firestoreService.ts` to `await` critical `set`, `update`, and `delete` operations.
- [x] Ensure `IdentifyQueueService.ts` correctly handles the now-awaited Firestore states.

### Phase 3: Store Submission Prep
- [x] Update `app.json` with `privacyPolicyUrl`.
- [x] Define explicit Android permissions (`CAMERA`, `ACCESS_FINE_LOCATION`).
- [x] Increment `versionCode` to `2`.
- [x] Create `PRIVACY.md` in the project root.

### Phase 4: Final Cleanup
- [x] Delete `functions/index.js`, `functions/rockIdPrompt.js`, and `functions/rockIdSchema.js`.

## 4. Definition of Done

- Cloud Functions build successfully using `npm run build`.
- AI identification works reliably with the new Gemini logic.
- App is ready for production build with `eas build --profile production`.
- All Play Store mandatory metadata is present in `app.json`.
