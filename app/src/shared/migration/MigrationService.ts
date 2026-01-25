import { listFinds, listSessions } from '../db';
import * as firestoreService from '../firestoreService';
import * as storageService from '../storageService';
import { logger } from '../LogService';

export type MigrationProgress = {
  total: number;
  completed: number;
  status: 'starting' | 'migrating' | 'complete' | 'error';
  error?: string;
};

class MigrationService {
  public async migrateData(onProgress: (progress: MigrationProgress) => void) {
    onProgress({ total: 0, completed: 0, status: 'starting' });

    try {
      const finds = await listFinds();
      const sessions = await listSessions();
      const totalItems = finds.length + sessions.length;
      let completedItems = 0;

      onProgress({ total: totalItems, completed: 0, status: 'migrating' });

      // Migrate Finds
      for (const find of finds) {
        try {
          const downloadURL = await storageService.uploadImage(find.photoUri);
          const newFind = { ...find, photoUri: downloadURL, synced: true };
          await firestoreService.addFind(newFind);
          completedItems++;
          onProgress({ total: totalItems, completed: completedItems, status: 'migrating' });
        } catch (error) {
          logger.error('MigrationService: Failed to migrate find', { findId: find.id, error });
          // Optionally, you could collect failed items to show the user
        }
      }

      // Migrate Sessions
      for (const session of sessions) {
        try {
          await firestoreService.addSession(session);
          completedItems++;
          onProgress({ total: totalItems, completed: completedItems, status: 'migrating' });
        } catch (error) {
          logger.error('MigrationService: Failed to migrate session', { sessionId: session.id, error });
        }
      }

      onProgress({ total: totalItems, completed: completedItems, status: 'complete' });
      logger.add('migration', `Data migration complete. Migrated ${completedItems} items.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      logger.error('MigrationService: Data migration failed', { error });
      onProgress({ total: 0, completed: 0, status: 'error', error: errorMessage });
    }
  }
}

export const migrationService = new MigrationService();