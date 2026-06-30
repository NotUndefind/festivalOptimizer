import { describe, it, expect } from 'vitest';
import { recommendItinerary } from '../../src/engine/itinerary.js';
import { timeSlots, expositions, visitors } from '../../src/data/fixtures.js';
import type { TimeSlot } from '../../src/types/index.js';

const VISITOR = visitors.find((v) => v.id === 'visitor-thematic')!;

function overlaps(a: TimeSlot, b: TimeSlot): boolean {
  const aStart = new Date(a.start).getTime();
  const aEnd = new Date(a.end).getTime();
  const bStart = new Date(b.start).getTime();
  const bEnd = new Date(b.end).getTime();
  return aStart < bEnd && bStart < aEnd;
}

describe('recommendItinerary', () => {
  it('ne retient aucune paire de créneaux qui se chevauchent', () => {
    const { steps } = recommendItinerary(VISITOR, timeSlots, expositions);
    for (let i = 0; i < steps.length; i++) {
      for (let j = i + 1; j < steps.length; j++) {
        expect(overlaps(steps[i]!.slot, steps[j]!.slot)).toBe(false);
      }
    }
  });

  it('trie les étapes par horaire croissant et respecte la plage de dispo', () => {
    const { steps } = recommendItinerary(VISITOR, timeSlots, expositions);
    const from = new Date(VISITOR.availableFrom).getTime();
    const to = new Date(VISITOR.availableTo).getTime();
    for (let i = 1; i < steps.length; i++) {
      const prev = new Date(steps[i - 1]!.slot.start).getTime();
      const cur = new Date(steps[i]!.slot.start).getTime();
      expect(cur).toBeGreaterThanOrEqual(prev);
    }
    for (const step of steps) {
      expect(new Date(step.slot.start).getTime()).toBeGreaterThanOrEqual(from);
      expect(new Date(step.slot.end).getTime()).toBeLessThanOrEqual(to);
    }
  });

  it('borne le nombre d’étapes par maxStops', () => {
    const { steps } = recommendItinerary(VISITOR, timeSlots, expositions, undefined, 2);
    expect(steps.length).toBeLessThanOrEqual(2);
  });

  it('renvoie totalScore = somme des scores des étapes', () => {
    const { steps, totalScore } = recommendItinerary(VISITOR, timeSlots, expositions);
    const expected = steps.reduce((sum, s) => sum + s.score, 0);
    expect(totalScore).toBeCloseTo(expected);
  });

  it('renvoie un parcours vide quand aucun créneau n’est valide', () => {
    const impossible = { ...VISITOR, availableFrom: '2099-01-01T00:00:00', availableTo: '2099-01-01T01:00:00' };
    const itinerary = recommendItinerary(impossible, timeSlots, expositions);
    expect(itinerary.steps).toEqual([]);
    expect(itinerary.totalScore).toBe(0);
  });
});
