import {getAllFinds, updateFind} from '@/shared/firestoreService';

export interface IntegrityReport {
  totalFinds: number;
  pendingAi: number;      // Finds without aiData, not yet failed
  failedAi: number;       // Finds with status 'ai_analysis_failed'
  missingPhotos: string[]; // Find IDs where photoUri is empty/null
  scannedAt: string;
}

export class IntegrityService {
  /**
   * Scans Firestore finds and reports data health stats.
   * Photos live in Firebase Storage (not the local filesystem), so local file
   * scanning is not applicable in the Firestore architecture.
   */
  async checkIntegrity(): Promise<IntegrityReport> {
    const finds = await getAllFinds();

    const pendingAi = finds.filter(
      f => !f.aiData && f.status !== 'ai_analysis_failed',
    ).length;
    const failedAi = finds.filter(f => f.status === 'ai_analysis_failed').length;
    const missingPhotos = finds
      .filter(f => !f.photoUri || f.photoUri.trim() === '')
      .map(f => f.id);

    return {
      totalFinds: finds.length,
      pendingAi,
      failedAi,
      missingPhotos,
      scannedAt: new Date().toISOString(),
    };
  }

  /**
   * Archives finds that are missing their photo URI.
   */
  async archiveMissingPhotos(findIds: string[]): Promise<number> {
    let count = 0;
    for (const id of findIds) {
      try {
        await updateFind(id, {status: 'archived'});
        count++;
      } catch (e) {
        console.warn(`Failed to archive find: ${id}`, e);
      }
    }
    return count;
  }

  /**
   * Resets failed AI analyses so they can be retried by the queue.
   */
  async resetFailedAi(): Promise<number> {
    const finds = await getAllFinds();
    const failed = finds.filter(f => f.status === 'ai_analysis_failed');
    let count = 0;
    for (const find of failed) {
      try {
        await updateFind(find.id, {status: 'draft', aiData: null});
        count++;
      } catch (e) {
        console.warn(`Failed to reset find: ${find.id}`, e);
      }
    }
    return count;
  }
}

export const integrityService = new IntegrityService();
