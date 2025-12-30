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
