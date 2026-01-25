import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import * as firestoreService from '@/shared/firestoreService';
import {createId} from '@/shared/id';
import {Session} from '@/shared/types';
import {useAuth} from '@/shared/AuthContext';

type SessionContextValue = {
  sessions: Session[];
  activeSession: Session | null;
  startSession: (name?: string, locationName?: string) => Promise<Session>;
  endSession: (name?: string) => Promise<void>;
  renameSession: (sessionId: string, newName: string) => Promise<void>;
  endSessionById: (sessionId: string, name?: string) => Promise<void>;
  addFindToActiveSession: (
    findId: string,
    sessionIdOverride?: string,
  ) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export function SessionProvider({children}: {children: ReactNode}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const {user} = useAuth();

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setActiveSession(null);
      return;
    }

    const unsubscribe = firestoreService.subscribeToSessions(
      newSessions => {
        setSessions(newSessions);
        const active =
          newSessions.find(session => session.status === 'active') ?? null;
        setActiveSession(active);
      },
      error => {
        console.error('Failed to subscribe to sessions', error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const startSession = useCallback(
    async (name?: string, locationName?: string) => {
      const now = Date.now();

      let fallbackName = `Beach Session ${new Date(now).toLocaleDateString()}`;
      if (!name) {
        const hour = new Date(now).getHours();
        const dateStr = new Date(now).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

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

      await firestoreService.addSession(newSession);
      // No need to manually set state, the listener will do it.
      return newSession;
    },
    [],
  );

  const endSession = useCallback(
    async (name?: string) => {
      if (!activeSession) return;
      const updates: Partial<Session> = {
        status: 'complete',
        endTime: Date.now(),
      };
      if (name) {
        updates.name = name;
      }
      await firestoreService.updateSession(activeSession.id, updates);
      // No need to manually set state, the listener will do it.
    },
    [activeSession],
  );

  const renameSession = useCallback(
    async (sessionId: string, newName: string) => {
      await firestoreService.updateSession(sessionId, {name: newName});
      // No need to manually set state, the listener will do it.
    },
    [],
  );

  const endSessionById = useCallback(
    async (sessionId: string, name?: string) => {
      const updates: Partial<Session> = {
        status: 'complete',
        endTime: Date.now(),
      };
      if (name) {
        updates.name = name;
      }
      await firestoreService.updateSession(sessionId, updates);
      // No need to manually set state, the listener will do it.
    },
    [],
  );

  const addFindToActiveSession = useCallback(
    async (findId: string, sessionIdOverride?: string) => {
      const sessionId = sessionIdOverride ?? activeSession?.id;
      if (!sessionId) return;
      await firestoreService.addFindToSession(sessionId, findId);
      // No need to manually set state, the listener will do it.
    },
    [activeSession],
  );

  const value = useMemo(
    () => ({
      sessions,
      activeSession,
      startSession,
      endSession,
      endSessionById,
      addFindToActiveSession,
      renameSession,
      // refreshSessions is removed as data is now real-time
    }),
    [
      sessions,
      activeSession,
      startSession,
      endSession,
      endSessionById,
      addFindToActiveSession,
      renameSession,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('SessionContext missing');
  }
  return ctx;
}