# Implementation Plan: Refactor to Path Aliases

**Track ID**: `refactor-path-aliases`

## 1. Objective

To refactor the entire `app/src` codebase to use the new `@/*` path alias for all imports. This will eliminate long relative paths (`../../...`), making the code cleaner, easier to read, and more maintainable.

## 2. Implementation Steps

The process involves systematically going through each file and updating its import statements.

### Files to Refactor:

- [x] `app/App.tsx`
- [x] `app/src/features/capture/CameraCapture.tsx`
- [x] `app/src/features/gallery/GalleryGrid.tsx`
- [x] `app/src/features/detail/FindDetailModal.tsx`
- [x] `app/src/features/settings/DataManager.tsx`
- [x] `app/src/shared/SessionContext.tsx`
- [x] `app/src/ai/identifyRock.ts`
- [x] `app/src/ai/IdentifyQueueService.ts`
- [ ] ... and any other files in `app/src` with relative imports.

### Refactoring Process (for each file):

1.  **Identify relative imports**: Look for imports with paths like `../`, `../../`, etc.
2.  **Replace with alias**: Convert the path to use the `@/` alias.
    -   **Example (from `FindDetailModal.tsx`)**:
        -   **Before**: `import { FindRecord } from '../../shared/types';`
        -   **After**: `import { FindRecord } from '@/shared/types';`
3.  **Verify**: After refactoring, run the application and the linter/type-checker to ensure that all modules are resolved correctly.

## 3. Definition of Done

- All relative imports within the `app/src/` directory have been replaced with the `@/*` path alias where applicable.
- The application compiles and runs without any module resolution errors.
- The ESLint and TypeScript checks pass successfully.
