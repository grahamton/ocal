import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type LogEntry = {
  timestamp: string; // ISO string
  category: 'nav' | 'user' | 'system' | 'error' | 'ai';
  message: string;
  metadata?: Record<string, unknown>;
};

class LogService {
  private logs: LogEntry[] = [];
  private static instance: LogService;

  private constructor() {
    this.add('system', 'LogService initialized');
  }

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  public add(
    category: LogEntry['category'],
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      category,
      message,
      metadata,
    };
    this.logs.push(entry);

    // Optional: console output for dev
    if (__DEV__) {
      if (category === 'error') {
        console.error(`[ERROR] ${message}`, metadata || '');
      } else {
        console.log(`[${category.toUpperCase()}] ${message}`, metadata || '');
      }
    }
  }

  public error(message: string, error?: unknown) {
    const metadata =
      error instanceof Error
        ? {message: error.message, stack: error.stack}
        : {error};
    this.add('error', message, metadata as Record<string, unknown>);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public async exportLogs(): Promise<void> {
    const fileName = `ocal_session_${new Date().getTime()}.json`;
    // Use cacheDirectory to avoid "documentDirectory" type issues if any, and it's temporary anyway
    const dir =
      FileSystem.cacheDirectory ||
      FileSystem.documentDirectory;
    if (!dir) {
      throw new Error('No file system directory available');
    }
    const filePath = `${dir}${fileName}`;

    try {
      const data = {
        deviceInfo: {
          // Add device info here if needed (e.g. Platform.OS)
          exportTime: new Date().toISOString(),
        },
        logs: this.logs,
      };

      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(data, null, 2),
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        console.warn('Sharing is not available on this platform');
      }
    } catch (error) {
      console.error('Failed to export logs', error);
      this.add('error', 'Failed to export logs', {error});
    }
  }

  public clear() {
    this.logs = [];
    this.add('system', 'Logs cleared');
  }
}

export const logger = LogService.getInstance();
