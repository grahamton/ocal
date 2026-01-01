# Database Enhancements Research

## Goals

Enable users to have full control over their data with robust storage, syncing, and manipulation capabilities. Transform Ocal from a local-first mobile app into a platform that supports:

- **Cross-device sync** - Access finds from phone, tablet, desktop
- **User-controlled data** - Export, import, backup, restore
- **Advanced querying** - Build custom tables, filter, sort, analyze
- **Data ownership** - Users control where data lives (local, Firebase, self-hosted)
- **Offline-first resilience** - Continue working without connectivity

## Current State

### Storage Architecture

- **Local Storage**: AsyncStorage (React Native) for all finds, sessions, and metadata
- **Data Model**:
  - `Find` objects with photos, GPS, timestamps, AI analysis
  - `Session` objects grouping finds by time/location
  - No cloud sync, no authentication, no remote backup
- **Limitations**:
  - Single-device only
  - No backup/restore mechanism
  - Limited query capabilities (in-memory filtering only)
  - No data export beyond sharing individual finds
  - Storage limits tied to device capacity

### Existing Infrastructure

- **Firebase Project**: Already configured for Cloud Functions (AI identification)
- **Google Cloud**: Available through Firebase integration
- **Current Dependencies**:
  - `@react-native-async-storage/async-storage`
  - Firebase Functions SDK (backend only)
  - No Firestore, no Realtime Database, no Cloud Storage yet

## Options

### Option 1: Firebase Firestore + Cloud Storage (Recommended for MVP)

**Architecture:**

- **Firestore** for structured data (finds, sessions, metadata)
- **Cloud Storage** for photos (full-res + thumbnails)
- **Firebase Auth** (optional) for multi-device sync
- **Offline Persistence** built-in with Firestore

**Pros:**

- Seamless integration with existing Firebase Functions
- Built-in offline support and sync
- Real-time updates across devices
- Generous free tier (1GB storage, 50K reads/day)
- Automatic indexing and querying
- Security rules for user data isolation
- Managed infrastructure (no server maintenance)

**Cons:**

- Vendor lock-in to Google ecosystem
- Cost scales with usage (storage, bandwidth, operations)
- Limited control over data location
- Requires Firebase SDK (~500KB bundle size)
- Query limitations (no full-text search without extensions)

**Implementation Path:**

1. Add Firestore SDK to React Native app
2. Create data migration layer (`AsyncStorage` → Firestore)
3. Implement sync service with conflict resolution
4. Add Firebase Auth (email/anonymous) for user identity
5. Configure security rules for user data isolation
6. Migrate photos to Cloud Storage with lazy upload
7. Build export/import utilities (JSON + ZIP)

**Cost Estimate (100 active users):**

- Storage: ~10GB photos = $0.26/month
- Bandwidth: ~50GB downloads = $6/month
- Operations: ~1M reads/writes = $0.60/month
- **Total: ~$7/month** (well within free tier initially)

---

### Option 2: Self-Hosted Backend (PostgreSQL + S3-Compatible Storage)

**Architecture:**

- **PostgreSQL** for structured data with PostGIS for geospatial queries
- **MinIO/S3** for photo storage
- **Custom REST API** (Node.js/Express or Go)
- **Client-side sync** with conflict resolution

**Pros:**

- Full control over data and infrastructure
- No vendor lock-in
- Advanced querying (SQL, geospatial, full-text search)
- Predictable costs (fixed server pricing)
- Can self-host on user's own hardware (Raspberry Pi, NAS)

**Cons:**

- Requires server maintenance and DevOps expertise
- No built-in offline sync (must implement manually)
- Higher initial development cost
- User must manage backups and security
- Scaling requires manual intervention

**Implementation Path:**

1. Build REST API with authentication (JWT)
2. Implement sync protocol (last-write-wins or CRDT)
3. Create client-side sync service
4. Build admin panel for data management
5. Provide Docker Compose for easy self-hosting
6. Document deployment (DigitalOcean, AWS, home server)

**Cost Estimate:**

- VPS (2GB RAM): $12/month (DigitalOcean)
- S3 storage (100GB): $2.30/month
- **Total: ~$15/month** (or free if self-hosted)

---

### Option 3: Hybrid Local-First with Optional Cloud Sync

**Architecture:**

- **Local SQLite** as primary database (react-native-sqlite-storage)
- **Optional Firestore sync** for users who want cloud backup
- **Local photo storage** with optional Cloud Storage upload
- **Export to CSV/JSON/SQLite** for power users

**Pros:**

- Preserves local-first philosophy
- Users choose their own sync strategy
- No mandatory cloud dependency
- Best offline performance
- Full SQL querying locally
- Easy data export for analysis

**Cons:**

- More complex codebase (dual storage paths)
- Sync conflicts harder to resolve
- SQLite schema migrations required
- Limited real-time collaboration

**Implementation Path:**

1. Migrate AsyncStorage → SQLite with schema versioning
2. Build local query layer (SQL builder)
3. Add optional Firestore sync toggle in settings
4. Implement bi-directional sync with conflict UI
5. Create export utilities (CSV, JSON, SQLite file)
6. Build "Data Manager" UI for backups and imports

**Cost Estimate:**

- Free for local-only users
- ~$5/month for cloud sync users (Firestore)

---

### Option 4: CouchDB/PouchDB (Offline-First Sync)

**Architecture:**

