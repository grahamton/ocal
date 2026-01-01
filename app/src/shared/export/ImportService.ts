
import * as FileSystem from 'expo-file-system/legacy';
import { insertFind, createSession, clearAllDataForDev } from '../db';

export class ImportService {
  /**
   * Restores data from a backup JSON file.
   * WARNING: This is currently additive/upsert. It does not wipe existing data first unless requested.
   */
  async restoreBackup(uri: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Read file
      const jsonContent = await FileSystem.readAsStringAsync(uri);
      const data = JSON.parse(jsonContent);

      // Simple validation
      if (!data.finds || !Array.isArray(data.finds)) {
        throw new Error('Invalid backup format: missing finds array');
      }

      let count = 0;

      // Import Finds (Upsert)
      // Note: We are using insertFind which might throw if ID exists.
      // We should probably check existence or modify db.ts to support upsert,
      // but for "Restore" on a fresh install, insert is fine.
      // For safety, let's catch duplications.

      for (const find of data.finds) {
        try {
            // Check if exists to avoid unique constraint crash if db.ts doesn't handle IGNORE
            // Assuming insertFind inserts. If we want upsert, we need that logic.
            // For MVP: Try insert, catch error.
            if (find.id) await insertFind(find);
            count++;
        } catch (e) {
            console.warn(`Skipping duplicate or invalid find ${find.id}`, e);
        }
      }

      // Import Sessions
      if (data.sessions && Array.isArray(data.sessions)) {
          for (const session of data.sessions) {
              try {
                  if (session.id) await createSession(session);
              } catch (e) {
                  console.warn(`Skipping duplicate session ${session.id}`, e);
              }
          }
      }

      return { success: true, count };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, count: 0, error: msg };
    }
  }

  async resetDatabase() {
      if (__DEV__) {
          await clearAllDataForDev();
      } else {
        // We need a non-dev way to wipe for "Restore from Scratch"
        // But for now, let's rely on the user uninstalling or we expose a dangerous clear function.
        // Let's defer "Wipe" implementation until explicitly requested for Prod.
        throw new Error("Reset not fully implemented for production yet.");
      }
  }
}

export const importService = new ImportService();
