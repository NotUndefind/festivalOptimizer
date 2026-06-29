import { describe, it, expect } from 'vitest';
import { scoreSlot, computeVenueSaturation } from '../../src/engine/scoring.js';
import { DEFAULT_WEIGHTS } from '../../src/config/weights.js';
import type { TimeSlot, Visitor, Exposition } from '../../src/types/index.js';

const BASE_VISITOR: Visitor = {
  id: 'visitor-1',
  name: 'Test',
  preferredThemes: ['photo de rue', 'portrait'],
  availableFrom: '2026-07-10T09:00:00',
  availableTo: '2026-07-10T18:00:00',
  maxCrowdRatio: 0.8,
};

const BASE_SLOT: TimeSlot = {
  id: 'slot-1',
  expositionId: 'expo-1',
  start: '2026-07-10T09:00:00',
  end: '2026-07-10T11:00:00',
  capacity: 100,
  estimatedAttendance: 20,
};

const BASE_EXPO: Exposition = {
  id: 'expo-1',
  title: 'Test Expo',
  themes: ['photo de rue', 'portrait'],
  venueId: 'venue-1',
};

// ──────────────────────────────────────────────
// Critère thématique
// ──────────────────────────────────────────────
describe('scoreSlot — critère thématique', () => {
  it('retourne 1.0 quand tous les thèmes préférés correspondent', () => {
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO);
    expect(result.breakdown.thematic.value).toBe(1);
  });

  it('retourne 0.5 quand la moitié des thèmes correspondent', () => {
    const expo: Exposition = { ...BASE_EXPO, themes: ['photo de rue'] };
    // préférences: 2 thèmes, commun: 1 → 1/2 = 0.5
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, expo);
    expect(result.breakdown.thematic.value).toBe(0.5);
  });

  it('retourne 0.0 quand aucun thème ne correspond', () => {
    const expo: Exposition = { ...BASE_EXPO, themes: ['paysage'] };
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, expo);
    expect(result.breakdown.thematic.value).toBe(0);
  });

  it('retourne 0.5 (repli) quand preferredThemes est vide et marque fallback=true', () => {
    const visitor: Visitor = { ...BASE_VISITOR, preferredThemes: [] };
    const result = scoreSlot(visitor, BASE_SLOT, BASE_EXPO);
    expect(result.breakdown.thematic.value).toBe(0.5);
    expect(result.breakdown.thematic.fallback).toBe(true);
  });

  it('retourne 0.5 (repli) quand preferredThemes est undefined et marque fallback=true', () => {
    const visitor: Visitor = { ...BASE_VISITOR, preferredThemes: undefined };
    const result = scoreSlot(visitor, BASE_SLOT, BASE_EXPO);
    expect(result.breakdown.thematic.value).toBe(0.5);
    expect(result.breakdown.thematic.fallback).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Critère crowd
// ──────────────────────────────────────────────
describe('scoreSlot — critère crowd', () => {
  it("retourne proche de 1.0 quand l'affluence est très faible", () => {
    // 0/100 → crowd = 1 - 0 = 1
    const slot: TimeSlot = { ...BASE_SLOT, estimatedAttendance: 0 };
    const result = scoreSlot(BASE_VISITOR, slot, BASE_EXPO);
    expect(result.breakdown.crowd.value).toBe(1);
  });

  it("retourne 0.5 quand l'affluence est à 50%", () => {
    const slot: TimeSlot = { ...BASE_SLOT, capacity: 100, estimatedAttendance: 50 };
    const result = scoreSlot(BASE_VISITOR, slot, BASE_EXPO);
    expect(result.breakdown.crowd.value).toBe(0.5);
  });

  it('retourne 0.0 quand la salle est pleine', () => {
    const slot: TimeSlot = { ...BASE_SLOT, capacity: 100, estimatedAttendance: 100 };
    const result = scoreSlot(BASE_VISITOR, slot, BASE_EXPO);
    expect(result.breakdown.crowd.value).toBe(0);
  });

  it('utilise le repli 50% quand estimatedAttendance est undefined et marque fallback=true', () => {
    const slot: TimeSlot = { ...BASE_SLOT, capacity: 100, estimatedAttendance: undefined };
    const result = scoreSlot(BASE_VISITOR, slot, BASE_EXPO);
    expect(result.breakdown.crowd.value).toBe(0.5);
    expect(result.breakdown.crowd.fallback).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Critère venue (saturation du lieu)
// ──────────────────────────────────────────────
describe('scoreSlot — critère venue', () => {
  it('reprend la valeur de saturation du lieu fournie', () => {
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO, DEFAULT_WEIGHTS, {
      value: 0.7,
      fallback: false,
    });
    expect(result.breakdown.venue.value).toBe(0.7);
    expect(result.breakdown.venue.fallback).toBeUndefined();
  });

  it('propage le drapeau fallback du lieu', () => {
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO, DEFAULT_WEIGHTS, {
      value: 0.4,
      fallback: true,
    });
    expect(result.breakdown.venue.value).toBe(0.4);
    expect(result.breakdown.venue.fallback).toBe(true);
  });

  it('utilise un repli neutre (0.5, fallback) quand la saturation du lieu est absente', () => {
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO);
    expect(result.breakdown.venue.value).toBe(0.5);
    expect(result.breakdown.venue.fallback).toBe(true);
  });
});

// ──────────────────────────────────────────────
// computeVenueSaturation
// ──────────────────────────────────────────────
describe('computeVenueSaturation', () => {
  const EXPOS: Exposition[] = [
    { id: 'expo-a', title: 'A', themes: [], venueId: 'venue-1' },
    { id: 'expo-b', title: 'B', themes: [], venueId: 'venue-1' },
    { id: 'expo-c', title: 'C', themes: [], venueId: 'venue-2' },
  ];

  it('agrège l’affluence par lieu : score = 1 − Σatt/Σcap', () => {
    const slots: TimeSlot[] = [
      { id: 's1', expositionId: 'expo-a', start: '', end: '', capacity: 100, estimatedAttendance: 40 },
      { id: 's2', expositionId: 'expo-b', start: '', end: '', capacity: 100, estimatedAttendance: 60 },
    ];
    const map = computeVenueSaturation(slots, EXPOS);
    // venue-1 : (40+60)/(100+100) = 0.5 → score 0.5
    expect(map.get('venue-1')!.value).toBe(0.5);
    expect(map.get('venue-1')!.fallback).toBe(false);
  });

  it('isole correctement deux lieux distincts', () => {
    const slots: TimeSlot[] = [
      { id: 's1', expositionId: 'expo-a', start: '', end: '', capacity: 100, estimatedAttendance: 80 },
      { id: 's2', expositionId: 'expo-c', start: '', end: '', capacity: 100, estimatedAttendance: 20 },
    ];
    const map = computeVenueSaturation(slots, EXPOS);
    expect(map.get('venue-1')!.value).toBeCloseTo(0.2, 10); // 1 − 80/100
    expect(map.get('venue-2')!.value).toBeCloseTo(0.8, 10); // 1 − 20/100
  });

  it('marque fallback=true quand une affluence du lieu est manquante (repli 50%)', () => {
    const slots: TimeSlot[] = [
      { id: 's1', expositionId: 'expo-a', start: '', end: '', capacity: 100, estimatedAttendance: undefined },
    ];
    const map = computeVenueSaturation(slots, EXPOS);
    // repli attendance = 100 × 0.5 = 50 → score 1 − 0.5 = 0.5
    expect(map.get('venue-1')!.value).toBe(0.5);
    expect(map.get('venue-1')!.fallback).toBe(true);
  });

  it('ignore les créneaux dont l’exposition est inconnue', () => {
    const slots: TimeSlot[] = [
      { id: 's1', expositionId: 'expo-inconnue', start: '', end: '', capacity: 100, estimatedAttendance: 50 },
    ];
    const map = computeVenueSaturation(slots, EXPOS);
    expect(map.size).toBe(0);
  });
});

// ──────────────────────────────────────────────
// Critère timing
// ──────────────────────────────────────────────
describe('scoreSlot — critère timing', () => {
  it('retourne 1.0 quand le créneau commence au début de la plage visiteur', () => {
    // slot start = availableFrom → score timing = 1 - (0 / range) = 1
    const visitor: Visitor = {
      ...BASE_VISITOR,
      availableFrom: '2026-07-10T09:00:00',
      availableTo: '2026-07-10T18:00:00',
    };
    const slot: TimeSlot = { ...BASE_SLOT, start: '2026-07-10T09:00:00' };
    const result = scoreSlot(visitor, slot, BASE_EXPO);
    expect(result.breakdown.timing.value).toBe(1);
  });

  it('retourne 0.0 quand le créneau commence en fin de plage', () => {
    // slot start = availableTo → score = 1 - range/range = 0
    const visitor: Visitor = {
      ...BASE_VISITOR,
      availableFrom: '2026-07-10T09:00:00',
      availableTo: '2026-07-10T18:00:00',
    };
    const slot: TimeSlot = { ...BASE_SLOT, start: '2026-07-10T18:00:00' };
    const result = scoreSlot(visitor, slot, BASE_EXPO);
    expect(result.breakdown.timing.value).toBe(0);
  });

  it('retourne 1.0 quand la plage visiteur est nulle (range=0)', () => {
    const visitor: Visitor = {
      ...BASE_VISITOR,
      availableFrom: '2026-07-10T10:00:00',
      availableTo: '2026-07-10T10:00:00',
    };
    const result = scoreSlot(visitor, BASE_SLOT, BASE_EXPO);
    expect(result.breakdown.timing.value).toBe(1);
  });

  it("retourne une valeur décroissante selon l'heure de début", () => {
    const visitor: Visitor = {
      ...BASE_VISITOR,
      availableFrom: '2026-07-10T09:00:00',
      availableTo: '2026-07-10T18:00:00',
    };
    const slotEarly: TimeSlot = { ...BASE_SLOT, start: '2026-07-10T10:00:00' };
    const slotLate: TimeSlot = { ...BASE_SLOT, start: '2026-07-10T15:00:00' };
    const early = scoreSlot(visitor, slotEarly, BASE_EXPO);
    const late = scoreSlot(visitor, slotLate, BASE_EXPO);
    expect(early.breakdown.timing.value).toBeGreaterThan(late.breakdown.timing.value);
  });
});

// ──────────────────────────────────────────────
// Score final et structure
// ──────────────────────────────────────────────
describe('scoreSlot — score final', () => {
  it('le score final est la somme des contributions pondérées', () => {
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO);
    const { thematic, crowd, venue, timing } = result.breakdown;
    const expected =
      thematic.contribution + crowd.contribution + venue.contribution + timing.contribution;
    expect(result.score).toBeCloseTo(expected, 10);
  });

  it('la contribution = valeur × poids pour chaque critère', () => {
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO);
    const { thematic, crowd, venue, timing } = result.breakdown;
    expect(thematic.contribution).toBeCloseTo(thematic.value * thematic.weight, 10);
    expect(crowd.contribution).toBeCloseTo(crowd.value * crowd.weight, 10);
    expect(venue.contribution).toBeCloseTo(venue.value * venue.weight, 10);
    expect(timing.contribution).toBeCloseTo(timing.value * timing.weight, 10);
  });

  it('les poids correspondent aux DEFAULT_WEIGHTS', () => {
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO);
    expect(result.breakdown.thematic.weight).toBe(DEFAULT_WEIGHTS.thematic);
    expect(result.breakdown.crowd.weight).toBe(DEFAULT_WEIGHTS.crowd);
    expect(result.breakdown.venue.weight).toBe(DEFAULT_WEIGHTS.venue);
    expect(result.breakdown.timing.weight).toBe(DEFAULT_WEIGHTS.timing);
  });

  it('les poids personnalisés sont bien utilisés', () => {
    const customWeights = { thematic: 0.70, crowd: 0.10, venue: 0.10, timing: 0.10 };
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO, customWeights);
    expect(result.breakdown.thematic.weight).toBe(0.70);
  });

  it("le résultat inclut le slot et l'exposition", () => {
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO);
    expect(result.slot).toBe(BASE_SLOT);
    expect(result.exposition).toBe(BASE_EXPO);
  });

  it('le score est compris entre 0 et 1', () => {
    const result = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});

