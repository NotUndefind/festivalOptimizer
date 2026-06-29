import type { Visitor } from '../types/index.js';
import { type Weights } from '../config/weights.js';
import { visitors } from '../data/fixtures.js';

export interface Scenario {
  name: string;
  description: string;
  visitor: Visitor;
  weights: Weights;
}

export const pressed: Scenario = {
  name: 'pressed',
  description: 'Visiteur avec peu de temps disponible (12h–15h) — le timing prime sur tout.',
  visitor: visitors.find((v) => v.id === 'visitor-pressed')!,
  weights: { thematic: 0.20, crowd: 0.20, venue: 0.10, timing: 0.50 },
};

export const thematic: Scenario = {
  name: 'thematic',
  description: 'Visiteur passionné par des thèmes précis — la pertinence thématique prime.',
  visitor: visitors.find((v) => v.id === 'visitor-thematic')!,
  weights: { thematic: 0.70, crowd: 0.15, venue: 0.10, timing: 0.05 },
};

export const comfort: Scenario = {
  name: 'comfort',
  description: 'Visiteur très sensible à la foule (maxCrowdRatio 0.4) — évite les créneaux bondés.',
  visitor: visitors.find((v) => v.id === 'visitor-comfort')!,
  weights: { thematic: 0.20, crowd: 0.60, venue: 0.15, timing: 0.05 },
};

// Visiteur avec tolérance à la foule extrêmement basse (0.15) :
// tous les créneaux du jeu de données (min ~20% d'affluence) sont exclus → best: null
export const saturated: Scenario = {
  name: 'saturated',
  description: 'Festival bondé — tous les créneaux dépassent le seuil de confort, aucun créneau valide.',
  visitor: {
    id: 'visitor-saturated',
    name: 'Emma (Exigeante)',
    preferredThemes: ['portrait', 'paysage'],
    availableFrom: '2026-07-10T09:00:00',
    availableTo: '2026-07-10T18:00:00',
    maxCrowdRatio: 0.15,
  },
  weights: { thematic: 0.25, crowd: 0.50, venue: 0.15, timing: 0.10 },
};

export const scenarios: Scenario[] = [pressed, thematic, comfort, saturated];
