import * as SQLite from 'expo-sqlite';
import { FindRecord, Session } from './types';
import { RockIdResult } from '../ai/rockIdSchema';

const db = SQLite.openDatabaseSync('ocal.db');

export async function setupDatabase() {
  // WAL improves reliability for concurrent reads/writes.
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS finds (
      id TEXT PRIMARY KEY NOT NULL,
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
      aiData TEXT
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      startTime INTEGER NOT NULL,
      endTime INTEGER,
      locationName TEXT,
      status TEXT NOT NULL,
      finds TEXT NOT NULL
    );
  `);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS find_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      findId TEXT NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      lastAttempt INTEGER,
      error TEXT,
      FOREIGN KEY(findId) REFERENCES finds(id) ON DELETE CASCADE
    );
  `);
  await ensureColumns();
}

async function ensureColumns() {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(finds);`);
  const names = new Set(columns.map((c) => c.name));
  const migrations: Array<{ name: string; sql: string }> = [
    { name: 'note', sql: 'ALTER TABLE finds ADD COLUMN note TEXT;' },
    { name: 'category', sql: 'ALTER TABLE finds ADD COLUMN category TEXT;' },
    { name: 'label', sql: 'ALTER TABLE finds ADD COLUMN label TEXT;' },
    { name: 'status', sql: "ALTER TABLE finds ADD COLUMN status TEXT DEFAULT 'draft';" },
    { name: 'sessionId', sql: 'ALTER TABLE finds ADD COLUMN sessionId TEXT;' },
    { name: 'favorite', sql: 'ALTER TABLE finds ADD COLUMN favorite INTEGER DEFAULT 0;' },
    { name: 'aiData', sql: 'ALTER TABLE finds ADD COLUMN aiData TEXT;' },
  ];

  for (const migration of migrations) {
    if (!names.has(migration.name)) {
      try {
        await db.execAsync(migration.sql);
      } catch (error) {
        console.warn(`Migration skipped for column ${migration.name}`, error);
      }
    }
  }

  if (!names.has('status')) {
    await db.execAsync(`UPDATE finds SET status = 'draft' WHERE status IS NULL;`);
  }
  if (!names.has('favorite')) {
    await db.execAsync(`UPDATE finds SET favorite = 0 WHERE favorite IS NULL;`);
  }
}

export async function insertFind(record: FindRecord) {
  await db.runAsync(
    `INSERT INTO finds (id, photoUri, lat, long, timestamp, synced, note, category, label, status, sessionId, favorite, aiData) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    record.id,
    record.photoUri,
    record.lat,
    record.long,
    record.timestamp,
    record.synced ? 1 : 0,
    record.note ?? null,
    record.category ?? null,
    record.label ?? null,
    record.status,
    record.sessionId ?? null,
    record.favorite ? 1 : 0,
    JSON.stringify(record.aiData ?? null)
  );
}

type FindUpdate = {
  label?: string | null;
  note?: string | null;
  category?: string | null;
  status?: 'draft' | 'cataloged';
  sessionId?: string | null;
  favorite?: boolean;
  synced?: boolean;
  aiData?: RockIdResult | null;
};

export async function updateFindMetadata(id: string, updates: FindUpdate) {
  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  if ('label' in updates) {
    fields.push('label = ?');
    values.push(updates.label ?? null);
  }
  if ('note' in updates) {
    fields.push('note = ?');
    values.push(updates.note ?? null);
  }
  if ('category' in updates) {
    fields.push('category = ?');
    values.push(updates.category ?? null);
  }
  if ('status' in updates) {
    fields.push('status = ?');
    values.push(updates.status ?? 'draft');
  }
  if ('sessionId' in updates) {
    fields.push('sessionId = ?');
    values.push(updates.sessionId ?? null);
  }
  if ('favorite' in updates) {
    fields.push('favorite = ?');
    values.push(updates.favorite ? 1 : 0);
  }
  if ('synced' in updates) {
    fields.push('synced = ?');
    values.push(updates.synced ? 1 : 0);
  }
  if ('aiData' in updates) {
    fields.push('aiData = ?');
    values.push(JSON.stringify(updates.aiData ?? null));
  }

  if (!fields.length) return;

  await db.runAsync(`UPDATE finds SET ${fields.join(', ')} WHERE id = ?;`, ...values, id);
}

export async function listFinds(options?: { sessionId?: string | null; status?: 'draft' | 'cataloged' | 'all' }): Promise<FindRecord[]> {
  const { sessionId, status } = options ?? {};
  let query = 'SELECT * FROM finds';
  const params: Array<string | null> = [];
  const conditions: string[] = [];

  if (sessionId === null) {
    conditions.push('sessionId IS NULL');
  } else if (typeof sessionId === 'string') {
    conditions.push('sessionId = ?');
    params.push(sessionId);
  }

  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY datetime(timestamp) DESC;';

  const result = await db.getAllAsync<{
    id: string;
    photoUri: string;
    lat: number | null;
    long: number | null;
    timestamp: string;
    synced: number;
    note: string | null;
    category: string | null;
    label: string | null;
    status: 'draft' | 'cataloged' | null;
    sessionId: string | null;
    favorite: number | null;
    aiData: string | null;
  }>(query, ...params);

  return result.map((row) => ({
    id: row.id,
    photoUri: row.photoUri,
    lat: row.lat,
    long: row.long,
    timestamp: row.timestamp,
    synced: row.synced === 1,
    note: row.note,
    category: row.category,
    label: row.label,
    status: (row.status as 'draft' | 'cataloged') ?? 'draft',
    sessionId: row.sessionId ?? null,
    favorite: row.favorite === 1,
    aiData: row.aiData ? JSON.parse(row.aiData) : null,
  }));
}

