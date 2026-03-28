import { useCallback, useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { identifyRock } from '@/ai/identifyRock';
import * as firestoreService from '@/shared/firestoreService';
import { logger } from '@/shared/LogService';
import { AnalyticsService } from '@/shared/AnalyticsService';
import { useAuth } from '@/shared/AuthContext';
import { useSession } from '@/shared/SessionContext';
import { Session, FindRecord } from '@/shared/types';

export const useIdentifyQueue = () => {
  const { user } = useAuth();
  const { activeSession } = useSession();
  const processedIds = useRef(new Set<string>());

  const addToQueue = useCallback(async (findId: string) => {
    if (!user) {
      logger.error('IdentifyQueue: No authenticated user to process queue.');
      return;
    }

    if (processedIds.current.has(findId)) return;
    processedIds.current.add(findId);

    let findObj: FindRecord | null = null;

    try {
      // 1. Mark Find as Processing in Firestore (Awaited for reliability)
      await firestoreService.updateFind(findId, { status: 'pending_ai_analysis' });

      // 2. Get Find Data from Firestore (fresh state)
      const find = await firestoreService.getFind(findId);
      if (!find) {
        logger.error('IdentifyQueue: Find not found in Firestore', { findId });
        return;
      }
      findObj = find;

      // 3. Fetch image data from Cloud Storage URL
      const response = await fetch(find.photoUri);
      const blob = await response.blob();
      const reader = new FileReader();

      let dataUrl: string | null = null;
      await new Promise<void>((resolve, reject) => {
        reader.onloadend = () => {
          dataUrl = reader.result as string;
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      if (!dataUrl) {
        throw new Error('Could not convert image to data URL for AI processing.');
      }

      // 4. Prepare Payload for AI
      const sessionContextForAI: Session | null = activeSession ? {
        id: activeSession.id,
        name: activeSession.name,
        startTime: activeSession.startTime,
        locationName: activeSession.locationName,
        finds: [], 
        status: activeSession.status,
        endTime: activeSession.endTime,
      } : null;

      const analysisEvent = await identifyRock({
        provider: 'gemini',
        imageDataUrls: [dataUrl],
        locationHint: find.lat && find.long ? `${find.lat}, ${find.long}` : null,
        contextNotes: find.note || find.label || 'Field find',
        userGoal: find.userGoal || 'quick_id',
        sessionContext: sessionContextForAI,
        temperature: 0.7,
      });

      // 5. Save Result (Store full AnalysisEvent for traceability)
      await firestoreService.updateFind(findId, {
        aiData: analysisEvent,
        status: 'cataloged', 
      });

      logger.add('ai', 'Find processed successfully by AI', { findId, aiResult: analysisEvent.result?.best_guess?.label });
      AnalyticsService.logEvent('ai_identify_success', {
        confidence: analysisEvent.result?.best_guess?.confidence,
        category: analysisEvent.result?.best_guess?.category,
      });

      // Notify UI
      DeviceEventEmitter.emit('AI_IDENTIFY_SUCCESS', { findId: findObj.id });

    } catch (error) {
      const actualFindId = findObj?.id || findId;
      const msg = (error as Error).message || String(error);
      logger.error(`IdentifyQueue: Failed to process find ${actualFindId}`, error);

      AnalyticsService.logEvent('ai_identify_failed', { error: msg, findId: actualFindId });

      // Update Find status to indicate failure
      await firestoreService.updateFind(actualFindId, {
        status: 'ai_analysis_failed',
        aiData: {
          result: undefined,
          meta: {
            schemaVersion: '1.0.0', 
            aiModel: 'gemini-3.1-flash',     
            aiModelVersion: '3.1.0', 
            promptHash: 'na',       
            pipelineVersion: '1.0.0', 
            runId: `failed-${actualFindId}`, 
            timestamp: new Date().toISOString(),
            error: msg,
          },
          input: {
            sourceImages: [],
            locationUsed: !!findObj?.location_text,
            userGoal: findObj?.userGoal || 'quick_id',
          },
        },
      });

      DeviceEventEmitter.emit('AI_IDENTIFY_FAILED', { findId: actualFindId, error: msg });
    }
  }, [user, activeSession]); 

  // --- Automated "Auto-Polish" Listener ---
  useEffect(() => {
    if (!user) return;

    // Listen for new finds in 'draft' status and pick them up
    const unsubscribe = firestoreService.subscribeToFinds(
      (finds) => {
        const drafts = finds.filter(f => f.status === 'draft');
        if (drafts.length > 0) {
          logger.add('ai', `Auto-Polish: Found ${drafts.length} drafts. Picking up...`);
          drafts.forEach(f => {
            // Process sequentially or trigger individual tasks
            addToQueue(f.id);
          });
        }
      },
      (error) => {
        logger.error('Auto-Polish: Subscription failed', error);
      }
    );

    return unsubscribe;
  }, [user, addToQueue]);

  return { addToQueue };
};

export default useIdentifyQueue;