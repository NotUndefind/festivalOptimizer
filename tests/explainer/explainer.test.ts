import { describe, it, expect } from 'vitest';
import { explainRecommendation } from '../../src/explainer/index.js';
import { recommend } from '../../src/engine/recommender.js';
import { timeSlots, expositions, visitors } from '../../src/data/fixtures.js';
import type { RecommendationResult } from '../../src/types/index.js';

const DEFAULT_VISITOR = visitors[0]!;

describe('explainRecommendation', () => {
  describe('cas best: null', () => {
    it('affiche le message "Aucun créneau disponible"', () => {
      const result: RecommendationResult = {
        best: null,
        alternatives: [],
        excluded: [],
        message: 'Aucun créneau disponible pour ce profil visiteur.',
      };
      const output = explainRecommendation(result);
      expect(output).toContain('Aucun créneau disponible');
    });

    it('liste les exclusions quand elles existent', () => {
      const impossibleVisitor = {
        ...DEFAULT_VISITOR,
        availableFrom: '2099-01-01T00:00:00',
        availableTo: '2099-01-01T01:00:00',
      };
      const result = recommend(impossibleVisitor, timeSlots, expositions);
      expect(result.best).toBeNull();

      const output = explainRecommendation(result);
      expect(output).toContain('Créneaux exclus');
      expect(output).toContain('hors plage de disponibilité');
    });
  });

  describe('cas best non null', () => {
    it('affiche le score total', () => {
      const result = recommend(DEFAULT_VISITOR, timeSlots, expositions);
      expect(result.best).not.toBeNull();

      const output = explainRecommendation(result);
      expect(output).toContain('Recommandation (score :');
    });

    it('affiche le tableau de décomposition avec les 4 critères', () => {
      const result = recommend(DEFAULT_VISITOR, timeSlots, expositions);
      const output = explainRecommendation(result);

      expect(output).toContain('Adéq. thématique');
      expect(output).toContain('Faible affluence');
      expect(output).toContain('Faible affl. lieu');
      expect(output).toContain('Pertinence horaire');
      expect(output).toContain('Valeur');
      expect(output).toContain('Poids');
      expect(output).toContain('Contribution');
    });

    it('affiche la phrase de synthèse', () => {
      const result = recommend(DEFAULT_VISITOR, timeSlots, expositions);
      const output = explainRecommendation(result);
      expect(output).toContain('recommandé —');
    });

    it('affiche les alternatives quand elles existent', () => {
      const result = recommend(DEFAULT_VISITOR, timeSlots, expositions);
      const output = explainRecommendation(result);
      if (result.alternatives.length > 0) {
        expect(output).toContain('Alternatives');
      }
    });

    it('affiche les créneaux exclus avec la règle déclenchée', () => {
      const restrictedVisitor = {
        ...DEFAULT_VISITOR,
        maxCrowdRatio: 0.01,
      };
      const result = recommend(restrictedVisitor, timeSlots, expositions);
      const output = explainRecommendation(result);

      if (result.excluded.length > 0) {
        expect(output).toContain('Créneaux exclus');
      }
    });

    it('la note fallback (*) apparaît si une valeur est estimée', () => {
      const visitorNoThemes = { ...DEFAULT_VISITOR, preferredThemes: [] };
      const result = recommend(visitorNoThemes, timeSlots, expositions);
      const output = explainRecommendation(result);
      expect(output).toContain('*');
      expect(output).toContain('valeur estimée');
    });
  });

  describe('format du tableau', () => {
    it('valeurs formatées à 2 décimales', () => {
      const result = recommend(DEFAULT_VISITOR, timeSlots, expositions);
      const output = explainRecommendation(result);
      // Les valeurs dans le tableau sont du type "0.xx"
      expect(output).toMatch(/\d+\.\d{2}/);
    });

    it('les bordures du tableau sont présentes', () => {
      const result = recommend(DEFAULT_VISITOR, timeSlots, expositions);
      const output = explainRecommendation(result);
      expect(output).toContain('┌');
      expect(output).toContain('└');
      expect(output).toContain('│');
    });
  });
});
