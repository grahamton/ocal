import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as firestoreService from './firestoreService'; // Updated import
import {logger} from './LogService';
import {RockIdResult} from '@/ai/rockIdSchema'; // Updated import

export class ExportService {
  /**
   * Generates a full fidelity JSON backup of certain database tables.
   * Can be used for restore or manual debugging.
   */
  async exportBackupJson(): Promise<string> {
    const finds = await firestoreService.getAllFinds(); // Updated call
    const sessions = await firestoreService.getAllSessions(); // Updated call

    const backupData = {
      meta: {
        exportedAt: new Date().toISOString(),
        version: 1,
        appVersion: '0.0.1',
      },
      finds,
      sessions,
    };

    const fileName = `ocal_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(backupData, null, 2),
    );
    return filePath;
  }

  /**
   * Generates a lightweight JSON for AI analysis/debugging.
   * Strips out large Base64 images to keep the file size manageable.
   */
  async exportAnalysisJson(): Promise<string> {
    const finds = await firestoreService.getAllFinds(); // Updated call
    const sessions = await firestoreService.getAllSessions(); // Updated call

    // Deep clone and sanitize
    const cleanFinds = finds.map(f => {
      const clean = JSON.parse(JSON.stringify(f));

      // Sanitize AI Data input images
      if (clean.aiData && clean.aiData.input?.sourceImages) {
        clean.aiData.input.sourceImages = clean.aiData.input.sourceImages.map(
          (img: {uri: string}) => ({ // Explicitly type img
            ...img,
            uri: img.uri?.startsWith('data:')
              ? '[Base64 Data Omitted]'
              : img.uri,
          }),
        );
      }
      return clean;
    });

    const exportData = {
      meta: {
        exportedAt: new Date().toISOString(),
        version: 1,
        appVersion: '0.0.1',
        type: 'analysis_export',
      },
      finds: cleanFinds,
      sessions,
      logs: logger.getLogs(),
    };

    const fileName = `ocal_analysis_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(exportData, null, 2),
    );
    return filePath;
  }

  /**
   * Generates a CSV for spreadsheet use.
   * Focuses on Finds only.
   */
  async exportFindsCsv(): Promise<string> {
    const finds = await firestoreService.getAllFinds(); // Updated call

    // Header
    const header = 'Date,ID,Label,Category,Location,Favorite,Note';

    // Rows
    const rows = finds.map(f => {
      // CSV escaping
      const escape = (str: string | null | undefined) => {
        if (!str) return '';
        const safe = str.replace(/'"'/g, '""'); // Escape quotes
        return `"${safe}"`;
      };

      const dateStr =
        new Date(f.timestamp).toLocaleDateString() +
        ' ' +
        new Date(f.timestamp).toLocaleTimeString();
      let aiLabel = 'Unknown';
      let aiCategory = '';

      if (f.aiData) {
        if ('result' in f.aiData) {
          // Wrapped AnalysisEvent
          const res = f.aiData.result;
          aiLabel = res?.best_guess?.label || 'Unknown';
          aiCategory = res?.best_guess?.category || '';
        } else {
          // Legacy RockIdResult
          const res = f.aiData as RockIdResult; // Cast to specific type
          aiLabel = res?.best_guess?.label || 'Unknown';
          aiCategory = res?.best_guess?.category || '';
        }
      }

      const label = f.label || aiLabel;

      // Use locationSync text or lat/long
      const locText =
        f.lat && f.long
          ? `${f.lat.toFixed(5)}, ${f.long.toFixed(5)}`
          : 'No Location';

      return [
        escape(dateStr),
        escape(f.id),
        escape(label),
        escape(f.category || aiCategory),
        escape(locText),
        f.favorite ? 'Yes' : 'No',
        escape(f.note),
      ].join(',');
    });

    const csvContent = [header, ...rows].join('\n');
    const fileName = `ocal_finds_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent);
    return filePath;
  }

  async shareFile(filePath: string) {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath);
    } else {
      throw new Error('Sharing is not available on this device');
    }
  }
}

export const exportService = new ExportService();