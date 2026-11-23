// Mirror of the Worker's RockCardSchema (worker/src/card.ts).
// The Worker validates responses, so the app only needs the type.

export type RockCard = {
  photo_ok: boolean;
  photo_tip: string | null;
  name: string;
  kind:
    | 'mineral'
    | 'rock'
    | 'fossil'
    | 'sea_glass'
    | 'artifact'
    | 'not_a_rock'
    | 'unknown';
  confidence: 'pretty_sure' | 'good_hunch' | 'could_be' | 'honest_mystery';
  also_could_be: string[];
  story: string;
  clues: string[];
  try_this: string[];
  keeper: 'keeper' | 'storyteller' | 'leaverite';
  tumbles_well: boolean | null;
  fun_fact: string | null;
  al_wonders: string[];
};

export type ChatTurn = {role: 'user' | 'assistant'; content: string; at: string};

export const CONFIDENCE_WORDS: Record<RockCard['confidence'], string> = {
  pretty_sure: 'Pretty sure',
  good_hunch: 'Good hunch',
  could_be: 'Could be',
  honest_mystery: 'Honest mystery',
};

export const KEEPER_WORDS: Record<RockCard['keeper'], string> = {
  keeper: 'A keeper!',
  storyteller: 'A storyteller',
  leaverite: 'Leave-er-right',
};
