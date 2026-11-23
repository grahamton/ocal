import * as FileSystem from 'expo-file-system';
import {createId} from '@/shared/id';
import {logger} from '@/shared/LogService';

// Local, offline-only replacement for the old Firebase Storage-backed
// upload. Photos are copied into the app's persistent document directory
// and referenced by their local file:// URI - nothing leaves the device.

const IMAGES_DIR = `${FileSystem.documentDirectory}images/`;

const ensureImagesDir = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, {intermediates: true});
  }
};

export const uploadImage = async (localFileUri: string): Promise<string> => {
  try {
    await ensureImagesDir();
    const filename = `${createId()}.jpg`;
    const destPath = `${IMAGES_DIR}${filename}`;

    logger.add('storage', `Copying image to local storage: ${destPath}`);
    await FileSystem.copyAsync({from: localFileUri, to: destPath});
    logger.add('storage', `Image saved successfully: ${destPath}`);
    return destPath;
  } catch (error) {
    logger.error('StorageService: Image save failed', {localFileUri, error});
    throw error;
  }
};
