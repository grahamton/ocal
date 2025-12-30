import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';

import { PALETTE_JOURNAL, PALETTE_HIGH_CONTRAST, ThemeMode } from './theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeColors = typeof PALETTE_JOURNAL;

type ThemeContextType = {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // precise default: Journal
  const [mode, setModeState] = useState<ThemeMode>('journal');

  useEffect(() => {
    // Load persisted theme
    AsyncStorage.getItem('ocal_theme_mode').then((saved) => {
      if (saved === 'high-contrast') {
        setModeState('high-contrast');
      }
    });
  }, []);

  const setTheme = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem('ocal_theme_mode', newMode).catch(() => {});
  };

  const toggleTheme = () => {
    setTheme(mode === 'journal' ? 'high-contrast' : 'journal');
  };

  const colors = useMemo(() => {
    return mode === 'journal' ? PALETTE_JOURNAL : PALETTE_HIGH_CONTRAST;
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
