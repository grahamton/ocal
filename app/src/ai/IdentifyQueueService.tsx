import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {AppState} from 'react-native';
import * as Network from 'expo-network';
import {identifyFind, RangerOfflineError} from '@/ai/ranger';
import * as localDb from '@/shared/localDb';
import {logger} from '@/shared/LogService';

/**
 * Self-healing identification queue.
 *
 * - New finds land as `draft` and are picked up automatically.
 * - No signal / Worker hiccup: the find goes back to `draft` with an aiError
 *   note, and is retried when the app comes to the foreground, the network
 *   comes back, or every few minutes while open.
 * - A real error (bad photo, rejected request) marks `ai_analysis_failed`;
 *   `retry(id)` puts it back in line.
 */

const RETRY_EVERY_MS = 3 * 60 * 1000;

type QueueApi = {retry: (findId: string) => Promise<void>};

const IdentifyQueueContext = createContext<QueueApi | undefined>(undefined);

export const IdentifyQueueProvider = ({children}: {children: ReactNode}) => {
  const inFlight = useRef(new Set<string>());

  const process = useCallback(async (findId: string) => {
    if (inFlight.current.has(findId)) return;
    inFlight.current.add(findId);
    try {
      const find = await localDb.getFind(findId);
      if (!find || find.card) return;
      await localDb.updateFind(findId, {status: 'pending_ai_analysis'});
      const {card, model} = await identifyFind(find);
      await localDb.updateFind(findId, {
        card,
        cardModel: model,
        label: find.label || card.name,
        category: card.kind,
        aiError: null,
        status: 'cataloged',
      });
      logger.add('ai', 'Ranger Al identified a find', {findId, name: card.name});
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const offline = error instanceof RangerOfflineError;
      logger.error(`IdentifyQueue: ${offline ? 'deferred' : 'failed'} ${findId}`, {msg});
      await localDb
        .updateFind(findId, {
          status: offline ? 'draft' : 'ai_analysis_failed',
          aiError: msg,
        })
        .catch(() => undefined);
    } finally {
      inFlight.current.delete(findId);
    }
  }, []);

  // Retry everything that still needs Al: deferred drafts and anything left
  // "pending" because the app was closed mid-request.
  const sweep = useCallback(async () => {
    const finds = await localDb.getAllFinds().catch(() => []);
    finds
      .filter(f => !f.card && (f.status === 'draft' || f.status === 'pending_ai_analysis'))
      .forEach(f => process(f.id));
  }, [process]);

  const retry = useCallback(
    async (findId: string) => {
      await localDb.updateFind(findId, {status: 'draft', aiError: null});
    },
    [],
  );

  useEffect(() => {
    sweep();

    // Fresh drafts (no aiError yet) start right away. Deferred ones wait for
    // a sweep, so an offline failure can't loop on its own write.
    const unsubscribe = localDb.subscribeToFinds(
      finds =>
        finds
          .filter(f => f.status === 'draft' && !f.card && !f.aiError)
          .forEach(f => process(f.id)),
      error => logger.error('IdentifyQueue: subscription failed', {error}),
    );

    const appState = AppState.addEventListener('change', s => {
      if (s === 'active') sweep();
    });
    const network = Network.addNetworkStateListener(({isInternetReachable}) => {
      if (isInternetReachable) sweep();
    });
    const timer = setInterval(sweep, RETRY_EVERY_MS);

    return () => {
      unsubscribe();
      appState.remove();
      network.remove();
      clearInterval(timer);
    };
  }, [process, sweep]);

  return (
    <IdentifyQueueContext.Provider value={{retry}}>
      {children}
    </IdentifyQueueContext.Provider>
  );
};

export const useIdentifyQueue = () => {
  const context = useContext(IdentifyQueueContext);
  if (!context) {
    throw new Error('useIdentifyQueue must be used within an IdentifyQueueProvider');
  }
  return context;
};

export default useIdentifyQueue;
