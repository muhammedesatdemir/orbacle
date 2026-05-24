import { Language } from '../types/language';
import { AnswerCategory } from '../data/whispers/categories';
import { TierKey } from '../entitlements/types';

// A reading request for one of the paid tiers (Kâhin Yorumu / Derin Kehanet).
// In Phase 2 this is served by a local mock; in Phase 4 it maps onto the
// backend ReadingRequest contract.
export interface ReadingRequest {
  tier: TierKey;
  question: string;
  // The Layer-1 whisper already shown to the user, for context/continuity.
  whisper: string;
  category: AnswerCategory;
  language: Language;
}

export interface ReadingResult {
  tier: TierKey;
  text: string;
}
