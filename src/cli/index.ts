import { scenarios, type Scenario } from '../scenarios/index.js';
import { timeSlots, expositions } from '../data/fixtures.js';
import { recommend } from '../engine/recommender.js';
import { explainRecommendation } from '../explainer/index.js';

function printScenario(scenario: Scenario): void {
  const line = '═'.repeat(60);
  console.log(`\n${line}`);
  console.log(`  Scénario : ${scenario.name.toUpperCase()}`);
  console.log(`  ${scenario.description}`);
  console.log(`  Visiteur : ${scenario.visitor.name}`);
  console.log(line);

  const result = recommend(scenario.visitor, timeSlots, expositions, scenario.weights);
  console.log(explainRecommendation(result));
}

function main(): void {
  const scenarioName = process.argv[2];

  if (scenarioName) {
    const scenario = scenarios.find((s) => s.name === scenarioName);
    if (!scenario) {
      const known = scenarios.map((s) => s.name).join(', ');
      console.error(`Erreur : scénario "${scenarioName}" inconnu.`);
      console.error(`Scénarios disponibles : ${known}`);
      process.exit(1);
    }
    printScenario(scenario);
  } else {
    for (const scenario of scenarios) {
      printScenario(scenario);
    }
  }
}

main();
