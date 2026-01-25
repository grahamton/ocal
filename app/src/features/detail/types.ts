export type AiResult = {
  best_guess?: {label?: string; confidence?: number; category?: string};
  alternatives?: Array<{label: string; confidence: number}>;
  observable_reasons?: string[];
  caution?: string[];
  red_flags?: string[];
  catalog_tags?: {type?: string[]};
};
