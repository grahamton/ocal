import * as FileSystem from 'expo-file-system/legacy';
import {addFind, addSession} from '@/shared/firestoreService';

export class ImportService {
  /**
   * Restores data from a backup JSON file into Firestore.
   * This is additive — it does not wipe existing data first.
   */
  async restoreBackup(
    uri: string,
  ): Promise<{success: boolean; count: number; error?: string}> {
    try {
      const jsonContent = await FileSystem.readAsStringAsync(uri);
      const data = JSON.parse(jsonContent);

      if (!data.finds || !Array.isArray(data.finds)) {
        throw new Error('Invalid backup format: missing finds array');
      }

      let count = 0;

      for (const find of data.finds) {
        try {
          if (find.id) {
            await addFind(find);
            count++;
          }
        } catch (e) {
          console.warn(`Skipping duplicate or invalid find ${find.id}`, e);
        }
      }

      if (data.sessions && Array.isArray(data.sessions)) {
        for (const session of data.sessions) {
          try {
            if (session.id) await addSession(session);
          } catch (e) {
            console.warn(`Skipping duplicate session ${session.id}`, e);
          }
        }
      }

      return {success: true, count};
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {success: false, count: 0, error: msg};
    }
  }
}

export const importService = new ImportService();
