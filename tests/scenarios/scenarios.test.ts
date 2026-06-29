import { describe, it, expect } from 'vitest';
import { pressed, thematic, comfort, saturated, scenarios } from '../../src/scenarios/index.js';
import { recommend } from '../../src/engine/recommender.js';
import { timeSlots, expositions } from '../../src/data/fixtures.js';

// ──────────────────────────────────────────────
// Validité de structure des 4 scénarios
// ──────────────────────────────────────────────
describe('Scénarios — résultat valide', () => {
  it.each(scenarios)('$name retourne une structure RecommendationResult valide', (scenario) => {
    const result = recommend(scenario.visitor, timeSlots, expositions, scenario.weights);
    expect(result).toHaveProperty('best');
    expect(result).toHaveProperty('alternatives');
    expect(result).toHaveProperty('excluded');
    expect(Array.isArray(result.alternatives)).toBe(true);
    expect(Array.isArray(result.excluded)).toBe(true);
    // best est soit null (aucun créneau) soit un SlotScore valide
    if (result.best !== null) {
      expect(result.best).toHaveProperty('slot');
      expect(result.best).toHaveProperty('exposition');
      expect(result.best).toHaveProperty('score');
      expect(result.best).toHaveProperty('breakdown');
    }
  });
});

// ──────────────────────────────────────────────
// Comportements différenciés entre scénarios
// ──────────────────────────────────────────────
describe('Scénarios — comportements différenciés', () => {
  const pressedResult = recommend(pressed.visitor, timeSlots, expositions, pressed.weights);
  const thematicResult = recommend(thematic.visitor, timeSlots, expositions, thematic.weights);
  const comfortResult = recommend(comfort.visitor, timeSlots, expositions, comfort.weights);
  const saturatedResult = recommend(saturated.visitor, timeSlots, expositions, saturated.weights);

  // ── saturated ──
  it('saturated retourne best: null (tous les créneaux dépassent le seuil de confort)', () => {
    expect(saturatedResult.best).toBeNull();
    expect(saturatedResult.excluded.length).toBeGreaterThan(0);
  });

  // ── thematic vs pressed ──
  it('thematic recommande un créneau thématiquement plus pertinent que pressed', () => {
    expect(thematicResult.best).not.toBeNull();
    expect(pressedResult.best).not.toBeNull();
    // thematic pondère la pertinence à 70% → le créneau recommandé a un score thématique plus élevé
    // thematic.best : 1 thème commun sur 2 préférences = 0.5
    // pressed.best  : 1 thème commun sur 4 préférences = 0.25
    expect(thematicResult.best!.breakdown.thematic.value).toBeGreaterThan(
      pressedResult.best!.breakdown.thematic.value,
    );
  });

  it('thematic : la contribution thématique domine le score du meilleur créneau', () => {
    expect(thematicResult.best).not.toBeNull();
    const { thematic: t, crowd, venue, timing } = thematicResult.best!.breakdown;
    expect(t.contribution).toBeGreaterThan(crowd.contribution);
    expect(t.contribution).toBeGreaterThan(venue.contribution);
    expect(t.contribution).toBeGreaterThan(timing.contribution);
  });

  // ── comfort ──
  it('comfort recommande un créneau peu fréquenté (crowdRatio ≤ maxCrowdRatio du visiteur)', () => {
    expect(comfortResult.best).not.toBeNull();
    const slot = comfortResult.best!.slot;
    const crowdRatio = slot.estimatedAttendance! / slot.capacity!;
    expect(crowdRatio).toBeLessThanOrEqual(comfort.visitor.maxCrowdRatio);
  });

  it('comfort exclut davantage de créneaux bondés que thematic (contrainte de foule plus stricte)', () => {
    // comfort.maxCrowdRatio=0.4 élimine 5 créneaux, thematic.maxCrowdRatio=0.75 n'en élimine que 3
    expect(comfortResult.excluded.length).toBeGreaterThan(thematicResult.excluded.length);
  });

  it('comfort : la contribution crowd domine le score du meilleur créneau', () => {
    expect(comfortResult.best).not.toBeNull();
    const { thematic: t, crowd, venue, timing } = comfortResult.best!.breakdown;
    expect(crowd.contribution).toBeGreaterThan(t.contribution);
    expect(crowd.contribution).toBeGreaterThan(venue.contribution);
    expect(crowd.contribution).toBeGreaterThan(timing.contribution);
  });
});
