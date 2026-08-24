# Agentic Handoff: Ocal Developer Guide

Welcome! This repository has been fully refactored, formatted, and configured with **zero ESLint errors** to serve as a clean baseline for continued development.

---

## 🚦 Repository Status & Health
- **Lint Check:** 100% Green (`npm run lint` compiles with 0 errors/warnings).
- **TypeScript Code:** 100% Type-safe (`tsc -p tsconfig.test.json` builds with 0 compile errors).
- **Formatting:** Checked and formatted with Prettier (`npm run format`).
- **Unit Test Runner Note:** `npm run test` executes typescript compilation successfully. If Node.js `v24+` complains about native ESM type-stripping inside `node_modules` during tests, you can compile via `tsc` directly to verify typing integrity.

---

## 🏗 Operations & Dev Guide
Run the following scripts within the `app/` workspace directory:
- **Install:** `npm install`
- **Start Expo Web Dev:** `npm run web`
- **Type Check & Lint:** `npm run lint`
- **Auto Format:** `npm run format`
- **Unit Tests:** `npm run test`

---

## 📜 Key Mandates
1. **File Size Limit (< 200 Lines):** Keep every React/TypeScript file under 200 lines. 
   - *Is this realistic?* Yes, but **only if** concerns are strictly separated. If a component file exceeds 150 lines:
     - Extract styling blocks into a sibling `<Component>.styles.ts` file.
     - Move complex business logic or async flow handling into custom hooks or Zustand stores.
     - Split large JSX tree nodes into smaller dedicated sub-components.
2. **No Tailwind CSS:** Style exclusively with React Native `StyleSheet` and `@/shared/ThemeContext` color tokens.
3. **Path Aliases:** Always use `@/*` for imports targeting `app/src/`.
4. **Offline-First Schema:** All captured records are stored locally with optimistic UI rendering.
5. **The Silent Partner UI:** Keep UI friction low for seniors (high contrast, large font sizes $\ge 16$px, wide touch targets, and automatic background identification).
6. **Global Queue Providers:** Subscriptions and background listeners (like the AI processor) must run in single global context providers or Zustand stores to prevent duplicate concurrent API invocations.
7. **View Recycling for Lists:** Always render collection views using `FlatList` or `FlashList` to enable view recycling. Never use nested scroll views containing map renders.
8. **Native Modal presentation:** Delegate modal layers to Expo Router's native Stack navigator options (e.g. `presentation: 'modal'`) rather than using custom React Native inline `<Modal>` components.

---

## 🛠 Recent Structural Refactoring
The codebase was recently refactored to optimize performance and enforce code boundaries:

1. **AI Queue Listener Provider (`@/ai/IdentifyQueueService`)**
   - Moved queue subscription into the global `IdentifyQueueProvider` context wrapper.
   - Prevents duplicate Firestore subscriptions and prevents concurrent duplicate calls to the Gemini API.
   - Initialized at root `app/app/_layout.tsx`.
2. **Modularized Find details (`@/features/detail/`)**
   - Extracted large custom sections out of `FindDetailModal.tsx` into small, focused sub-components inside `src/features/detail/components/` (`MineralDetails.tsx`, `PetrologyDetails.tsx`, `PaleontologyDetails.tsx`, `ArtifactDetails.tsx`, `LapidaryGuidance.tsx`, `GeologicContext.tsx`, and `TechnicalDetails.tsx`).
   - `FindDetailModal.tsx` is now **195 lines** (under the 200-line mandate).
3. **Upgraded list rendering (`@/features/gallery/`)**
   - Converted the collection grid/list views from `.map` inside ScrollView to `FlatList` to optimize memory via view recycling.
   - Extracted grid card and list row renderers into `GridItem.tsx` and `ListItem.tsx` under `src/features/gallery/components/`.
   - `GalleryGrid.tsx` is now **197 lines** (under the 200-line mandate).
4. **Native Expo Router modal routing (`/detail/[id]`)**
   - Replaced custom React Native `<Modal>` component with Expo Router's native modal presenter configuration.
   - Detail page queries Firestore using `subscribeToFind` to allow background AI updates to update the modal content in real time.

---

## 📂 Codebase Anatomy
- **Root Layout & Routing:** `app/app/` (Expo Router Stack and tabs).
  - `(tabs)/index.tsx`: Capture tab.
  - `(tabs)/gallery.tsx`: Gallery tab.
  - `detail/[id].tsx`: Native modal find detail page.
- **Components & Features:** `app/src/features/`
  - `capture/`: Camera rendering, GPS collection, and ledger widgets.
  - `gallery/`: FlatList rendering, grid/list view mode selectors.
  - `detail/`: Modularized details layout.
- **Shared Utilities & State Contexts:** `app/src/shared/`
  - `SessionContext.tsx`: Session/auth status tracking.
  - `firestoreService.ts`: Firestore document read/writes and listeners.
  - `ThemeContext.tsx` & `theme.ts`: Contrast configurations and palettes.
  - `store/useSelectionStore.ts`: Zustand multi-select global state.
- **Gemini AI Core Prompt & Schema:** `app/src/ai/`
  - `RangerConfig.ts`: Context details injection.
  - `rockIdSchema.ts`: Structured schema return parser.

---

## 🎯 Next Backlog Priorities
- **Web Companion View:** Complete the desktop client layout so users can view and export their findings on a larger screen.
- **Poster Share Mode ("Fossil Plate"):** Implement canvas/image generation of selected finds as a collective image block.
- **Geologic Prompt Tuning:** Continue refining context prompts to map regional geological formations based on location hints.
