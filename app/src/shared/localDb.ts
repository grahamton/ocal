import * as SQLite from 'expo-sqlite';
import {DeviceEventEmitter} from 'react-native';
import {FindRecord, Session} from '@/shared/types';
import {logger} from '@/shared/LogService';

// Local, offline-only replacement for the old Firestore-backed data layer.
// Everything is stored on-device in SQLite; there is no cloud sync and no
// per-user scoping since the app has no auth/login concept anymore.

// Not 'ocal.db': tester devices may still have the legacy SQLite file with
// an incompatible `finds`/`sessions` schema that CREATE IF NOT EXISTS skips.
const DB_NAME = 'ocal_v2.db';
const FINDS_CHANGED_EVENT = 'ocal:finds-changed';
const SESSIONS_CHANGED_EVENT = 'ocal:sessions-changed';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS finds (
          id TEXT PRIMARY KEY NOT NULL,
          timestamp TEXT NOT NULL,
          data TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY NOT NULL,
          startTime INTEGER NOT NULL,
          data TEXT NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
};

// Read-modify-write updates (get → merge in JS → write) must not interleave,
// or a concurrent update (e.g. AI result vs. user label edit) gets clobbered.
let writeChain: Promise<unknown> = Promise.resolve();
const serialize = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = writeChain.then(fn, fn);
  writeChain = next.catch(() => undefined);
  return next;
};

// --- FindRecord Operations ---

export const addFind = async (find: FindRecord): Promise<FindRecord> => {
  try {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO finds (id, timestamp, data) VALUES (?, ?, ?)',
      find.id,
      find.timestamp,
      JSON.stringify(find),
    );
    logger.add('localDb', `Find added: ${find.id}`);
    DeviceEventEmitter.emit(FINDS_CHANGED_EVENT);
    return find;
  } catch (error) {
    logger.error('LocalDb: Failed to add find', {findId: find.id, error});
    throw error;
  }
};

export const updateFind = (
  findId: string,
  updates: Partial<FindRecord>,
): Promise<void> => serialize(() => updateFindUnsafe(findId, updates));

const updateFindUnsafe = async (
  findId: string,
  updates: Partial<FindRecord>,
): Promise<void> => {
  try {
    const existing = await getFind(findId);
    if (!existing) {
      logger.error('LocalDb: Cannot update find - not found', {findId});
      return;
    }
    const merged: FindRecord = {...existing, ...updates};
    const db = await getDb();
    await db.runAsync(
      'UPDATE finds SET timestamp = ?, data = ? WHERE id = ?',
      merged.timestamp,
      JSON.stringify(merged),
      findId,
    );
    logger.add('localDb', `Find updated: ${findId}`);
    DeviceEventEmitter.emit(FINDS_CHANGED_EVENT);
  } catch (error) {
    logger.error('LocalDb: Failed to update find', {findId, updates, error});
    throw error;
  }
};

export const deleteFind = async (findId: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM finds WHERE id = ?', findId);
    logger.add('localDb', `Find deleted: ${findId}`);
    DeviceEventEmitter.emit(FINDS_CHANGED_EVENT);
  } catch (error) {
    logger.error('LocalDb: Failed to delete find', {findId, error});
    throw error;
  }
};

export const getAllFinds = async (): Promise<FindRecord[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{data: string}>(
      'SELECT data FROM finds ORDER BY timestamp DESC',
    );
    return rows.map(row => JSON.parse(row.data) as FindRecord);
  } catch (error) {
    logger.error('LocalDb: Error getting all finds', {error});
    throw error;
  }
};

export const getFind = async (findId: string): Promise<FindRecord | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{data: string}>(
      'SELECT data FROM finds WHERE id = ?',
      findId,
    );
    return row ? (JSON.parse(row.data) as FindRecord) : null;
  } catch (error) {
    logger.error('LocalDb: Failed to get find', {findId, error});
    throw error;
  }
};

// Subscriptions are simulated: on any local write, re-query and notify.
export const subscribeToFind = (
  findId: string,
  callback: (find: FindRecord | null) => void,
  onError: (error: Error) => void,
) => {
  const push = () => {
    getFind(findId).then(callback).catch(onError);
  };
  push();
  const sub = DeviceEventEmitter.addListener(FINDS_CHANGED_EVENT, push);
  return () => sub.remove();
};

