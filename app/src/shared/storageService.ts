import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import {createId} from './id';
import {logger} from './LogService';

const getCurrentUserId = (): string | null => {
  return auth().currentUser?.uid || null;
};

export const uploadImage = async (localFileUri: string): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) {
    logger.error('StorageService: Cannot upload image - no user ID');
    throw new Error('No authenticated user for storage operation.');
  }

  const filename = `${createId()}.jpg`;
  const storagePath = `users/${userId}/images/${filename}`;
  const reference = storage().ref(storagePath);

  try {
    logger.add('storage', `Uploading image to: ${storagePath}`);
    await reference.putFile(localFileUri);
    const downloadURL = await reference.getDownloadURL();
    logger.add('storage', `Image uploaded successfully: ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    logger.error('StorageService: Image upload failed', {storagePath, error});
    throw error;
  }
};
