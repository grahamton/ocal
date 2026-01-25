# Implementation Plan: Code Quality Cleanup

**Track ID**: `code-quality-cleanup`

## 1. Objective

To address and fix all reported ESLint errors and warnings, ensuring the codebase adheres to defined quality standards and best practices.

## 2. Implementation Steps

Each item below represents a specific ESLint issue identified during the initial linting pass. Each issue will be addressed in its respective file.

### ESLint Errors (11 total)

- [x] 1. **`app/src/ai/IdentifyQueueService.ts`**: `106:16 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`
- [x] 2. **`app/src/features/insights/InsightsView.tsx`**: `52:32 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`
- [x] 3. **`app/src/features/insights/InsightsView.tsx`**: `54:32 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`
- [x] 4. **`app/src/shared/AnalyticsService.ts`**: `27:56 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`
- [x] 5. **`app/src/shared/LogService.ts`**: `66:22 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`
- [x] 6. **`app/src/shared/LogService.ts`**: `67:22 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`
- [x] 7. **`app/src/shared/SessionContext.tsx`**: `39:7 error Calling setState synchronously within an effect can trigger cascading renders` (`react-hooks/set-state-in-effect`)
- [x] 8. **`app/src/shared/components/RawJsonInspector.tsx`**: `14:9 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`
- [x] 9. **`app/src/shared/export/ExportService.ts`**: `52:19 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`
- [x] 10. **`app/src/shared/export/ExportService.ts`**: `118:34 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`
- [x] 11. **`app/src/shared/export/ExportService.ts`**: `123:33 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`

### ESLint Warnings (6 total)

- [x] 1. **`app/App.tsx`**: `48:19 warning 'setDbReady' is assigned a value but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars`
- [x] 2. **`app/src/ai/IdentifyQueueService.ts`**: `9:10 warning 'FindRecord' is defined but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars`
- [x] 3. **`app/src/ai/IdentifyQueueService.ts`**: `10:13 warning 'FileSystem' is defined but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars`
- [x] 4. **`app/src/shared/LogService.ts`**: `64:5 warning Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any')`
- [x] 5. **`app/src/shared/components/StatusIcon.tsx`**: `50:6 warning React Hook useEffect has a missing dependency: 'pulseAnim'. Either include it or remove the dependency array react-hooks/exhaustive-deps`
- [x] 6. **`app/src/shared/migration/MigrationStatusModal.tsx`**: `9:3 warning 'Platform' is defined but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars`

## 3. Definition of Done

- All ESLint errors and warnings are resolved.
- The `npm run lint` command executes without any reported issues.
- No new regressions are introduced.
