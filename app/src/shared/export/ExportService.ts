
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { listFinds, listSessions } from '../db';

export class ExportService {
  /**
   * Generates a full fidelity JSON backup of certain database tables.
   * Can be used for restore or manual debugging.
   */
  async exportBackupJson(): Promise<string> {
    const finds = await listFinds({ status: 'all' });
    const sessions = await listSessions();

    const backupData = {
      meta: {
        exportedAt: new Date().toISOString(),
        version: 1,
        appVersion: '0.0.1'
      },
      finds,
      sessions
    };

    const fileName = `ocal_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupData, null, 2));
    return filePath;
  }

  /**
   * Generates a CSV for spreadsheet use.
   * Focuses on Finds only.
   */
  async exportFindsCsv(): Promise<string> {
    const finds = await listFinds({ status: 'all' });

    // Header
    const header = 'Date,ID,Label,Category,Location,Favorite,Note';

    // Rows
    const rows = finds.map(f => {
      // CSV escaping
      const escape = (str: string | null | undefined) => {
        if (!str) return '';
        const safe = str.replace(/"/g, '""'); // Escape quotes
        return `"${safe}"`;
      };

      const dateStr = new Date(f.timestamp).toLocaleDateString() + ' ' + new Date(f.timestamp).toLocaleTimeString();
      let aiLabel = 'Unknown';
      let aiCategory = '';

      if (f.aiData && 'result' in f.aiData) {
          // Wrapped AnalysisEvent
          const res = (f.aiData as any).result;
          aiLabel = res?.best_guess?.label || 'Unknown';
          aiCategory = res?.best_guess?.category || '';
      } else if (f.aiData) {
          // Legacy RockIdResult
          const res = f.aiData as any;
          aiLabel = res?.best_guess?.label || 'Unknown';
          aiCategory = res?.best_guess?.category || '';
      }

      const label = f.label || aiLabel;

      // Use locationSync text or lat/long
      const locText = f.lat && f.long ? `${f.lat.toFixed(5)}, ${f.long.toFixed(5)}` : 'No Location';

      return [
        escape(dateStr),
        escape(f.id),
        escape(label),
        escape(f.category || aiCategory),
        escape(locText),
        f.favorite ? 'Yes' : 'No',
        escape(f.note)
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
