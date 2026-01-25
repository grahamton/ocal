# Implementation Plan: Architectural Refactor - Cloud Sync

**Track ID**: `arch-firebase-sync`

## 1. Objective

This track covers the architectural refactor to migrate Ocal from a local-only data storage model to a cloud-backed one using the core Firebase stack. This will enable future features like multi-device synchronization and web/desktop access, as outlined in the Tech Stack document.

## 2. Key Services to Integrate

- **Firebase Authentication**: For creating a stable, anonymous user identity.
- **Firestore**: To replace SQLite for storing and syncing data records.
- **Cloud Storage for Firebase**: To replace the local file system for storing and syncing photos.

## 3. Implementation Steps

### Phase 1: Project Setup & Configuration

- [x] 1. **Install Firebase Libraries**: Add the required Firebase SDKs to `app/package.json`.
  - `expo install @react-native-firebase/app`
  - `expo install @react-native-firebase/auth`
  - `expo install @react-native-firebase/firestore`
  - `expo install @react-native-firebase/storage`
- [x] 2. **Configure Firebase in Expo**:
  - Download the `google-services.json` (for Android) and `GoogleService-Info.plist` (for iOS) from the Firebase project console.
  - Add the `@react-native-firebase/app` plugin to `app.json`.
  - Ensure the native projects are correctly configured to use Firebase.

### Phase 2: Authentication

- [x] 1. **Implement Anonymous Sign-In**: On app startup, check for an existing user. If none exists, call the `auth().signInAnonymously()` method.
- [x] 2. **Provide User Context**: Create a new `AuthContext` to provide the user's authentication state and unique ID (`uid`) throughout the application.

### Phase 3: Data Migration (Firestore)

- [x] 1. **Define Firestore Schema**: Design the new collection and document structure.
  - **Proposed Structure**: `/users/{userId}/finds/{findId}`
- [x] 2. **Create Firestore Service**: Create a new `src/shared/firestoreService.ts` to handle all database operations (CRUD for finds and sessions).
- [x] 3. **Replace SQLite Calls**: Go through the application (e.g., `GalleryGrid`, `FindDetailModal`) and replace all calls to the old `db.ts` with calls to the new `firestoreService.ts`. The UI should now be powered by real-time data from Firestore.
- [x] 4. **Adapt Session Logic**: Update the `SessionContext` to read from and write session data to Firestore instead of local state or SQLite.

### Phase 4: Image Migration (Cloud Storage)

- [x] 1. **Create Storage Service**: Implement functions in a new `storageService.ts` to upload an image to Cloud Storage and get its public download URL.
- [x] 2. **Update Capture Flow**: In `CameraCapture.tsx`, modify the logic to upload the photo to Cloud Storage immediately after it's taken.
- [x] 3. **Update `Find` Data Model**: The `photoUri` field in the `finds` collection in Firestore should now store the Cloud Storage download URL, not a local file URI.
- [x] 4. **Update Image Components**: Ensure that `<img>` or `<Image>` components throughout the app can load images from the new Cloud Storage URLs.

### Phase 5: Backfill Existing Data

- [x] 1. **Create Migration Utility**: Build a one-time, user-triggered utility function accessible from the settings page.
- [x] 2. **Implement Read/Write Logic**: This utility should:
  - Read all existing records from the local SQLite database.
  - For each record, upload its local photo to Cloud Storage.
  - Create a new document in Firestore with the record's data and the new photo URL.
- [x] 3. **Provide User Feedback**: Show the user the progress of the migration and confirm when it's complete.

### Phase 6: Cleanup

- [x] 1. **Remove Old Code**: Once the migration is verified, delete `src/shared/db.ts` and all related SQLite code.
- [x] 2. **Deprecate Local Fields**: Remove any now-unused fields from data types, such as `synced`.
- [x] 3. **Clean Up UI**: Remove the manual data migration utility from the settings page after a reasonable deprecation period.

## 4. Definition of Done

- The application runs without relying on the local SQLite database.
- All new data (finds, sessions, photos) is persisted to Firebase services under an anonymous user ID.
- The app successfully syncs data created while offline once it reconnects.
- Existing user data can be successfully migrated to the new backend.
