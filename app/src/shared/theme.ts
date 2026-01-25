import {TextStyle} from 'react-native';

export type ThemeMode = 'journal' | 'high-contrast';

// 1. Journal Mode (Analog/Warm)
export const PALETTE_JOURNAL = {
  background: '#FDFBF7', // Cream / Off-white paper
  text: '#1e293b', // Ink Blue (Slate 800)
  textSecondary: '#475569', // Slate 600
  card: '#ffffff', // Pure white paper card
  border: '#e2e8f0', // Slate 200 (subtle pencil line)
  accent: '#0f766e', // Teal 700 (Deep Teal Ink)
  accentSecondary: '#f59e0b', // Amber 500 (Highlighter)
  danger: '#ef4444', // Red 500
  success: '#22c55e', // Green 500
};

// 2. High Contrast Mode (Tactical/OLED)
export const PALETTE_HIGH_CONTRAST = {
  background: '#000000', // Pure Black
  text: '#FFFFFF', // Pure White
  textSecondary: '#e2e8f0', // Slate 200 (still very bright)
  card: '#000000', // Black
  border: '#FFFFFF', // White (2px solid)
  accent: '#EAB308', // Neon Yellow/Gold
  accentSecondary: '#06b6d4', // Cyan
  danger: '#FF0000', // Pure Red
  success: '#00FF00', // Pure Green
};

export const THEME = {
  // Default to Journal for initial static usage (will be overridden by Context)
  colors: PALETTE_JOURNAL,
  typography: {
    header: {
      fontSize: 32,
      fontWeight: '800' as TextStyle['fontWeight'],
      fontFamily: 'Outfit_800ExtraBold',
      color: PALETTE_JOURNAL.text,
    },
    subHeader: {
      fontSize: 20,
      fontWeight: '700' as TextStyle['fontWeight'],
      fontFamily: 'Outfit_700Bold',
      color: PALETTE_JOURNAL.text,
    },
    body: {
      fontSize: 18,
      fontFamily: 'Outfit_400Regular',
      color: PALETTE_JOURNAL.textSecondary,
    },
    label: {
      fontSize: 14,
      fontWeight: '700' as TextStyle['fontWeight'],
      fontFamily: 'Outfit_700Bold',
      textTransform: 'uppercase' as TextStyle['textTransform'],
      letterSpacing: 1,
      color: PALETTE_JOURNAL.text,
    },
  },
  layout: {
    padding: 20,
    borderRadius: 16, // Slightly sharper than 24
  },
};
