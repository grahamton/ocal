import * as FileSystem from 'expo-file-system';

const findsDir = `${FileSystem.documentDirectory}finds`;

export async function resetLocalDataForDev() {
  if (!__DEV__) {
    throw new Error(
      'resetLocalDataForDev is only available in development builds.',
    );
  }

  const info = await FileSystem.getInfoAsync(findsDir);
  if (info.exists) {
    await FileSystem.deleteAsync(findsDir, {idempotent: true});
  }
}
