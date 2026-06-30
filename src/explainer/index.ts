import type { RecommendationResult, SlotScore, ScoreBreakdown, CriterionScore, Itinerary } from '../types/index.js';

const CRITERION_LABELS: Record<keyof ScoreBreakdown, string> = {
  thematic: 'Adéq. thématique',
  crowd: 'Faible affluence',
  venue: 'Faible affl. lieu',
  timing: 'Pertinence horaire',
};

const RULE_LABELS: Record<string, string> = {
  invalidCapacity: 'capacité non définie ou nulle',
  isAvailable: 'hors plage de disponibilité',
  hasCapacity: 'complet',
  withinCrowdComfort: 'affluence trop élevée',
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function buildBreakdownTable(breakdown: ScoreBreakdown): string {
  const rows = (Object.entries(breakdown) as [keyof ScoreBreakdown, CriterionScore][]).map(
    ([key, cs]) => {
      const label = CRITERION_LABELS[key] + (cs.fallback ? '*' : '');
      return `  - ${label} : ${fmt(cs.value)} x ${fmt(cs.weight)} = ${fmt(cs.contribution)}`;
    },
  );

  return rows.join('\n');
}

function buildSynthesis(slotScore: SlotScore): string {
  const { slot, exposition, breakdown } = slotScore;
  const time = formatTime(slot.start);

  const top2 = (Object.entries(breakdown) as [keyof ScoreBreakdown, CriterionScore][])
    .sort((a, b) => b[1].contribution - a[1].contribution)
    .slice(0, 2)
    .map(([key, cs]) => `${CRITERION_LABELS[key].toLowerCase()} (${fmt(cs.value)})`);

  return `Créneau ${time} (${exposition.title}) recommandé — ${top2.join(' et ')}.`;
}

function buildExcludedList(excluded: SlotScore[]): string {
  const items = excluded.map((s) => {
    const time = formatTime(s.slot.start);
    const rules = (s.excludedBy ?? []).map((r) => RULE_LABELS[r] ?? r).join(', ');
    return `  - ${s.exposition.title} à ${time} → ${rules || 'raison inconnue'}`;
  });
  return `Créneaux exclus (${excluded.length}) :\n${items.join('\n')}`;
}

export function explainRecommendation(result: RecommendationResult): string {
  const lines: string[] = [];

  if (result.best === null) {
    lines.push(result.message ?? 'Aucun créneau disponible pour ce profil visiteur.');
    if (result.excluded.length > 0) {
      lines.push('');
      lines.push(buildExcludedList(result.excluded));
    }
    return lines.join('\n');
  }

  const { best, alternatives, excluded } = result;

  lines.push(`=== Recommandation (score : ${fmt(best.score)}) ===`);
  lines.push('');
  lines.push(buildBreakdownTable(best.breakdown));
  lines.push('');
  lines.push(buildSynthesis(best));

  if (alternatives.length > 0) {
    lines.push('');
    lines.push(`Alternatives (${alternatives.length}) :`);
    alternatives.forEach((alt, i) => {
      const time = formatTime(alt.slot.start);
      lines.push(`  ${i + 1}. ${alt.exposition.title} à ${time} — score : ${fmt(alt.score)}`);
    });
  }

  if (excluded.length > 0) {
    lines.push('');
    lines.push(buildExcludedList(excluded));
  }

  if (lines.some((l) => l.includes('*'))) {
    lines.push('');
    lines.push('* valeur estimée (donnée manquante)');
  }

  return lines.join('\n');
}

export function explainItinerary(itinerary: Itinerary): string {
  if (itinerary.steps.length === 0) {
    return 'Aucun parcours disponible pour ce profil visiteur.';
  }

  const lines: string[] = [];
  lines.push(
    `=== Parcours recommandé (${itinerary.steps.length} étapes — score total : ${fmt(itinerary.totalScore)}) ===`,
  );
  lines.push('');

  itinerary.steps.forEach((step, i) => {
    const time = formatTime(step.slot.start);
    const [topKey] = (Object.entries(step.breakdown) as [keyof ScoreBreakdown, CriterionScore][])
      .sort((a, b) => b[1].contribution - a[1].contribution)[0]!;
    lines.push(
      `  ${i + 1}. ${time} — ${step.exposition.title} — score : ${fmt(step.score)} (${CRITERION_LABELS[topKey].toLowerCase()})`,
    );
  });

  return lines.join('\n');
}
