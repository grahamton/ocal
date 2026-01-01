import AsyncStorage from '@react-native-async-storage/async-storage';
import { RangerMode } from './RangerConfig';

const KEY = 'ranger_mode_pref';

export const RangerSettings = {
  getMode: async (): Promise<RangerMode> => {
    try {
      const val = await AsyncStorage.getItem(KEY);
      // Validate string to ensure it matches the type
      if (val === 'ship' || val === 'explore') {
        return val;
      }
      return 'explore'; // Default
    } catch (e) {
      return 'explore';
    }
  },

  setMode: async (mode: RangerMode) => {
    try {
      await AsyncStorage.setItem(KEY, mode);
    } catch (e) {
      console.warn('Failed to save Ranger mode', e);
    }
  }
};
