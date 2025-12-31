# Ocal Architecture

## System Overview

Ocal is a **React Native mobile app** for rock identification and cataloging, designed for senior users who walk beaches daily collecting geological specimens.

**Core Philosophy**: "Silent Partner" - the app should feel like a helpful companion, not a complex tool requiring technical knowledge.

---

## High-Level Architecture

```
┌─────────────────────────────────────────┐
│           React Native App              │
│  (iOS/Android - Offline-First)          │
├─────────────────────────────────────────┤
│  UI Layer                               │
│  - Capture (Camera)                     │
│  - Gallery (Grid/List views)            │
│  - Detail (Logbook entry)               │
│  - Insights (Analytics)                 │
├─────────────────────────────────────────┤
│  State Management                       │
│  - ThemeContext (journal/high-contrast) │
│  - SessionContext (beach walks)         │
│  - SelectionContext (batch operations)  │
├─────────────────────────────────────────┤
│  Data Layer                             │
│  - SQLite (local database)              │
│  - Expo FileSystem (photos)             │
│  - Queue Service (AI processing)        │
└─────────────────────────────────────────┘
              ↓ HTTP
┌─────────────────────────────────────────┐
│      Firebase Cloud Functions           │
│  - identifyRock (Gemini AI)             │
│  - Structured output (Zod schema)       │
└─────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. **Offline-First with SQLite**

**Decision**: Use local SQLite database, not cloud-first storage

**Rationale**:

- Beach walks often have no cell service
- Users need to capture finds immediately
- Sync can happen later (future feature)
- Faster, more reliable UX

**Trade-off**: No cross-device sync (yet)

---

### 2. **Queue-Based AI Processing**

**Decision**: Background queue for AI identification, not synchronous

**Rationale**:

- AI calls can be slow (5-10 seconds)
- Don't block user from capturing next find
- Handle offline → online transitions gracefully
- Retry failed requests automatically

**Implementation**: `IdentifyQueueService` with polling

---

### 3. **React Native (Expo)**

**Decision**: React Native with Expo, not native iOS/Android or PWA

**Rationale**:

- Cross-platform (iOS + Android)
- Native camera access
- Offline capabilities
- Faster development than native
- Better UX than PWA (app icon, notifications)

**Trade-off**: Expo limitations, larger bundle size

---

### 4. **Gemini API over OpenAI**

**Decision**: Google Gemini for rock identification

**Rationale**:

- Multimodal (image + text) out of box
- Structured output support (Zod schemas)
- Better at geological identification (tested)
- Cost-effective for image analysis

**Trade-off**: Newer API, less community support

---

### 5. **Session-Based Organization**

**Decision**: Group finds by "sessions" (beach walks), not just tags/folders

**Rationale**:

- Matches mental model (one walk = one session)
- Captures temporal/spatial context
- Enables insights (best times, locations)
- Natural for daily collectors

**Future**: Auto-create sessions based on time/location

---

## Data Flow

### Capture Flow

```
1. User taps camera
2. Take photo → Save to FileSystem
3. Get GPS coordinates
4. Create FindRecord (status: 'draft')
5. Insert into SQLite
6. Add to active session
7. Show in gallery
```

### AI Identification Flow

```
1. User taps "Analyze"
2. Add to IdentifyQueue (status: 'pending')
3. Queue service picks up item
4. Upload photo + prompt to Gemini
5. Parse structured response (Zod)
6. Update FindRecord with aiData
7. Mark queue item 'completed'
8. Gallery auto-refreshes (polling)
```

### Logbook Entry Flow

```
1. User taps find in gallery
2. Show CardFront (photo)
3. Flip to CardBack (logbook)
4. Edit name, notes, favorite
5. Apply AI suggestions
6. Save → Update SQLite
7. Status: 'draft' → 'cataloged'
```

---

## Database Schema

### `finds` Table

```sql
CREATE TABLE finds (
  id TEXT PRIMARY KEY,
  photoUri TEXT NOT NULL,
  lat REAL,
  long REAL,
  timestamp TEXT NOT NULL,
  synced INTEGER NOT NULL,
  note TEXT,
  category TEXT,
  label TEXT,
  status TEXT DEFAULT 'draft',
  sessionId TEXT,
  favorite INTEGER DEFAULT 0,
  aiData TEXT  -- JSON blob
);
```

### `sessions` Table

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  startTime INTEGER NOT NULL,
  endTime INTEGER,
  locationName TEXT,
  status TEXT NOT NULL,  -- 'active' | 'complete'
  finds TEXT NOT NULL    -- JSON array of find IDs
);
```