// ──────────────────────────────────────────────
// Déterminisme
// ──────────────────────────────────────────────
describe('scoreSlot — déterminisme', () => {
  it('retourne le même score pour les mêmes entrées (appel répété)', () => {
    const r1 = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO);
    const r2 = scoreSlot(BASE_VISITOR, BASE_SLOT, BASE_EXPO);
    expect(r1.score).toBe(r2.score);
  });

  it("retourne le même score indépendamment de l'ordre d'appel", () => {
    const slotA: TimeSlot = { ...BASE_SLOT, id: 'slot-a', estimatedAttendance: 10 };
    const slotB: TimeSlot = { ...BASE_SLOT, id: 'slot-b', estimatedAttendance: 40 };
    const scoreA1 = scoreSlot(BASE_VISITOR, slotA, BASE_EXPO).score;
    const scoreB1 = scoreSlot(BASE_VISITOR, slotB, BASE_EXPO).score;
    // Appel inversé
    const scoreB2 = scoreSlot(BASE_VISITOR, slotB, BASE_EXPO).score;
    const scoreA2 = scoreSlot(BASE_VISITOR, slotA, BASE_EXPO).score;
    expect(scoreA1).toBe(scoreA2);
    expect(scoreB1).toBe(scoreB2);
  });
});

// ──────────────────────────────────────────────
// Entrées invalides
// ──────────────────────────────────────────────
describe('scoreSlot — entrées invalides', () => {
  it('lève une erreur si visitor est null', () => {
    expect(() => scoreSlot(null, BASE_SLOT, BASE_EXPO)).toThrow(
      'visitor must not be null or undefined',
    );
  });

  it('lève une erreur si visitor est undefined', () => {
    expect(() => scoreSlot(undefined, BASE_SLOT, BASE_EXPO)).toThrow(
      'visitor must not be null or undefined',
    );
  });

  it('lève une erreur si slot est null', () => {
    expect(() => scoreSlot(BASE_VISITOR, null, BASE_EXPO)).toThrow(
      'slot must not be null or undefined',
    );
  });

  it('lève une erreur si slot est undefined', () => {
    expect(() => scoreSlot(BASE_VISITOR, undefined, BASE_EXPO)).toThrow(
      'slot must not be null or undefined',
    );
  });
});
