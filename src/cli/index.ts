import { scenarios, type Scenario } from '../scenarios/index.js';
import { timeSlots, expositions } from '../data/fixtures.js';
import { recommend } from '../engine/recommender.js';
import { recommendItinerary } from '../engine/itinerary.js';
import { explainRecommendation, explainItinerary } from '../explainer/index.js';

function printScenario(scenario: Scenario, itineraryMode: boolean): void {
  const line = '═'.repeat(60);
  console.log(`\n${line}`);
  console.log(`  Scénario : ${scenario.name.toUpperCase()}${itineraryMode ? ' (parcours)' : ''}`);
  console.log(`  ${scenario.description}`);
  console.log(`  Visiteur : ${scenario.visitor.name}`);
  console.log(line);

  if (itineraryMode) {
    const itinerary = recommendItinerary(scenario.visitor, timeSlots, expositions, scenario.weights);
    console.log(explainItinerary(itinerary));
  } else {
    const result = recommend(scenario.visitor, timeSlots, expositions, scenario.weights);
    console.log(explainRecommendation(result));
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const itineraryMode = args.includes('--parcours') || args.includes('-p');
  const scenarioName = args.find((a) => !a.startsWith('-'));

  if (scenarioName) {
    const scenario = scenarios.find((s) => s.name === scenarioName);
    if (!scenario) {
      const known = scenarios.map((s) => s.name).join(', ');
      console.error(`Erreur : scénario "${scenarioName}" inconnu.`);
      console.error(`Scénarios disponibles : ${known}`);
      process.exit(1);
    }
    printScenario(scenario, itineraryMode);
  } else {
    for (const scenario of scenarios) {
      printScenario(scenario, itineraryMode);
    }
  }
}

main();
