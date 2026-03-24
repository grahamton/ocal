# Changelog

All notable changes to the **Ocal** project will be documented in this file.

## [2.0.0] - 2026-03-23

### Added
- **Expo Router Migration**: Implemented file-based routing in the `app/` directory.
- **Universal App Architecture**: Native support for tabs and modals using Expo Router.
- **Zustand State Management**: Introduced `useSelectionStore` for high-performance transient UI state.
- **Gemini 3.1 Upgrade**: Cloud Functions and Client now utilize the `gemini-3.1-flash` model.
- **AI Traceability**: Added a metadata envelope to AI responses, tracking model versions and schema versions.
- **MainHeader Component**: Shared header component for consistent branding and session management across tabs.
- **Play Store Readiness**: Added `versionCode`, production build profiles, and integrated production `google-services.json`.

### Changed
- **Non-Blocking Writes**: Refactored `firestoreService.ts` to use "fire-and-forget" writes, improving offline-first responsiveness.
- **Simplified AI Schemas**: Unified all AI data structures to the strict `AnalysisEvent` type, removing legacy `RockIdResult` unions.
- **Modernized FileSystem**: Migrated from `expo-file-system/legacy` to standard `expo-file-system`.
- **Project Entry**: Updated `package.json` to use `expo-router/entry`.

### Removed
- **Legacy SQLite Layer**: Deleted `db.ts` and `expo-sqlite` dependency.
- **Migration Logic**: Removed SQLite-to-Firestore migration code and UI components as the transition is complete.
- **React Context for Selection**: Replaced `SelectionContext` with Zustand store.
- **Hardcoded AI Metadata**: Client no longer hardcodes model versions; it consumes them dynamically from the API.
