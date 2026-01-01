// import { RockIdResult } from '../ai/rockIdSchema'; // Flexible now
export type FindRecord = {
  id: string;
  photoUri: string;
  lat: number | null;
  long: number | null;
  location_text?: string | null;
  timestamp: string;
  synced: boolean;
  note: string | null;
  category: string | null;
  label: string | null;
  status: 'draft' | 'cataloged';
  sessionId: string | null;
  favorite: boolean;
  aiData?: Record<string, any> | null;
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
