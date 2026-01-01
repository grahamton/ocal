import { listFinds, updateFindMetadata } from '../db';
import * as FileSystem from 'expo-file-system/legacy';

export interface IntegrityReport {
  missingPhotos: string[]; // Find IDs where the file does not exist
  orphanFiles: string[];   // File paths that are not referenced in the DB
  totalFiles: number;
  totalFinds: number;
  scannedAt: string;
}

export class IntegrityService {
  /**
   * Scans the document directory and database to find inconsistencies.
   */
  async checkIntegrity(): Promise<IntegrityReport> {
    const report: IntegrityReport = {
      missingPhotos: [],
      orphanFiles: [],
      totalFiles: 0,
      totalFinds: 0,
      scannedAt: new Date().toISOString(),
    };

    // 1. Get all files in the document directory
    // We filter for images to avoid deleting config files or databases
    const allFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory as string);
    const imageFiles = new Set(
        allFiles.filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'))
    );
    report.totalFiles = imageFiles.size;

    // 2. Get all Finds from DB
    const finds = await listFinds({ status: 'all' });
    report.totalFinds = finds.length;

    const dbFiles = new Set<string>();

    // 3. Check for Missing Photos
    for (const find of finds) {
      if (find.photoUri) {
        // Extract filename from URI
        const filename = find.photoUri.split('/').pop();
        if (filename) {
            dbFiles.add(filename);

            // Check if file exists in our scan
            // Note: We assume photoUri points to documentDirectory.
            // If it's an external URI (e.g. library), this check might be invalid.
            // Ocal copies to doc dir, so it should be fine.
            if (!imageFiles.has(filename)) {
                // Double check existence with FileSystem info to be sure (async)
                const info = await FileSystem.getInfoAsync(find.photoUri);
                if (!info.exists) {
                    report.missingPhotos.push(find.id);
                }
            }
        }
      }
    }

    // 4. Check for Orphan Files
    for (const file of imageFiles) {
        if (!dbFiles.has(file)) {
            report.orphanFiles.push(`${FileSystem.documentDirectory}${file}`);
        }
    }

    return report;
  }

  /**
   * Deletes files that are not referenced in the database.
   */
  async cleanupOrphans(orphanPaths: string[]): Promise<number> {
    let deleted = 0;
    for (const path of orphanPaths) {
        try {
            await FileSystem.deleteAsync(path, { idempotent: true });
            deleted++;
        } catch (e) {
            console.warn(`Failed to delete orphan: ${path}`, e);
        }
    }
    return deleted;
  }

  /**
   * Archives finds that are missing their photo files.
   */
  async archiveMissingPhotos(findIds: string[]): Promise<number> {
      let count = 0;

      for (const id of findIds) {
          try {
              await updateFindMetadata(id, { status: 'archived' });
              count++;
          } catch (e) {
             console.warn(`Failed to archive find: ${id}`, e);
          }
      }
      return count;
  }
}

export const integrityService = new IntegrityService();
