import { ReactNode, createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { addFindToSession, createSession, endSession as endSessionDb, listSessions, updateSession } from './db';
import { createId } from './id';
import { Session } from './types';

type SessionContextValue = {
  sessions: Session[];
  activeSession: Session | null;
  startSession: (name?: string, locationName?: string) => Promise<Session>;
  endSession: (name?: string) => Promise<Session | null>;
  renameSession: (sessionId: string, newName: string) => Promise<void>;
  endSessionById: (sessionId: string, name?: string) => Promise<Session | null>;
  refreshSessions: () => Promise<void>;
  addFindToActiveSession: (findId: string, sessionIdOverride?: string) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const refreshSessions = useCallback(async () => {
    const rows = await listSessions();
    setSessions(rows);
    const active = rows.find((session) => session.status === 'active') ?? null;
    setActiveSession(active);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSessions();
  }, [refreshSessions]);

  const startSession = useCallback(
    async (name?: string, locationName?: string) => {
      const now = Date.now();

      let fallbackName = `Beach Session ${new Date(now).toLocaleDateString()}`;
      if (!name) {
        const hour = new Date(now).getHours();
        const dateStr = new Date(now).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        if (hour < 12) fallbackName = `Morning Walk (${dateStr})`;
        else if (hour < 17) fallbackName = `Afternoon Walk (${dateStr})`;
        else fallbackName = `Evening Walk (${dateStr})`;
      }

      const sessionName = name?.trim() || fallbackName;
      const newSession: Session = {
        id: createId('session'),
        name: sessionName,
        startTime: now,
        status: 'active',
        locationName: locationName?.trim() || undefined,
        finds: [],
      };
      await createSession(newSession);
      setActiveSession(newSession);
      setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
      return newSession;
    },
    []
  );

  const endSession = useCallback(
    async (name?: string) => {
      if (!activeSession) return null;
      const ended = await endSessionDb(activeSession.id, Date.now(), name);
      setActiveSession(null);
      await refreshSessions();
      return ended;
    },
    [activeSession, refreshSessions]
  );

  const renameSession = useCallback(
    async (sessionId: string, newName: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;
        const updated = { ...session, name: newName };
        await updateSession(updated);
        await refreshSessions();
    },
    [sessions, refreshSessions]
  );

  // Actually, I'll rewrite the imports in a separate replace block if needed.
  // Viewing file showed: import { addFindToSession, createSession, endSession as endSessionDb, listSessions } from './db';
  // So updateSession is NOT imported.


  const endSessionById = useCallback(
    async (sessionId: string, name?: string) => {
      const ended = await endSessionDb(sessionId, Date.now(), name);
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }
      await refreshSessions();
      return ended;
    },
    [activeSession, refreshSessions]
  );

  const addFindToActiveSession = useCallback(
    async (findId: string, sessionIdOverride?: string) => {
      const sessionId = sessionIdOverride ?? activeSession?.id;
      if (!sessionId) return;
      await addFindToSession(sessionId, findId);
      await refreshSessions();
    },
    [activeSession, refreshSessions]
  );

  const value = useMemo(
    () => ({
      sessions,
      activeSession,
      startSession,
      endSession,
      endSessionById,
      refreshSessions,
      addFindToActiveSession,
      renameSession,
    }),
    [sessions, activeSession, startSession, endSession, endSessionById, refreshSessions, addFindToActiveSession, renameSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('SessionContext missing');
  }
  return ctx;
}
