import AsyncStorage from '@react-native-async-storage/async-storage';
import {listFinds, listSessions} from '../db';
import * as firestoreService from '../firestoreService';
import * as storageService from '../storageService';
import {logger} from '../LogService';

const MIGRATION_DONE_KEY = 'ocal_migration_done';

export type MigrationState = {
  status: 'idle' | 'checking' | 'backing_up' | 'migrating' | 'validating' | 'done' | 'error';
  progress: number; // 0.0 – 1.0
  totalItems: number;
  processedItems: number;
  logs: string[];
  error?: string;
};

type Subscriber = (state: MigrationState) => void;

class MigrationService {
  private state: MigrationState = {
    status: 'idle',
    progress: 0,
    totalItems: 0,
    processedItems: 0,
    logs: [],
  };

  private subscribers: Subscriber[] = [];

  subscribe(fn: Subscriber): () => void {
    this.subscribers.push(fn);
    fn(this.state); // Emit current state immediately
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== fn);
    };
  }

  private setState(partial: Partial<MigrationState>) {
    this.state = {...this.state, ...partial};
    this.subscribers.forEach(fn => fn(this.state));
  }

  private log(message: string) {
    logger.add('migration', message);
    this.setState({logs: [...this.state.logs, message]});
  }

  /** Returns true if migration has already been completed on this device. */
  async isMigrationDone(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(MIGRATION_DONE_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }

  /** Run the one-time SQLite → Firestore migration. */
  async runMigration(): Promise<void> {
    this.setState({
      status: 'checking',
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      logs: [],
      error: undefined,
    });

    try {
      // Check if already done
      const done = await this.isMigrationDone();
      if (done) {
        this.log('Migration already complete. Skipping.');
        this.setState({status: 'done', progress: 1});
        return;
      }

      this.log('Reading local SQLite data...');
      const finds = await listFinds();
      const sessions = await listSessions();
      const totalItems = finds.length + sessions.length;

      if (totalItems === 0) {
        this.log('No local data found. Marking migration as done.');
        await AsyncStorage.setItem(MIGRATION_DONE_KEY, 'true');
        this.setState({status: 'done', progress: 1});
        return;
      }

      this.log(`Found ${finds.length} finds and ${sessions.length} sessions to migrate.`);
      this.setState({status: 'migrating', totalItems, processedItems: 0});

      let processedItems = 0;

      // Migrate Finds
      for (const find of finds) {
        try {
          // Upload local photo to Firebase Storage (photoUri is a local file path)
          const downloadURL = await storageService.uploadImage(find.photoUri);

          // aiData is stored as a JSON string in SQLite — parse it back
          const parsedAiData = find.aiData
            ? typeof find.aiData === 'string'
              ? (() => { try { return JSON.parse(find.aiData); } catch { return null; } })()
              : find.aiData
            : null;

          const migratedFind = {
            ...find,
            photoUri: downloadURL,
            aiData: parsedAiData,
          };

          await firestoreService.addFind(migratedFind);
          processedItems++;
          this.log(`Migrated find: ${find.id}`);
          this.setState({
            processedItems,
            progress: processedItems / totalItems,
          });
        } catch (error) {
          this.log(`Warning: failed to migrate find ${find.id} — skipping.`);
          logger.error('MigrationService: Failed to migrate find', {findId: find.id, error});
        }
      }

      // Migrate Sessions
      for (const session of sessions) {
        try {
          // finds is already parsed as string[] by db.ts
          await firestoreService.addSession(session);
          processedItems++;
          this.log(`Migrated session: ${session.id}`);
          this.setState({
            processedItems,
            progress: processedItems / totalItems,
          });
        } catch (error) {
          this.log(`Warning: failed to migrate session ${session.id} — skipping.`);
          logger.error('MigrationService: Failed to migrate session', {sessionId: session.id, error});
        }
      }

      this.setState({status: 'validating'});
      this.log('Finalising migration...');

      await AsyncStorage.setItem(MIGRATION_DONE_KEY, 'true');
      this.log('Migration complete!');
      this.setState({status: 'done', progress: 1});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      logger.error('MigrationService: Migration failed', {error});
      this.log(`Error: ${errorMessage}`);
      this.setState({status: 'error', error: errorMessage});
    }
  }
}

export const migrationService = new MigrationService();
