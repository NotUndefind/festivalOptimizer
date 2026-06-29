import { describe, it, expect } from 'vitest';
import {
  isAvailable,
  hasCapacity,
  withinCrowdComfort,
  invalidCapacity,
  applyRules,
} from '../../src/engine/rules.js';
import type { TimeSlot, Visitor } from '../../src/types/index.js';

const BASE_SLOT: TimeSlot = {
  id: 'slot-1',
  expositionId: 'expo-1',
  start: '2026-07-10T10:00:00',
  end: '2026-07-10T12:00:00',
  capacity: 60,
  estimatedAttendance: 20,
};

const BASE_VISITOR: Visitor = {
  id: 'visitor-1',
  name: 'Test',
  availableFrom: '2026-07-10T09:00:00',
  availableTo: '2026-07-10T18:00:00',
  maxCrowdRatio: 0.8,
};

// ──────────────────────────────────────────────
// invalidCapacity
// ──────────────────────────────────────────────
describe('invalidCapacity', () => {
  it('retourne valid=true quand capacity > 0', () => {
    const result = invalidCapacity({ ...BASE_SLOT, capacity: 50 });
    expect(result.valid).toBe(true);
    expect(result.ruleName).toBe('invalidCapacity');
  });

  it('retourne valid=false quand capacity = 0', () => {
    const result = invalidCapacity({ ...BASE_SLOT, capacity: 0 });
    expect(result.valid).toBe(false);
  });

  it('retourne valid=false quand capacity est undefined', () => {
    const slot: TimeSlot = { ...BASE_SLOT, capacity: undefined };
    const result = invalidCapacity(slot);
    expect(result.valid).toBe(false);
  });

  it('retourne valid=false quand capacity < 0', () => {
    const result = invalidCapacity({ ...BASE_SLOT, capacity: -10 });
    expect(result.valid).toBe(false);
  });
});

// ──────────────────────────────────────────────
// isAvailable
// ──────────────────────────────────────────────
describe('isAvailable', () => {
  it('retourne valid=true quand le créneau est dans la plage visiteur', () => {
    const result = isAvailable(BASE_SLOT, BASE_VISITOR);
    expect(result.valid).toBe(true);
    expect(result.ruleName).toBe('isAvailable');
  });

  it('retourne valid=false quand le créneau commence avant la disponibilité', () => {
    const visitor: Visitor = {
      ...BASE_VISITOR,
      availableFrom: '2026-07-10T11:00:00',
    };
    const result = isAvailable(BASE_SLOT, visitor);
    expect(result.valid).toBe(false);
  });

  it('retourne valid=false quand le créneau se termine après la disponibilité', () => {
    const visitor: Visitor = {
      ...BASE_VISITOR,
      availableTo: '2026-07-10T11:00:00',
    };
    const result = isAvailable(BASE_SLOT, visitor);
    expect(result.valid).toBe(false);
  });

  it('retourne valid=true quand la plage visiteur est exactement égale au créneau', () => {
    const visitor: Visitor = {
      ...BASE_VISITOR,
      availableFrom: '2026-07-10T10:00:00',
      availableTo: '2026-07-10T12:00:00',
    };
    const result = isAvailable(BASE_SLOT, visitor);
    expect(result.valid).toBe(true);
  });

  it('retourne valid=false quand le créneau est entièrement hors plage', () => {
    const visitor: Visitor = {
      ...BASE_VISITOR,
      availableFrom: '2099-01-01T00:00:00',
      availableTo: '2099-01-01T01:00:00',
    };
    const result = isAvailable(BASE_SLOT, visitor);
    expect(result.valid).toBe(false);
  });
});

// ──────────────────────────────────────────────
// hasCapacity
// ──────────────────────────────────────────────
describe('hasCapacity', () => {
  it('retourne valid=true quand estimatedAttendance < capacity', () => {
    const result = hasCapacity({ ...BASE_SLOT, capacity: 60, estimatedAttendance: 20 });
    expect(result.valid).toBe(true);
    expect(result.ruleName).toBe('hasCapacity');
  });

  it('retourne valid=false quand estimatedAttendance = capacity (plein)', () => {
    const result = hasCapacity({ ...BASE_SLOT, capacity: 60, estimatedAttendance: 60 });
    expect(result.valid).toBe(false);
  });

  it('retourne valid=false quand estimatedAttendance > capacity (surchargé)', () => {
    const result = hasCapacity({ ...BASE_SLOT, capacity: 60, estimatedAttendance: 70 });
    expect(result.valid).toBe(false);
  });

  it('applique le repli 50% quand estimatedAttendance est undefined', () => {
    // capacity=60, attendance=undefined → repli=30 < 60 → valid
    const slot: TimeSlot = { ...BASE_SLOT, capacity: 60, estimatedAttendance: undefined };
    const result = hasCapacity(slot);
    expect(result.valid).toBe(true);
  });

  it('retourne valid=false quand capacity=0 (pas de place du tout)', () => {
    const result = hasCapacity({ ...BASE_SLOT, capacity: 0, estimatedAttendance: 0 });
    expect(result.valid).toBe(false);
  });
});

