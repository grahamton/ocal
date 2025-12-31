import * as Location from 'expo-location';

export function formatCoords(lat: number | null, long: number | null) {
  if (lat == null || long == null) return 'No GPS saved';
  return `${lat.toFixed(4)}, ${long.toFixed(4)}`;
}

export function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Cache for geocoded locations to avoid repeated API calls
const geocodeCache = new Map<string, string>();

/**
 * Format location as friendly name using reverse geocoding.
 * Falls back to coordinates if geocoding fails or is unavailable.
 */
export async function formatLocation(lat: number | null, long: number | null): Promise<string> {
  if (lat == null || long == null) return 'No Location';

  // Check cache first
  const cacheKey = `${lat.toFixed(4)},${long.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: long });

    if (results && results.length > 0) {
      const location = results[0];
      let formatted = '';

      // Build friendly name: "City, State" or "City, Country"
      if (location.city) {
        formatted = location.city;
        if (location.region) {
          formatted += `, ${location.region}`;
        } else if (location.country) {
          formatted += `, ${location.country}`;
        }
      } else if (location.subregion) {
        // For areas without cities (like lakes, parks)
        formatted = location.subregion;
        if (location.region) {
          formatted += `, ${location.region}`;
        }
      } else if (location.region) {
        formatted = location.region;
        if (location.country) {
          formatted += `, ${location.country}`;
        }
      } else if (location.country) {
        formatted = location.country;
      }

      if (formatted) {
        geocodeCache.set(cacheKey, formatted);
        return formatted;
      }
    }
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
  }

  // Fallback to formatted coordinates
  const fallback = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(long).toFixed(2)}°${long >= 0 ? 'E' : 'W'}`;
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Synchronous version that returns cached value or coordinates immediately.
 */
export function formatLocationSync(lat: number | null, long: number | null): string {
  if (lat == null || long == null) return 'No Location';

  const cacheKey = `${lat.toFixed(4)},${long.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // Return coordinates immediately, trigger background geocoding
  formatLocation(lat, long);
  return formatCoords(lat, long);
}
