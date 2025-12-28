export function formatCoords(lat: number | null, long: number | null) {
  if (lat == null || long == null) return 'No GPS saved';
  return `${lat.toFixed(4)}, ${long.toFixed(4)}`;
}
