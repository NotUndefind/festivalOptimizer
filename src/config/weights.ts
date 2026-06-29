// Somme des poids = 1.0
export interface Weights {
  thematic: number;
  crowd: number;
  venue: number;
  timing: number;
}

export const DEFAULT_WEIGHTS: Weights = {
  thematic: 0.40,
  crowd: 0.30,
  venue: 0.20,
  timing: 0.10,
};