- **PouchDB** (local IndexedDB/SQLite wrapper)
- **CouchDB** (self-hosted or Cloudant)
- **Built-in replication** with conflict resolution

**Pros:**

- True offline-first with automatic sync
- Conflict resolution built-in (multi-version concurrency)
- Works in browser (PWA) and React Native
- Can self-host CouchDB easily
- JSON document model (flexible schema)

**Cons:**

- Less mature ecosystem than Firestore
- Larger bundle size (~200KB)
- Cloudant (IBM) pricing less competitive than Firebase
- Limited querying (no SQL, uses MapReduce)
- Smaller community and fewer resources

**Implementation Path:**

1. Replace AsyncStorage with PouchDB
2. Set up CouchDB instance (Docker or Cloudant)
3. Configure replication with filters
4. Implement attachment sync for photos
5. Build conflict resolution UI

**Cost Estimate:**

- Self-hosted: ~$10/month (VPS)
- Cloudant: ~$75/month (1GB storage + operations)

---

## Recommendation: Phased Approach

### Phase 1: Enhanced Local Storage (SQLite)

**Timeline: 2-3 weeks**

- Migrate from AsyncStorage to SQLite
- Implement advanced querying (filter by date range, location radius, AI confidence)
- Add data export (CSV, JSON, SQLite file)
- Build "Data Manager" screen with backup/restore
- **No cloud dependency yet**

**Benefits:**

- Immediate power-user features
- Foundation for future sync
- No ongoing costs
- Preserves local-first philosophy

---

### Phase 2: Optional Firebase Sync

**Timeline: 3-4 weeks**

- Add Firebase Auth (anonymous + email)
- Implement Firestore sync service
- Migrate photos to Cloud Storage (lazy upload)
- Add "Cloud Sync" toggle in settings
- Build conflict resolution UI
- **Users opt-in to cloud features**

**Benefits:**

- Cross-device access for users who want it
- Automatic backups
- Real-time sync
- Still works offline-first

---

### Phase 3: Advanced Data Tools

**Timeline: 2-3 weeks**

- Build custom table builder (user-defined views)
- Add CSV import for bulk data
- Implement data sharing (export collection as shareable link)
- Create "Field Guide" mode (curated collections)
- Add geospatial queries (finds within X miles of location)

**Benefits:**

- Power users can analyze data
- Educators can share collections
- Researchers can export for analysis

---

### Phase 4: Self-Hosting Option (Future)

**Timeline: 4-6 weeks**

- Document self-hosting with Docker Compose
- Provide alternative sync backend (PostgreSQL + MinIO)
- Build admin panel for self-hosted instances
- **For users who want full control**

**Benefits:**

- No vendor lock-in
- Privacy-focused users can self-host
- Educational institutions can run their own instances

---

## Action Items

### Immediate Next Steps

1. **Create GitHub Issue**: "Database Enhancements - Long-term Storage & Sync Strategy"
2. **Prototype SQLite Migration**:
   - Install `react-native-sqlite-storage`
   - Create schema for `finds` and `sessions` tables
   - Build migration script from AsyncStorage
3. **Design Export Feature**:
   - CSV export with all metadata
   - JSON export for backup/restore
   - SQLite file export for power users
4. **User Research**:
   - Survey target users (your father, outdoor enthusiasts)
   - Ask: "Would you want your finds on multiple devices?"
   - Ask: "Would you pay $5/month for cloud sync?"

### Questions for User

1. **Priority**: Is cross-device sync a must-have, or is local-first with export sufficient for now?
2. **Privacy**: How important is self-hosting vs. convenience of Firebase?
3. **Cost**: Would users pay for cloud sync, or should it be free with storage limits?
4. **Timeline**: Should this be prioritized over other roadmap items (Poster, iOS version)?

---

## Technical Considerations

### Data Migration Strategy

- **Backward compatibility**: Old AsyncStorage data must migrate seamlessly
- **Schema versioning**: Use Alembic-style migrations for SQLite
- **Rollback safety**: Keep AsyncStorage as fallback during transition
- **Testing**: Migrate test data with 1000+ finds to validate performance

### Sync Conflict Resolution

- **Last-Write-Wins (LWW)**: Simple, but can lose data
- **Operational Transform (OT)**: Complex, but preserves all edits
- **Conflict UI**: Show user both versions and let them choose
- **Recommendation**: Start with LWW + conflict UI for edge cases

### Photo Storage Strategy

- **Thumbnails**: Generate 200px thumbnails for list views
- **Full-res**: Store original photos separately
- **Lazy Upload**: Upload to cloud only when WiFi available
- **Compression**: Use JPEG quality 85% to reduce storage costs
- **Deduplication**: Hash photos to avoid duplicate uploads

### Security & Privacy

- **Firebase Security Rules**: Ensure users can only access their own data
- **Photo URLs**: Use signed URLs with expiration for Cloud Storage
- **Anonymous Auth**: Allow usage without email (device-linked)
- **Data Deletion**: Implement GDPR-compliant account deletion

---

## References

- [Firebase Firestore Pricing](https://firebase.google.com/pricing)
- [PouchDB Documentation](https://pouchdb.com/guides/)
- [React Native SQLite Storage](https://github.com/andpor/react-native-sqlite-storage)
- [Offline-First Design Patterns](https://offlinefirst.org/)
- [CRDTs for Sync](https://crdt.tech/)
