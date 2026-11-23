import {FindRecord} from '@/shared/types';

export type GalleryRow =
  | {type: 'day'; key: string; label: string}
  | {type: 'pair'; key: string; items: FindRecord[]};

export function dayLabel(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// Newest first: a heading per day, then the day's finds two to a row.
export function groupByDay(items: FindRecord[]): GalleryRow[] {
  const rows: GalleryRow[] = [];
  let current: string | null = null;
  let bucket: FindRecord[] = [];
  const flush = () => {
    for (let i = 0; i < bucket.length; i += 2) {
      const pair = bucket.slice(i, i + 2);
      rows.push({type: 'pair', key: pair[0].id, items: pair});
    }
    bucket = [];
  };
  for (const item of items) {
    const label = dayLabel(item.timestamp);
    if (label !== current) {
      flush();
      current = label;
      rows.push({type: 'day', key: `day-${label}`, label});
    }
    bucket.push(item);
  }
  flush();
  return rows;
}