### `find_queue` Table

```sql
CREATE TABLE find_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  findId TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'pending' | 'processing' | 'completed' | 'failed'
  attempts INTEGER DEFAULT 0,
  lastAttempt INTEGER,
  error TEXT,
  FOREIGN KEY(findId) REFERENCES finds(id) ON DELETE CASCADE
);
```

---

## Component Architecture

### Feature-Based Structure

```
src/
├── features/
│   ├── capture/
│   │   └── CameraCapture.tsx
│   ├── gallery/
│   │   └── GalleryGrid.tsx (grid/list views)
│   ├── detail/
│   │   ├── FindDetailModal.tsx (Scientist View / Field Lab)
│   │   └── components/ (Deleted legacy CardFront/Back)
│   └── insights/
│       └── InsightsView.tsx (analytics)
├── shared/
│   ├── components/ (GlassView, FlipCard, etc.)
│   ├── db.ts (SQLite operations)
│   ├── types.ts (TypeScript definitions)
│   └── ThemeContext.tsx
└── ai/
    ├── identifyRock.ts (API client)
    ├── IdentifyQueueService.ts
    └── rockIdSchema.ts (Zod schema)
```

---

## State Management

**No Redux/MobX** - Using React Context for simplicity

### ThemeContext

- `mode`: 'journal' | 'high-contrast'
- `colors`: Dynamic color palette
- Senior-friendly: high contrast, large text

### SessionContext

- `activeSession`: Current beach walk
- `startSession()`, `endSession()`
- Auto-add finds to active session

### SelectionContext

- `selectedIds`: Set of selected find IDs
- Batch operations (delete, analyze)
- Long-press to enter selection mode

---

## AI Integration

### Prompt Strategy

```
You are a geologist identifying rocks from photos.
Analyze this rock and provide:
- Best guess (name, confidence)
- Alternative possibilities
- Observable characteristics
- Catalog tags (type, color, texture)
```

### Structured Output (Zod)

```typescript
{
  best_guess: { label, confidence },
  alternatives: [...],
  observable_reasons: [...],
  catalog_tags: { type, color, texture, ... }
}
```

### Error Handling

- Retry failed requests (max 3 attempts)
- Graceful degradation (show error, allow manual entry)
- Queue persists across app restarts

---

## Performance Considerations

### Image Optimization

- Compress photos before upload (max 2048px)
- Local thumbnails for gallery
- Lazy load images

### Database

- Indexes on `timestamp`, `sessionId`, `status`
- WAL mode for concurrent reads
- Batch operations for imports

### UI Responsiveness

- Async operations don't block UI
- Optimistic updates (show immediately, sync later)
- Skeleton loaders for AI results

---

## Future Architecture Changes

### Planned

1. **Cloud Sync** - Firebase/Supabase for cross-device
2. **Map View** - React Native Maps for location visualization
3. **Export** - CSV/PDF generation
4. **Sharing** - Social features, collaborative collections

### Under Consideration

1. **Web App** - React web version for desktop
2. **ML Model** - On-device rock identification
3. **AR Features** - Point camera, see rock info overlay

---

## Security & Privacy

- **No authentication** (single-user app)
- **Local-first** (data stays on device)
- **API keys** secured in Firebase Secret Manager
- **GPS optional** (can disable location)
- **No analytics** (privacy-focused)

---

## Development Workflow

### Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Firebase Cloud Functions (Node.js)
- **Database**: SQLite (expo-sqlite)
- **AI**: Google Gemini API
- **Fonts**: Outfit (Google Fonts)
- **Icons**: Ionicons

### Build & Deploy

- **Dev**: `npm start` (Expo Go)
- **Production**: EAS Build (iOS/Android)
- **Functions**: `firebase deploy --only functions`

---

## Summary

Ocal is built for **offline-first rock collecting** with **AI-powered identification**. The architecture prioritizes **simplicity**, **reliability**, and **senior-friendly UX** over complex features or cloud dependencies.

**Core Principle**: The app should feel like a helpful companion on beach walks, not a technical tool requiring expertise.
