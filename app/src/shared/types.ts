import { RockIdResult, AnalysisEvent } from '../ai/rockIdSchema';

export type FindRecord = {
  id: string;
  photoUri: string;
  lat: number | null;
  long: number | null;
  location_text?: string | null;
  timestamp: string;
  note: string | null;
  category: string | null;
  label: string | null;
  status: 'draft' | 'cataloged' | 'archived';
  sessionId: string | null;
  favorite: boolean;
  aiData?: RockIdResult | AnalysisEvent | null;
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
