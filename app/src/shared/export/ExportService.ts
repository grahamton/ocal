import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as localDb from '@/shared/localDb';

export class ExportService {
  /**
   * Generates a full fidelity JSON backup of certain database tables.
   * Can be used for restore or manual debugging.
   */
  async exportBackupJson(): Promise<string> {
    const finds = await localDb.getAllFinds(); // Updated call
    const sessions = await localDb.getAllSessions(); // Updated call

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
   * Generates a CSV for spreadsheet use.
   * Focuses on Finds only.
   */
  async exportFindsCsv(): Promise<string> {
    const finds = await localDb.getAllFinds(); // Updated call

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

      const dateStr =
        new Date(f.timestamp).toLocaleDateString() +
        ' ' +
        new Date(f.timestamp).toLocaleTimeString();
      const label = f.label || f.card?.name || 'Unknown';

      // Use locationSync text or lat/long
      const locText =
        f.lat && f.long
          ? `${f.lat.toFixed(5)}, ${f.long.toFixed(5)}`
          : 'No Location';

      return [
        escape(dateStr),
        escape(f.id),
        escape(label),
        escape(f.category || f.card?.kind),
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
