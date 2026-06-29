import type { Visitor, TimeSlot, Exposition, SlotScore, RecommendationResult, ScoreBreakdown } from '../types/index.js';
import { type Weights, DEFAULT_WEIGHTS } from '../config/weights.js';
import { applyRules } from './rules.js';
import { scoreSlot, computeVenueSaturation } from './scoring.js';

function zeroBreakdown(weights: Weights): ScoreBreakdown {
  return {
    thematic: { value: 0, weight: weights.thematic, contribution: 0 },
    crowd: { value: 0, weight: weights.crowd, contribution: 0 },
    venue: { value: 0, weight: weights.venue, contribution: 0 },
    timing: { value: 0, weight: weights.timing, contribution: 0 },
  };
}

export function recommend(
  visitor: Visitor,
  slots: TimeSlot[],
  expositions: Exposition[],
  weights: Weights = DEFAULT_WEIGHTS,
): RecommendationResult {
  const expositionMap = new Map(expositions.map((e) => [e.id, e]));
  const venueSaturation = computeVenueSaturation(slots, expositions);

  const valid: SlotScore[] = [];
  const excluded: SlotScore[] = [];

  for (const slot of slots) {
    const exposition = expositionMap.get(slot.expositionId);
    if (!exposition) continue;

    const { valid: isValid, violations } = applyRules(slot, visitor);

    if (isValid) {
      valid.push(scoreSlot(visitor, slot, exposition, weights, venueSaturation.get(exposition.venueId)));
    } else {
      excluded.push({
        slot,
        exposition,
        score: 0,
        breakdown: zeroBreakdown(weights),
        excludedBy: violations,
      });
    }
  }

  valid.sort((a, b) => b.score - a.score);

  if (valid.length === 0) {
    return {
      best: null,
      alternatives: [],
      excluded,
      message: 'Aucun créneau disponible pour ce profil visiteur.',
    };
  }

  const [best, ...alternatives] = valid as [SlotScore, ...SlotScore[]];
  return { best, alternatives, excluded };
}
