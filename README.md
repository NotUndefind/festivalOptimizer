# Festival Optimizer

Outil CLI de recommandation pour un festival de photographie. Il calcule un score pondéré pour chaque créneau disponible et propose soit le meilleur créneau unique, soit un parcours de visites sans chevauchement, selon le profil du visiteur.

---

## Commandes

```bash
npm install                                     # Installer les dépendances

npm start                                       # Lancer tous les scénarios (créneau unique)
npm start -- --parcours                         # Lancer tous les scénarios en mode parcours
npm run scenario -- <nom>                       # Un scénario précis (pressed | thematic | comfort | saturated)
npm run scenario -- <nom> --parcours            # Même scénario en mode parcours (-p fonctionne aussi)

npm test                                        # Lancer les tests unitaires
npm run typecheck                               # Vérifier les types TypeScript
```

---

## Modèle de scoring

Chaque créneau est évalué sur **4 critères**, chacun normalisé entre 0 et 1. Le score final est une **somme pondérée** des contributions :

```
score = Σ (valeur_critère × poids_critère)
```

| Critère | Calcul | Pondération par défaut | Justification |
|---|---|---|---|
| **Adéquation thématique** | `thèmes communs / thèmes préférés` — 0.5 si aucune préférence | 0.40 | Critère d'intérêt principal d'un visiteur |
| **Faible affluence** | `1 − (présents / capacité)` du créneau | 0.30 | Confort immédiat du créneau visé |
| **Faible saturation du lieu** | `1 − (Σ présents du lieu / Σ capacité du lieu)` | 0.20 | Pénalise un lieu globalement bondé, même si CE créneau est calme (≠ affluence du seul créneau) |
| **Pertinence horaire** | `1 − (début_créneau − début_dispo) / durée_dispo` | 0.10 | Préférence pour les créneaux en début de plage |

> Les deux critères d'affluence sont **distincts** : « Faible affluence » mesure le créneau précis, « Faible saturation du lieu » agrège tous les créneaux du même lieu (venue). Un créneau calme dans un lieu engorgé sera ainsi nuancé.

Les pondérations par défaut (0.40 / 0.30 / 0.20 / 0.10) sont arbitraires et peuvent être écrasées par scénario. Elles reflètent un visiteur-type qui privilégie le contenu avant le confort.

### Règles d'exclusion (avant scoring)

Un créneau est **exclu** (non scoré) si l'une des règles suivantes est violée :

| Règle | Condition d'exclusion |
|---|---|
| `invalidCapacity` | Capacité non définie ou nulle |
| `isAvailable` | Créneau hors de la plage de disponibilité du visiteur |
| `hasCapacity` | Créneau complet (`présents ≥ capacité`) |
| `withinCrowdComfort` | Ratio d'affluence dépasse `maxCrowdRatio` du visiteur |

---

## Scénarios prédéfinis

Quatre scénarios illustrent différents profils visiteur et jeux de pondérations :

| Nom | Visiteur | Profil | Pondérations clés |
|---|---|---|---|
| `pressed` | Alex (Pressé) | Disponible 12h–15h seulement | timing × 0.50 — le temps prime |
| `thematic` | Sophie (Thématique) | Passionnée photo de rue & portrait | thematic × 0.70 — le contenu prime |
| `comfort` | Marc (Confort) | Très sensible à la foule (max 40 %) | crowd × 0.60 — l'ambiance prime |
| `saturated` | Emma (Exigeante) | Seuil de foule extrêmement bas (15 %) | Aucun créneau valide — cas limite |

```bash
npm run scenario -- pressed     # Visiteur contraint en temps
npm run scenario -- thematic    # Visiteur passionné par ses thèmes
npm run scenario -- comfort     # Visiteur fuyant la foule
npm run scenario -- saturated   # Festival bondé — aucun créneau disponible
```

---

## Mode parcours (`--parcours`)

Le flag `--parcours` (alias `-p`) active un mode de recommandation séquentielle : au lieu d'un seul créneau optimal, le moteur construit un **parcours de 3 étapes maximum** sans chevauchement horaire.

**Algorithme glouton** :
1. Tous les créneaux sont scorés et classés (même logique que le mode créneau unique).
2. Le meilleur créneau est sélectionné en premier.
3. Chaque candidat suivant est ajouté uniquement s'il ne chevauche temporellement aucun créneau déjà retenu.
4. Les étapes retenues sont triées par heure de début pour un affichage chronologique.

```bash
npm run scenario -- thematic --parcours   # Parcours de Sophie (photo de rue & portrait)
npm start -- --parcours                   # Parcours pour tous les scénarios
```

Le score total affiché est la **somme des scores individuels** des étapes retenues.

---

## Hypothèses

- **Affluence statique** : les `estimatedAttendance` sont des valeurs fixes au moment de la recommandation. Aucune dynamique temporelle n'est modélisée (pas de montée en charge au fil de la journée).
- **Pondérations arbitraires** : les poids par défaut et par scénario ont été définis manuellement pour illustrer des comportements distincts, sans calibration empirique.
- **Données fictives** : les expositions, créneaux et visiteurs sont entièrement inventés pour les besoins du projet. Ils ne représentent pas un festival réel.
- **Mode par défaut — créneau unique** : sans `--parcours`, le système recommande un seul créneau optimal. Le mode parcours étend ce comportement mais reste limité à 3 étapes sans optimisation globale de l'enchaînement.

---

## Limites

- **Pas de temps réel** : les données d'affluence sont statiques. Un système réel nécessiterait une mise à jour en continu (API billetterie, comptage physique).
- **Heuristique non optimale** : la somme pondérée est une heuristique simple. Elle ne garantit pas l'optimum global (par exemple, un algorithme multi-objectifs trouverait potentiellement de meilleures solutions).
- **Parcours glouton non optimal** : le mode `--parcours` construit une séquence sans chevauchement par sélection gloutonne (meilleur score d'abord). Il ne garantit pas le parcours global optimal — un algorithme exhaustif ou par backtracking pourrait trouver une meilleure combinaison. Les déplacements entre lieux ne sont pas modélisés (pas de contrainte de temps de trajet).
- **Scoring thématique simplifié** : la correspondance thématique est calculée par intersection exacte de chaînes de caractères, sans similarité sémantique ni hiérarchie de thèmes.

---

## Structure du projet

```
src/
  cli/          Entrée CLI — parsing args, flag --parcours, orchestration
  config/       Pondérations par défaut (weights.ts)
  data/         Données fictives (fixtures.ts)
  engine/       Moteur : rules.ts, scoring.ts, recommender.ts, itinerary.ts
  explainer/    Formatage lisible des résultats (créneau unique et parcours)
  scenarios/    4 scénarios prédéfinis
  types/        Types TypeScript métier
tests/          Tests unitaires (Vitest)
```
