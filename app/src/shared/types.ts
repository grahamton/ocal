export type FindRecord = {
  id: string;
  photoUri: string;
  lat: number | null;
  long: number | null;
  timestamp: string;
  synced: boolean;
  note: string | null;
  category: string | null;
  label: string | null;
  status: 'draft' | 'cataloged';
};