export async function getFind(id: string): Promise<FindRecord | null> {
  const rows = await db.getAllAsync<{
    id: string;
    photoUri: string;
    lat: number | null;
    long: number | null;
    timestamp: string;
    synced: number;
    note: string | null;
    category: string | null;
    label: string | null;
    status: 'draft' | 'cataloged' | null;
    sessionId: string | null;
    favorite: number | null;
    aiData: string | null;
  }>('SELECT * FROM finds WHERE id = ? LIMIT 1', id);
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    id: row.id,
    photoUri: row.photoUri,
    lat: row.lat,
    long: row.long,
    timestamp: row.timestamp,
    synced: row.synced === 1,
    note: row.note,
    category: row.category,
    label: row.label,
    status: (row.status as 'draft' | 'cataloged') ?? 'draft',
    sessionId: row.sessionId ?? null,
    favorite: row.favorite === 1,
    aiData: row.aiData ? JSON.parse(row.aiData) : null,
  };
}

export async function deleteFind(id: string) {
  const rows = await db.getAllAsync<{ sessionId: string | null }>(`SELECT sessionId FROM finds WHERE id = ? LIMIT 1;`, id);
  const row = rows[0];
  if (row?.sessionId) {
    await removeFindFromSession(row.sessionId, id, { skipFindUpdate: true });
  }
  await db.runAsync(`DELETE FROM finds WHERE id = ?;`, id);
}

export async function clearAllDataForDev() {
  if (!__DEV__) {
    throw new Error('clearAllDataForDev is only available in development builds.');
  }
  await db.execAsync('DELETE FROM finds;');
  await db.execAsync('DELETE FROM sessions;');
}

export async function createSession(session: Session) {
  await db.runAsync(
    `
    INSERT INTO sessions (id, name, startTime, endTime, locationName, status, finds)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    session.id,
    session.name,
    session.startTime,
    session.endTime ?? null,
    session.locationName ?? null,
    session.status,
    JSON.stringify(session.finds ?? [])
  );
}

export async function updateSession(session: Session) {
  await db.runAsync(
    `
    UPDATE sessions
    SET name = ?, startTime = ?, endTime = ?, locationName = ?, status = ?, finds = ?
    WHERE id = ?;
    `,
    session.name,
    session.startTime,
    session.endTime ?? null,
    session.locationName ?? null,
    session.status,
    JSON.stringify(session.finds ?? []),
    session.id
  );
}

export async function listSessions(): Promise<Session[]> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    startTime: number;
    endTime: number | null;
    locationName: string | null;
    status: 'active' | 'complete';
    finds: string | null;
  }>(`SELECT * FROM sessions ORDER BY startTime DESC;`);

  return rows.map(mapSessionRow);
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    startTime: number;
    endTime: number | null;
    locationName: string | null;
    status: 'active' | 'complete';
    finds: string | null;
  }>(`SELECT * FROM sessions WHERE id = ? LIMIT 1;`, sessionId);
  const row = rows[0];
  if (!row) return null;
  return mapSessionRow(row);
}

export async function addFindToSession(sessionId: string, findId: string) {
  const session = await getSession(sessionId);
  if (!session) return null;
  const nextFinds = session.finds.includes(findId) ? session.finds : [...session.finds, findId];
  const updated: Session = { ...session, finds: nextFinds };
  await updateSession(updated);
  await updateFindMetadata(findId, { sessionId });
  return updated;
}

export async function removeFindFromSession(sessionId: string, findId: string, options?: { skipFindUpdate?: boolean }) {
  const session = await getSession(sessionId);
  if (!session) return null;
  const nextFinds = session.finds.filter((id) => id !== findId);
  const updated: Session = { ...session, finds: nextFinds };
  await updateSession(updated);
  if (!options?.skipFindUpdate) {
    await updateFindMetadata(findId, { sessionId: null });
  }
  return updated;
}

export async function endSession(sessionId: string, endTime: number, name?: string) {
  const session = await getSession(sessionId);
  if (!session) return null;
  const updated: Session = {
    ...session,
    endTime,
    status: 'complete',
    name: name?.trim() ? name.trim() : session.name,
  };
  await updateSession(updated);
  return updated;
}

function mapSessionRow(row: {
  id: string;
  name: string;
  startTime: number;
  endTime: number | null;
  locationName: string | null;
  status: 'active' | 'complete';
  finds: string | null;
}): Session {
  let parsedFinds: string[] = [];
  if (row.finds) {
    try {
      const maybe = JSON.parse(row.finds);
      if (Array.isArray(maybe)) parsedFinds = maybe.filter((id): id is string => typeof id === 'string');
    } catch (error) {
      console.warn('Failed to parse session finds', error);
    }
  }
  return {
    id: row.id,
    name: row.name,
    startTime: row.startTime,
    endTime: row.endTime ?? undefined,
    locationName: row.locationName ?? undefined,
    status: row.status,
    finds: parsedFinds,
  };
}
