import { TextStyle } from 'react-native';

export const PALETTE = {
  // Deep Ocean
  oceanDark: '#0f172a', // Slate 900
  oceanBlue: '#1e293b', // Slate 800
  deepTeal: '#0f766e',  // Teal 700

  // Sea Glass / Accents
  electricTeal: '#2dd4bf', // Teal 400
  softSand: '#fde68a',     // Amber 200 (warmth)
  danger: '#f87171',       // Red 400

  // Neutrals (for dark mode base)
  white: '#ffffff',
  white95: 'rgba(255, 255, 255, 0.95)', // Almost pure white
  white90: 'rgba(255, 255, 255, 0.9)',
  white80: 'rgba(255, 255, 255, 0.8)',
  white60: 'rgba(255, 255, 255, 0.6)', // Keep for borders only
  white10: 'rgba(255, 255, 255, 0.15)', // Slightly more visible glass

  black: '#000000',
  black40: 'rgba(0, 0, 0, 0.4)',
};

export const THEME = {
  colors: {
    background: PALETTE.oceanDark,
    text: PALETTE.white,          // Max contrast
    textSecondary: PALETTE.white90, // subtle is now very visible
    accent: PALETTE.electricTeal,
    card: PALETTE.white10,
    border: PALETTE.white60,      // Brighter borders
  },
  typography: {
    header: {
      fontSize: 34,
      fontWeight: '800' as TextStyle['fontWeight'],
      color: PALETTE.white,
      fontFamily: 'Outfit_800ExtraBold',
    },
    subHeader: {
      fontSize: 22,
      fontWeight: '700' as TextStyle['fontWeight'],
      color: PALETTE.white, // No more grey headers
      fontFamily: 'Outfit_700Bold',
    },
    body: {
      fontSize: 18, // Base font bump
      color: PALETTE.white95, // High contrast body
      fontFamily: 'Outfit_400Regular',
    },
    label: {
      fontSize: 14,
      fontWeight: '700' as TextStyle['fontWeight'],
      color: PALETTE.white,
      fontFamily: 'Outfit_700Bold',
      textTransform: 'uppercase' as TextStyle['textTransform'],
      letterSpacing: 1,
    }
  },
  layout: {
    padding: 20,
    borderRadius: 24,
  }
};
