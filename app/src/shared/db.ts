import * as SQLite from 'expo-sqlite';
import { FindRecord } from './types';

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
      status TEXT DEFAULT 'draft'
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
}

export async function insertFind(record: FindRecord) {
  await db.runAsync(
    `INSERT INTO finds (id, photoUri, lat, long, timestamp, synced, note, category, label, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    record.id,
    record.photoUri,
    record.lat,
    record.long,
    record.timestamp,
    record.synced ? 1 : 0,
    record.note ?? null,
    record.category ?? null,
    record.label ?? null,
    record.status
  );
}

export async function updateFindMetadata(
  id: string,
  label: string | null,
  note: string | null,
  category: string | null,
  status: 'draft' | 'cataloged'
) {
  await db.runAsync(
    `UPDATE finds SET label = ?, note = ?, category = ?, status = ? WHERE id = ?;`,
    label ?? null,
    note ?? null,
    category ?? null,
    status,
    id
  );
}

export async function listFinds(): Promise<FindRecord[]> {
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
  }>(`SELECT * FROM finds ORDER BY datetime(timestamp) DESC;`);

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
  }));
}

export async function deleteFind(id: string) {
  await db.runAsync(`DELETE FROM finds WHERE id = ?;`, id);
}
