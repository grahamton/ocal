/**
 * db.ts — Transitional SQLite read layer.
 *
 * Purpose: Provides read access to the legacy `ocal.db` SQLite database so
 * that MigrationService can move tester data to Firestore.
 *
 * IMPORTANT: This file is intentionally temporary. Once all testers have run
 * the migration (ocal_migration_done flag set), this file and expo-sqlite can
 * be removed in a future cleanup release.
 *
 * Schema (from original db.ts, recovered from git history):
 *   finds: id, photoUri, lat, long, timestamp, synced, note, category, label,
 *          status, sessionId, favorite, aiData (JSON string)
 *   sessions: id, name, startTime, endTime, locationName, status, finds (JSON string array)
 */

import * as SQLite from 'expo-sqlite';
import {FindRecord, Session} from './types';

const DB_NAME = 'ocal.db';

let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DB_NAME);
  }
  return _db;
}

// --- Finds ---

export type FindFilter = {
  sessionId?: string;
  status?: string;
};

export async function listFinds(filter?: FindFilter): Promise<FindRecord[]> {
  const db = getDb();
  let query = 'SELECT * FROM finds WHERE 1=1';
  const params: (string | number)[] = [];

  if (filter?.sessionId) {
    query += ' AND sessionId = ?';
    params.push(filter.sessionId);
  }
  if (filter?.status && filter.status !== 'all') {
    query += ' AND status = ?';
    params.push(filter.status);
  }

  query += ' ORDER BY timestamp DESC';

  const rows = db.getAllSync<Record<string, unknown>>(query, params);

  return rows.map(row => ({
    id: row.id as string,
    photoUri: row.photoUri as string,
    lat: row.lat != null ? Number(row.lat) : null,
    long: row.long != null ? Number(row.long) : null,
    timestamp: row.timestamp as string,
    note: (row.note as string) ?? null,
    category: (row.category as string) ?? null,
    label: (row.label as string) ?? null,
    status: row.status as FindRecord['status'],
    sessionId: (row.sessionId as string) ?? null,
    favorite: Boolean(row.favorite),
    aiData: row.aiData
      ? (() => {
          try {
            return JSON.parse(row.aiData as string);
          } catch {
            return null;
          }
        })()
      : null,
  }));
}

export async function listSessions(): Promise<Session[]> {
  const db = getDb();
  const rows = db.getAllSync<Record<string, unknown>>(
    'SELECT * FROM sessions ORDER BY startTime DESC',
    [],
  );

  return rows.map(row => ({
    id: row.id as string,
    name: row.name as string,
    startTime: Number(row.startTime),
    endTime: row.endTime != null ? Number(row.endTime) : undefined,
    locationName: (row.locationName as string) ?? undefined,
    status: row.status as Session['status'],
    finds: (() => {
      try {
        return JSON.parse((row.finds as string) ?? '[]');
      } catch {
        return [];
      }
    })(),
  }));
}

export async function updateFindMetadata(
  id: string,
  updates: Partial<FindRecord>,
): Promise<void> {
  const db = getDb();
  const fields = Object.keys(updates)
    .filter(k => k !== 'id')
    .map(k => `${k} = ?`)
    .join(', ');
  const values = Object.entries(updates)
    .filter(([k]) => k !== 'id')
    .map(([, v]) => (typeof v === 'boolean' ? (v ? 1 : 0) : v));

  if (!fields) return;
  db.runSync(`UPDATE finds SET ${fields} WHERE id = ?`, [...values, id]);
}

// --- Write stubs (redirected — new writes go to Firestore, not SQLite) ---

export async function insertFind(_find: FindRecord): Promise<void> {
  // No-op: ImportService now writes to Firestore via addFind().
  // This stub satisfies the import contract during transition.
}

export async function createSession(_session: Session): Promise<void> {
  // No-op: new sessions are created in Firestore directly.
}

// --- Dev utilities ---

export async function clearAllDataForDev(): Promise<void> {
  if (!__DEV__) {
    throw new Error('clearAllDataForDev is only available in development builds.');
  }
  const db = getDb();
  db.runSync('DELETE FROM finds', []);
  db.runSync('DELETE FROM sessions', []);
}