export const subscribeToFinds = (
  callback: (finds: FindRecord[]) => void,
  onError: (error: Error) => void,
) => {
  const push = () => {
    getAllFinds().then(callback).catch(onError);
  };
  push();
  const sub = DeviceEventEmitter.addListener(FINDS_CHANGED_EVENT, push);
  return () => sub.remove();
};

// --- Session Operations ---

export const addSession = async (session: Session): Promise<Session> => {
  try {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO sessions (id, startTime, data) VALUES (?, ?, ?)',
      session.id,
      session.startTime,
      JSON.stringify(session),
    );
    logger.add('localDb', `Session added: ${session.id}`);
    DeviceEventEmitter.emit(SESSIONS_CHANGED_EVENT);
    return session;
  } catch (error) {
    logger.error('LocalDb: Failed to add session', {
      sessionId: session.id,
      error,
    });
    throw error;
  }
};

export const updateSession = (
  sessionId: string,
  updates: Partial<Session>,
): Promise<void> => serialize(() => updateSessionUnsafe(sessionId, updates));

const updateSessionUnsafe = async (
  sessionId: string,
  updates: Partial<Session>,
): Promise<void> => {
  try {
    const existing = await getSession(sessionId);
    if (!existing) {
      logger.error('LocalDb: Cannot update session - not found', {
        sessionId,
      });
      return;
    }
    const merged: Session = {...existing, ...updates};
    const db = await getDb();
    await db.runAsync(
      'UPDATE sessions SET startTime = ?, data = ? WHERE id = ?',
      merged.startTime,
      JSON.stringify(merged),
      sessionId,
    );
    logger.add('localDb', `Session updated: ${sessionId}`);
    DeviceEventEmitter.emit(SESSIONS_CHANGED_EVENT);
  } catch (error) {
    logger.error('LocalDb: Failed to update session', {
      sessionId,
      updates,
      error,
    });
    throw error;
  }
};

export const addFindToSession = (
  sessionId: string,
  findId: string,
): Promise<void> => serialize(() => addFindToSessionUnsafe(sessionId, findId));

const addFindToSessionUnsafe = async (
  sessionId: string,
  findId: string,
): Promise<void> => {
  try {
    const existing = await getSession(sessionId);
    if (!existing) {
      logger.error('LocalDb: Cannot add find to session - not found', {
        sessionId,
      });
      return;
    }
    if (existing.finds.includes(findId)) return;
    await updateSessionUnsafe(sessionId, {finds: [...existing.finds, findId]});
    logger.add('localDb', `Added find ${findId} to session ${sessionId}`);
  } catch (error) {
    logger.error('LocalDb: Failed to add find to session', {
      sessionId,
      findId,
      error,
    });
    throw error;
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM sessions WHERE id = ?', sessionId);
    logger.add('localDb', `Session deleted: ${sessionId}`);
    DeviceEventEmitter.emit(SESSIONS_CHANGED_EVENT);
  } catch (error) {
    logger.error('LocalDb: Failed to delete session', {sessionId, error});
    throw error;
  }
};

export const subscribeToSessions = (
  callback: (sessions: Session[]) => void,
  onError: (error: Error) => void,
) => {
  const push = () => {
    getAllSessions().then(callback).catch(onError);
  };
  push();
  const sub = DeviceEventEmitter.addListener(SESSIONS_CHANGED_EVENT, push);
  return () => sub.remove();
};

export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<{data: string}>(
      'SELECT data FROM sessions ORDER BY startTime DESC',
    );
    return rows.map(row => JSON.parse(row.data) as Session);
  } catch (error) {
    logger.error('LocalDb: Error getting all sessions', {error});
    throw error;
  }
};

export const getSession = async (
  sessionId: string,
): Promise<Session | null> => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{data: string}>(
      'SELECT data FROM sessions WHERE id = ?',
      sessionId,
    );
    return row ? (JSON.parse(row.data) as Session) : null;
  } catch (error) {
    logger.error('LocalDb: Failed to get session', {sessionId, error});
    throw error;
  }
};
