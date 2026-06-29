export interface Venue {
  id: string;
  name: string;
}

export interface Exposition {
  id: string;
  title: string;
  themes: string[];
  venueId: string;
}

export interface TimeSlot {
  id: string;
  expositionId: string;
  start: string;
  end: string;
  capacity?: number | undefined;
  estimatedAttendance?: number | undefined;
}

export interface Visitor {
  id: string;
  name: string;
  preferredThemes?: string[] | undefined;
  availableFrom: string;
  availableTo: string;
  maxCrowdRatio: number;
}

export interface CriterionScore {
  value: number;
  weight: number;
  contribution: number;
  fallback?: boolean;
}

export interface ScoreBreakdown {
  thematic: CriterionScore;
  crowd: CriterionScore;
  venue: CriterionScore;
  timing: CriterionScore;
}

export interface SlotScore {
  slot: TimeSlot;
  exposition: Exposition;
  score: number;
  breakdown: ScoreBreakdown;
  excludedBy?: string[];
}

export interface RecommendationResult {
  best: SlotScore | null;
  alternatives: SlotScore[];
  excluded: SlotScore[];
  message?: string;
}
