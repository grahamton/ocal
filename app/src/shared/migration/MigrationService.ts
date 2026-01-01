
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { insertFind, createSession, getFind, getSession } from '../db'; // Assuming exports
import { FindRecord, Session } from '../types';

export type MigrationStatus = 'idle' | 'checking' | 'backing_up' | 'migrating' | 'validating' | 'done' | 'error';

export type MigrationState = {
  status: MigrationStatus;
  progress: number; // 0-1
  totalItems: number;
  processedItems: number;
  error?: string;
  logs: string[];
};

class MigrationService {
  private listener?: (state: MigrationState) => void;
  private state: MigrationState = {
    status: 'idle',
    progress: 0,
    totalItems: 0,
    processedItems: 0,
    logs: [],
  };

  subscribe(callback: (state: MigrationState) => void) {
    this.listener = callback;
    callback(this.state);
  }

  private updateState(updates: Partial<MigrationState>) {
    this.state = { ...this.state, ...updates };
    if (this.listener) this.listener(this.state);
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Migration] ${message}`);
    this.updateState({ logs: [...this.state.logs, `[${timestamp}] ${message}`] });
  }

  async checkNeedsMigration(): Promise<boolean> {
    this.updateState({ status: 'checking' });
    try {
        const keys = await AsyncStorage.getAllKeys();

        // Log all keys for discovery since user doesn't know them
        if (keys.length > 0) {
            this.log(`Found ${keys.length} keys in AsyncStorage: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`);
        } else {
            this.log('AsyncStorage is empty.');
        }

        // Heuristic: If we find known potential keys, we migrate.
        // Since we don't know the keys, we'll implement a 'Discovery Mode' migration first.
        // For now, if ANY keys exist and we haven't marked migration as done, return true.
        // We will store a 'migration_complete_v1' key in AsyncStorage itself to prevent loops.

        const isMigrated = await AsyncStorage.getItem('migration_complete_v1');
        if (isMigrated) {
            this.log('Migration already marked complete.');
            return false;
        }

        // Filter out expo internal keys if any? usually they are specific.
        const likelyData = keys.filter(k => !k.startsWith('migration_'));
        return likelyData.length > 0;

    } catch (e) {
        this.log(`Error checking status: ${e}`);
        return false;
    } finally {
        this.updateState({ status: 'idle' });
    }
  }

  async runMigration() {
     this.updateState({ status: 'backing_up', progress: 0, error: undefined });
     try {
         // 1. Backup
         const keys = await AsyncStorage.getAllKeys();
         const allData = await AsyncStorage.multiGet(keys);
         const backupPath = `${FileSystem.documentDirectory}backup_pre_migration_${Date.now()}.json`;
         await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(allData));
         this.log(`Backup saved to ${backupPath}`);

         // 2. Discover and Migrate
         this.updateState({ status: 'migrating', totalItems: keys.length });

         // We do this serially to avoid memory pressure
         let processed = 0;

         for (const [key, value] of allData) {
            if (!value) continue;

            // Try to detect what this is
            // Strategy: Try parsing as JSON. Check for 'find' fields or 'session' fields.
            try {
                const parsed = JSON.parse(value);

                // Heuristic for Find
                if (parsed.id && parsed.timestamp && (parsed.photoUri || parsed.imageUri)) { // Adjust based on old schema guess
                    await this.migrateFind(parsed);
                }
                // Heuristic for Session
                else if (parsed.id && parsed.startTime && Array.isArray(parsed.finds)) {
                    await this.migrateSession(parsed);
                }
                else {
                    this.log(`Skipping unknown key: ${key}`);
                }

            } catch (_e) {
                // Not JSON, ignore
            }

            processed++;
            this.updateState({
                progress: processed / keys.length,
                processedItems: processed
            });

            // Yield to UI loop occasionally
            if (processed % 10 === 0) await new Promise(r => setTimeout(r, 0));
         }

         // 3. Mark Complete
         await AsyncStorage.setItem('migration_complete_v1', 'true');
         this.updateState({ status: 'done', progress: 1 });
         this.log('Migration completed successfully.');

     } catch (error) {
         const msg = error instanceof Error ? error.message : String(error);
         this.log(`Migration Failed: ${msg}`);
         this.updateState({ status: 'error', error: msg });
     }
  }

  private async migrateFind(data: any) {
      // Best-effort mapping
      const record: FindRecord = {
          id: data.id,
          photoUri: data.photoUri || data.imageUri, // Handle legacy naming if needed
          lat: data.lat || (data.location ? data.location.coords?.latitude : null),
          long: data.long || (data.long || data.location ? data.location.coords?.longitude : null),
          timestamp: data.timestamp,
          synced: false, // Force re-sync if cloud exists later
          note: data.note,
          category: data.category,
          label: data.label,
          status: 'cataloged', // Assume old ones are saved
          sessionId: data.sessionId,
          favorite: data.favorite || false,
          aiData: data.aiData
      };

      // Upsert
      const existing = await getFind(record.id);
      if (!existing) {
          await insertFind(record);
      }
  }

  private async migrateSession(data: any) {
      const session: Session = {
          id: data.id,
          name: data.name,
          startTime: data.startTime,
          endTime: data.endTime,
          locationName: data.locationName,
          status: data.status,
          finds: data.finds
      };

      const existing = await getSession(session.id);
      if (!existing) {
          await createSession(session);
      }
  }
}

export const migrationService = new MigrationService();
