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
  sessionId: string | null;
  favorite: boolean;
};

export type Session = {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  locationName?: string;
  finds: string[];
  status: 'active' | 'complete';
};
