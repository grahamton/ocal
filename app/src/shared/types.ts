import {ChatTurn, RockCard} from '@/ai/rockCard';

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
  status:
    | 'draft'
    | 'cataloged'
    | 'archived'
    | 'pending_ai_analysis'
    | 'ai_analysis_failed';
  sessionId: string | null;
  favorite: boolean;
  card?: RockCard | null;
  cardModel?: string | null;
  /** Why the last identification attempt didn't finish (offline, error). */
  aiError?: string | null;
  chat?: ChatTurn[];
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
