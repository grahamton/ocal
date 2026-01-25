import { useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { identifyRock } from '@/ai/identifyRock';
import * as firestoreService from '@/shared/firestoreService';
import { logger } from '@/shared/LogService';
import { AnalyticsService } from '@/shared/AnalyticsService';
import { useAuth } from '@/shared/AuthContext';
import { useSession } from '@/shared/SessionContext';
import { Session } from '@/shared/types';

export const useIdentifyQueue = () => {
  const { user } = useAuth();
  const { activeSession } = useSession();

  const addToQueue = useCallback(async (findId: string) => {
    if (!user) {
      logger.error('IdentifyQueue: No authenticated user to process queue.');
      return;
    }

    try {
      // 1. Mark Find as Processing in Firestore
      await firestoreService.updateFind(findId, { status: 'pending_ai_analysis' });

      // 2. Get Find Data from Firestore (fresh state)
      const find = await firestoreService.getFind(findId);
      if (!find) {
        logger.error('IdentifyQueue: Find not found in Firestore', { findId });
        return;
      }

      // 3. Fetch image data from Cloud Storage URL
      // Since photoUri is now a Cloud Storage URL, we can fetch it.
      // We assume it's publicly accessible, or we'd need signed URLs.
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
      // The sessionContext will now be the full Session object
      const sessionContextForAI: Session | null = activeSession ? {
        id: activeSession.id,
        name: activeSession.name,
        startTime: activeSession.startTime,
        locationName: activeSession.locationName,
        finds: [], // We don't need to send the finds array for AI context
        status: activeSession.status,
        endTime: activeSession.endTime,
      } : null;

      const analysisEvent = await identifyRock({
        provider: 'gemini',
        imageDataUrls: [dataUrl],
        locationHint: find.lat && find.long ? `${find.lat}, ${find.long}` : null,
        contextNotes: find.note || find.label || 'Field find',
        userGoal: 'quick_id',
        sessionContext: sessionContextForAI,
        temperature: 0.7,
      });

      // 5. Save Result (Store full AnalysisEvent for traceability)
      await firestoreService.updateFind(findId, {
        aiData: analysisEvent,
        status: 'cataloged', // Mark as cataloged after AI processing
      });

      logger.add('ai', 'Find processed successfully by AI', { findId, aiResult: analysisEvent.result.best_guess?.label });
      AnalyticsService.logEvent('ai_identify_success', {
        confidence: analysisEvent.result.best_guess?.confidence,
        category: analysisEvent.result.best_guess?.category,
      });

      // Notify UI
      DeviceEventEmitter.emit('AI_IDENTIFY_SUCCESS', { findId: find.id });

    } catch (error) {
      const msg = (error as Error).message || String(error);
      logger.error(`IdentifyQueue: Failed to process find ${findId}`, error);

      AnalyticsService.logEvent('ai_identify_failed', { error: msg, findId });

      // Update Find status to indicate failure
      await firestoreService.updateFind(findId, {
        status: 'ai_analysis_failed',
        aiData: {
          result: null, // Clear any partial AI data
          meta: {
            schemaVersion: '0.0.0', // Placeholder
            aiModel: 'unknown',     // Placeholder
            aiModelVersion: 'unknown', // Placeholder
            promptHash: 'na',       // Placeholder
            pipelineVersion: '0.0.0', // Placeholder
            runId: `failed-${findId}`, // Unique ID for failed run
            timestamp: new Date().toISOString(),
            error: msg,
          },
          input: {
            sourceImages: [],
            locationUsed: !!find?.location_text,
            userGoal: find?.userGoal || 'quick_id',
          },
        },
      });

      // Notify UI (if needed, or UI can listen to Firestore changes)
      DeviceEventEmitter.emit('AI_IDENTIFY_FAILED', { findId: find.id, error: msg });
    }
  }, [user, activeSession]); // Dependencies for useCallback

  return { addToQueue };
};