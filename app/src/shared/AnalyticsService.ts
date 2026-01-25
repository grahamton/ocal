import PostHog from 'posthog-react-native';

const API_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_PLACEHOLDER_KEY';
const API_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export const posthog = new PostHog(API_KEY, {
  host: API_HOST,
  // Flush settings for offline-first nature
  flushInterval: 30, // Attempt flush every 30s
  flushAt: 10, // Or when 10 events accumulate
});

export const AnalyticsService = {
  /**
   * Initialize analytics (called in App.tsx)
   */
  init: async () => {
    // PostHog handles most async init internally
    // We could add global properties here
  },

  /**
   * Log a discrete event
   */
  logEvent: (name: string, properties?: Record<string, unknown>) => {
    try {
      if (__DEV__) {
        console.log(`[Analytics] ${name}`, properties);
      }
      posthog.capture(name, properties);
    } catch (e) {
      console.warn('[Analytics] Failed to capture', e);
    }
  },

  /**
   * Log a screen view manually (if needed outside nav)
   */
  logScreen: (screenName: string) => {
    posthog.screen(screenName);
  },
};
