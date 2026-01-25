/**
 * React Native helper to call the identifyCloud function.
 *
 * - Converts a local image URI to a data URL (base64) using Expo FileSystem (works in Expo).
 * - Posts to the Cloud Function endpoint.
 * - If offline or on failure, enqueues the job locally (AsyncStorage sketch); replace with your SQLite queue.
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CuratorResult = {
  id?: string;
  labels: string[];
  confidence: number;
  context_text?: string;
  safety_flags?: string[];
  raw?: any;
};

const IDENTIFY_ENDPOINT = process.env.IDENTIFY_ENDPOINT ?? 'https://us-central1-YOUR-PROJECT.cloudfunctions.net/identifyRock';

// Convert file URI to data URL (base64). For large images use Cloud Storage signed uploads.
export async function fileUriToDataUrl(fileUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
  const ext = fileUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

export async function identifyRock(
  imageUri: string,
  coords?: { latitude?: number; longitude?: number },
  metadata?: Record<string, any>
): Promise<CuratorResult> {
  // Basic online check
  if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
    await enqueueIdentifyJob({ imageUri, coords, metadata });
    throw new Error('Offline: job enqueued for later processing');
  }

  const imageBase64 = await fileUriToDataUrl(imageUri);

  const body = {
    imageBase64,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    metadata: metadata ?? {},
  };

  const resp = await fetch(IDENTIFY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    await enqueueIdentifyJob({ imageUri, coords, metadata });
    const txt = await resp.text();
    throw new Error(`Identification failed: ${resp.status} ${txt}`);
  }

  const json = await resp.json();
  const result: CuratorResult = {
    id: json.id,
    labels: json.labels ?? ['unknown'],
    confidence: typeof json.confidence === 'number' ? json.confidence : 0,
    context_text: json.context_text ?? json.raw ?? '',
    safety_flags: json.safety_flags ?? [],
    raw: json.raw ?? json,
  };
  return result;
}

/**
 * Minimal enqueue using AsyncStorage (replace with your SQLite queue).
 */
const QUEUE_KEY = 'ocal:identify_queue';

type QueueJob = {
  id: string;
  imageUri: string;
  coords?: { latitude?: number; longitude?: number };
  metadata?: Record<string, any>;
  createdAt: number;
  attempts?: number;
};

export async function enqueueIdentifyJob(jobPartial: {
  imageUri: string;
  coords?: { latitude?: number; longitude?: number };
  metadata?: Record<string, any>;
}) {
  const job: QueueJob = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    imageUri: jobPartial.imageUri,
    coords: jobPartial.coords,
    metadata: jobPartial.metadata,
    createdAt: Date.now(),
    attempts: 0,
  };

  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const arr: QueueJob[] = raw ? JSON.parse(raw) : [];
  arr.push(job);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
  return job.id;
}

export async function processQueuedJobs() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const arr: QueueJob[] = raw ? JSON.parse(raw) : [];
  if (arr.length === 0) return;

  if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) return;

  const remaining: QueueJob[] = [];
  for (const job of arr) {
    try {
      await identifyRock(job.imageUri, job.coords, job.metadata);
    } catch (err) {
      job.attempts = (job.attempts ?? 0) + 1;
      if ((job.attempts ?? 0) < 5) {
        remaining.push(job);
      } else {
        // TODO: record permanent failure in local DB / logs
      }
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}