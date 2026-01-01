import * as SQLite from 'expo-sqlite';
import * as Network from 'expo-network';
import { identifyRock } from './identifyRock';
import { updateFindMetadata, listFinds } from '../shared/db';
import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '../shared/LogService';
import { AnalyticsService } from '../shared/AnalyticsService';

const db = SQLite.openDatabaseSync('ocal.db');

export type QueueItem = {
  id: number;
  findId: string;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  attempts: number;
  lastAttempt: number | null;
  error: string | null;
};

export class IdentifyQueueService {
  private static isProcessing = false;

  static async addToQueue(findId: string) {
    // Check if already in queue
    const existing = await db.getAllAsync(
      'SELECT id FROM find_queue WHERE findId = ? AND status IN (?, ?)',
      findId, 'pending', 'processing'
    );

    if (existing.length > 0) return; // Already queued

    await db.runAsync(
      'INSERT INTO find_queue (findId, status, attempts, lastAttempt) VALUES (?, ?, ?, ?)',
      findId, 'pending', 0, Date.now()
    );

    // Trigger process attempt immediately
    this.processQueue();
  }

  static async getQueueStatus(findId: string): Promise<QueueItem | null> {
    const rows = await db.getAllAsync<QueueItem>(
      'SELECT * FROM find_queue WHERE findId = ? ORDER BY id DESC LIMIT 1',
      findId
    );
    return rows[0] || null;
  }

  static async processQueue() {
    if (this.isProcessing) return;

    const net = await Network.getNetworkStateAsync();
    if (!net.isConnected || !net.isInternetReachable) {
      logger.add('system', 'Queue processing paused: Offline');
      return;
    }

    this.isProcessing = true;

    try {
      // Fetch next pending item
      const rows = await db.getAllAsync<QueueItem>(
        'SELECT * FROM find_queue WHERE status = ? ORDER BY lastAttempt ASC LIMIT 1',
        'pending'
      );

      if (rows.length === 0) {
        this.isProcessing = false;
        return;
      }

      const item = rows[0];
      await this.processItem(item);

      // Keep processing if there are more
      // Keep processing if there are more, with a small delay to respect rate limits
      this.isProcessing = false;
      setTimeout(() => this.processQueue(), 1000);

    } catch (e) {
      logger.error('Queue processing error', e);
      this.isProcessing = false;
    }
  }

  private static async processItem(item: QueueItem) {
    try {
      // Mark as processing
      await db.runAsync(
        'UPDATE find_queue SET status = ? WHERE id = ?',
        'processing', item.id
      );

      // 1. Get Find Data
      // optimizing: we could just select the fields we need
      // but listFinds is handy, though it gets all.
      // Let's query directly for speed/efficiency
      const finds = await listFinds();
      const find = finds.find(f => f.id === item.findId);

      if (!find) {
        // Find deleted? Mark failed/completed
         await db.runAsync(
          'UPDATE find_queue SET status = ? WHERE id = ?',
          'failed', item.id
        );
        return;
      }

      // 2. Prepare Payload
       const fileData = await FileSystem.readAsStringAsync(find.photoUri, { encoding: FileSystem.EncodingType.Base64 });
       const dataUrl = `data:image/jpeg;base64,${fileData}`;

       // 3. Call AI
       const result = await identifyRock({
          provider: 'gemini', // OpenAI quota exceeded, using Gemini
          imageDataUrls: [dataUrl],
          locationHint: find.lat && find.long ? `${find.lat}, ${find.long}` : null,
          contextNotes: find.note || find.label || 'Field find',
          userGoal: 'quick_id' // could store this in queue if needed
       });

       // 4. Save Result
       await updateFindMetadata(find.id, {
         aiData: result,
         // Auto-apply label if high confidence?
         // For now, let's just store it and let user apply.
         // Or maybe we add a 'pending_review' flag?
         // Let's stick to just saving aiData.
       });

       // 5. Cleanup Queue
       await db.runAsync('DELETE FROM find_queue WHERE id = ?', item.id);

       logger.add('ai', 'Queue item processed successfully', { findId: find.id });
       AnalyticsService.logEvent('ai_identify_success', {
         confidence: result.best_guess.confidence,
         category: result.best_guess.category
       });

    } catch (error) {
      const msg = (error as Error).message || String(error);
      logger.error(`Process Item Error: ${msg}`, error);

      AnalyticsService.logEvent('ai_identify_failed', { error: msg });

      // Update retry count
      const nextAttempts = item.attempts + 1;
      const status = nextAttempts >= 3 ? 'failed' : 'pending';

      await db.runAsync(
        'UPDATE find_queue SET status = ?, attempts = ?, lastAttempt = ?, error = ? WHERE id = ?',
        status, nextAttempts, Date.now(), msg, item.id
      );
    }
  }
}
