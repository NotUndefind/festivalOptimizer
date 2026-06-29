import type { Visitor, TimeSlot, Exposition, SlotScore, ScoreBreakdown, CriterionScore } from '../types/index.js';
import { DEFAULT_WEIGHTS, type Weights } from '../config/weights.js';

function scoreThematic(visitor: Visitor, exposition: Exposition): number {
  const themes = visitor.preferredThemes ?? [];
  if (themes.length === 0) return 0.5;
  const common = exposition.themes.filter((t) => themes.includes(t));
  return common.length / themes.length;
}

function scoreCrowd(attendance: number, capacity: number): number {
  return 1 - attendance / capacity;
}

function scoreTiming(slot: TimeSlot, visitor: Visitor): number {
  const slotStart = new Date(slot.start).getTime();
  const from = new Date(visitor.availableFrom).getTime();
  const to = new Date(visitor.availableTo).getTime();
  const range = to - from;
  if (range <= 0) return 1;
  return 1 - (slotStart - from) / range;
}

function criterion(value: number, weight: number, fallback?: boolean): CriterionScore {
  const score: CriterionScore = { value, weight, contribution: value * weight };
  if (fallback) score.fallback = true;
  return score;
}

// Score de confort du lieu : 1 − taux de saturation agrégé sur tous ses créneaux.
// value ∈ [0, 1] (1 = lieu vide, 0 = lieu plein) ; fallback si une affluence manque.
export interface VenueSaturation {
  value: number;
  fallback: boolean;
}

// Agrège l'affluence par lieu (venue) à partir de l'ensemble des créneaux.
// Affluence manquante → repli à capacity × 0.5 (cohérent avec scoreSlot et les règles).
export function computeVenueSaturation(
  slots: TimeSlot[],
  expositions: Exposition[],
): Map<string, VenueSaturation> {
  const expoToVenue = new Map(expositions.map((e) => [e.id, e.venueId]));
  const agg = new Map<string, { attendance: number; capacity: number; fallback: boolean }>();

  for (const slot of slots) {
    const venueId = expoToVenue.get(slot.expositionId);
    if (!venueId) continue;

    const capacity = slot.capacity ?? 0;
    const attendanceFallback = slot.estimatedAttendance === undefined || slot.estimatedAttendance === null;
    const attendance = attendanceFallback ? capacity * 0.5 : slot.estimatedAttendance!;

    const current = agg.get(venueId) ?? { attendance: 0, capacity: 0, fallback: false };
    current.attendance += attendance;
    current.capacity += capacity;
    current.fallback = current.fallback || attendanceFallback;
    agg.set(venueId, current);
  }

  const result = new Map<string, VenueSaturation>();
  for (const [venueId, { attendance, capacity, fallback }] of agg) {
    const ratio = capacity > 0 ? attendance / capacity : 1;
    result.set(venueId, { value: 1 - ratio, fallback });
  }
  return result;
}

export function scoreSlot(
  visitor: Visitor | null | undefined,
  slot: TimeSlot | null | undefined,
  exposition: Exposition,
  weights: Weights = DEFAULT_WEIGHTS,
  venueSaturation?: VenueSaturation,
): SlotScore {
  if (!visitor) throw new Error('visitor must not be null or undefined');
  if (!slot) throw new Error('slot must not be null or undefined');

  const themesFallback = !visitor.preferredThemes || visitor.preferredThemes.length === 0;
  const attendanceFallback = slot.estimatedAttendance === undefined || slot.estimatedAttendance === null;
  const capacity = slot.capacity ?? 0;
  const effectiveAttendance = attendanceFallback ? capacity * 0.5 : slot.estimatedAttendance!;

  // Si la saturation du lieu n'est pas fournie, repli neutre marqué comme estimé.
  const venue = venueSaturation ?? { value: 0.5, fallback: true };

  const breakdown: ScoreBreakdown = {
    thematic: criterion(scoreThematic(visitor, exposition), weights.thematic, themesFallback),
    crowd: criterion(scoreCrowd(effectiveAttendance, capacity), weights.crowd, attendanceFallback),
    venue: criterion(venue.value, weights.venue, venue.fallback),
    timing: criterion(scoreTiming(slot, visitor), weights.timing),
  };

  const score =
    breakdown.thematic.contribution +
    breakdown.crowd.contribution +
    breakdown.venue.contribution +
    breakdown.timing.contribution;

  return { slot, exposition, score, breakdown };
}
