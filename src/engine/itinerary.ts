import type { Visitor, TimeSlot, Exposition, SlotScore, Itinerary } from '../types/index.js';
import { type Weights, DEFAULT_WEIGHTS } from '../config/weights.js';
import { recommend } from './recommender.js';

function overlaps(a: TimeSlot, b: TimeSlot): boolean {
  const aStart = new Date(a.start).getTime();
  const aEnd = new Date(a.end).getTime();
  const bStart = new Date(b.start).getTime();
  const bEnd = new Date(b.end).getTime();
  return aStart < bEnd && bStart < aEnd;
}

export function recommendItinerary(
  visitor: Visitor,
  slots: TimeSlot[],
  expositions: Exposition[],
  weights: Weights = DEFAULT_WEIGHTS,
  maxStops = 3,
): Itinerary {
  const result = recommend(visitor, slots, expositions, weights);
  if (result.best === null) {
    return { steps: [], totalScore: 0 };
  }

  const ranked: SlotScore[] = [result.best, ...result.alternatives];
  const steps: SlotScore[] = [];

  for (const candidate of ranked) {
    if (steps.length >= maxStops) break;
    const clashes = steps.some((s) => overlaps(s.slot, candidate.slot));
    if (!clashes) steps.push(candidate);
  }

  steps.sort((a, b) => new Date(a.slot.start).getTime() - new Date(b.slot.start).getTime());
  const totalScore = steps.reduce((sum, s) => sum + s.score, 0);

  return { steps, totalScore };
}