// ──────────────────────────────────────────────
// withinCrowdComfort
// ──────────────────────────────────────────────
describe('withinCrowdComfort', () => {
  it('retourne valid=true quand le ratio est inférieur au seuil visiteur', () => {
    // 20/60 ≈ 0.33, maxCrowdRatio=0.8
    const result = withinCrowdComfort(BASE_SLOT, BASE_VISITOR);
    expect(result.valid).toBe(true);
    expect(result.ruleName).toBe('withinCrowdComfort');
  });

  it('retourne valid=false quand le ratio dépasse le seuil visiteur', () => {
    // 55/60 ≈ 0.92, maxCrowdRatio=0.8
    const result = withinCrowdComfort(
      { ...BASE_SLOT, estimatedAttendance: 55 },
      BASE_VISITOR,
    );
    expect(result.valid).toBe(false);
  });

  it('retourne valid=true quand le ratio est exactement égal au seuil', () => {
    // 48/60 = 0.8, maxCrowdRatio=0.8
    const result = withinCrowdComfort(
      { ...BASE_SLOT, estimatedAttendance: 48 },
      BASE_VISITOR,
    );
    expect(result.valid).toBe(true);
  });

  it('utilise le repli 50% pour estimatedAttendance undefined', () => {
    // capacity=60, attendance=undefined → 30/60=0.5, maxCrowdRatio=0.8 → valid
    const slot: TimeSlot = { ...BASE_SLOT, capacity: 60, estimatedAttendance: undefined };
    const result = withinCrowdComfort(slot, BASE_VISITOR);
    expect(result.valid).toBe(true);
  });

  it('retourne valid=false pour visiteur très sensible à la foule (maxCrowdRatio=0.1)', () => {
    const strictVisitor: Visitor = { ...BASE_VISITOR, maxCrowdRatio: 0.1 };
    // 20/60 ≈ 0.33 > 0.1
    const result = withinCrowdComfort(BASE_SLOT, strictVisitor);
    expect(result.valid).toBe(false);
  });

  it('traite capacity=0 comme ratio=1 (exclu)', () => {
    const slot: TimeSlot = { ...BASE_SLOT, capacity: 0, estimatedAttendance: 0 };
    const result = withinCrowdComfort(slot, BASE_VISITOR);
    // ratio=1, maxCrowdRatio=0.8 → invalide
    expect(result.valid).toBe(false);
  });
});

// ──────────────────────────────────────────────
// applyRules
// ──────────────────────────────────────────────
describe('applyRules', () => {
  it('retourne valid=true quand toutes les règles passent', () => {
    const result = applyRules(BASE_SLOT, BASE_VISITOR);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('retourne les violations quand plusieurs règles échouent', () => {
    const badSlot: TimeSlot = {
      ...BASE_SLOT,
      capacity: 60,
      estimatedAttendance: 58, // ratio 0.97 > 0.8 → withinCrowdComfort + hasCapacity passent
    };
    const strictVisitor: Visitor = {
      ...BASE_VISITOR,
      maxCrowdRatio: 0.2,
      availableFrom: '2099-01-01T00:00:00',
      availableTo: '2099-01-01T01:00:00',
    };
    const result = applyRules(badSlot, strictVisitor);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('isAvailable');
    expect(result.violations).toContain('withinCrowdComfort');
  });

  it('lève une erreur si slot est null', () => {
    expect(() => applyRules(null, BASE_VISITOR)).toThrow('slot must not be null or undefined');
  });

  it('lève une erreur si slot est undefined', () => {
    expect(() => applyRules(undefined, BASE_VISITOR)).toThrow('slot must not be null or undefined');
  });

  it('lève une erreur si visitor est null', () => {
    expect(() => applyRules(BASE_SLOT, null)).toThrow('visitor must not be null or undefined');
  });

  it('lève une erreur si visitor est undefined', () => {
    expect(() => applyRules(BASE_SLOT, undefined)).toThrow('visitor must not be null or undefined');
  });

  it('inclut invalidCapacity dans les violations si capacity <= 0', () => {
    const slot: TimeSlot = { ...BASE_SLOT, capacity: 0 };
    const result = applyRules(slot, BASE_VISITOR);
    expect(result.violations).toContain('invalidCapacity');
  });
});
