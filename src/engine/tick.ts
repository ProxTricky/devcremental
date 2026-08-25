import Decimal from "break_eternity.js";
import {
  AUTO_COMPLETE_TAUX,
  CAFE_COUT_PAR_USAGE,
  CAFE_DUREE_BUFF,
  CAFE_MAX_STOCK,
  CAFE_REGEN_RATE_PER_SECOND,
  COEF_DETTE_ACTE,
  GENERATOR_IDS,
  SEED_STARS_TRANSITION,
  SEUIL_FIN_ACTE_1,
  TAUX_BUG,
  TAUX_REFACTOR,
  TESTS_AUTO_MULT_COEF_DETTE,
} from "./constants";
import {
  archetypeProdMultiplier,
  archetypeStaticMultipliers,
  bugMultiplier,
  clickProduction,
  generatorRate,
  impactBugEffectif,
  locNetteTickAvecDette,
  rubberDuckFixRate,
} from "./formulas";
import type { GameState, TickInput } from "./types";

/**
 * Un pas de simulation logique (durée `dt`, normalement TICK_DT = 0.1s à 10/s).
 * Fonction PURE : (state, dt, input) déterministe → même state en sortie. C'est
 * cette pureté qui garantit que l'accumulator (accumulator.ts) peut rattraper N
 * ticks de retard en boucle sans diverger d'un résultat "N ticks appelés un par un".
 *
 * Implémente le pipeline exact de docs/design/acte-1-solo-dev.md §3.5, dans
 * l'ordre documenté là-bas (l'ordre est normatif, pas un détail d'implémentation).
 *
 * Convention de nommage (spec §3.5, reprise ici sans exception) : une variable
 * `taux*` est un **débit** ("/s") et doit être multipliée par `dt` avant d'affecter
 * un compteur ; une variable `*Tick` est déjà une **quantité pour ce tick** et ne
 * doit JAMAIS être remultipliée par `dt`. `dt` n'apparaît donc explicitement
 * qu'aux étapes 3 et 6 ci-dessous, nulle part ailleurs — c'est l'ambiguïté de
 * nommage (une même variable `prodBrute` utilisée pour les deux sens à la fois)
 * qui avait laissé passer le Finding A (générateurs jamais mis à l'échelle du
 * tick, ~10× de surproduction).
 *
 * Étendu par docs/design/dette-technique-grand-rewrite.md §5 (pipeline étendu) :
 * multiplicateur d'archétype de langage entre les étapes 3 et 4, `mult_taux_bug`
 * à l'étape 5, et le bloc Dette Technique inséré entre les étapes 8 et 9 (§1/§2)
 * — le point 9 est amendé pour consommer `loc_nette_tick_dette` au lieu de
 * `loc_nette_tick`. `refactorActif` rend "Écrire du code" et "Debug" no-op côté
 * moteur (spec §2.1), pas seulement désactivés côté UI.
 *
 * Amendé par docs/design/upgrades-acte-1-2.md §4 (3 points d'insertion, aucun
 * réordonnancement) : U1 dans `taux_generateurs_brute` (étape 2), U2 dans
 * `impact_bug_effectif` consommé par `multiplicateur_bug` (étape 7), U3 dans le
 * coefficient de dette (sous-étape 1 du bloc Dette). U4 ("npm install") n'est PAS
 * dans ce pipeline : action ponctuelle hors tick, voir actions.ts:claimNpmInstall.
 *
 * Amendé par acte-1-solo-dev.md §3.6 (cas particulier "premier clic", décision
 * user 2026-08-25) : si `state.locTotal` vaut EXACTEMENT 0 en entrée de ce tick
 * (avant toute étape du pipeline), l'étape 5 (génération de bugs) est
 * court-circuitée pour ce tick uniquement. Se réévalue à chaque tick à partir de
 * `state.locTotal` courant — pas un flag posé une fois — donc se redéclenche
 * identiquement après chaque Grand Rewrite (qui remet `locTotal` à 0,
 * actions.ts:grandRewrite). Aucun champ supplémentaire de `GameState` n'est requis.
 */
export function tickState(
  state: GameState,
  dt: number,
  input: TickInput,
): GameState {
  // -- Étape 0 (spec §3.6) : cas particulier "premier clic", évalué sur l'état
  // EN ENTRÉE de ce tick, avant toute autre étape du pipeline.
  const isFirstClickTick = state.locTotal.eq(0);

  // -- Café : régénération passive puis minuteur de buff (spec §1.5) --
  let cafeStock = Math.min(
    CAFE_MAX_STOCK,
    state.cafeStock + CAFE_REGEN_RATE_PER_SECOND * dt,
  );
  let cafeBuffRemaining = Math.max(0, state.cafeBuffRemaining - dt);

  if (input.drinkCoffee && cafeStock >= CAFE_COUT_PAR_USAGE) {
    cafeStock -= CAFE_COUT_PAR_USAGE;
    // Rafraîchit à 20s pleins, ne stacke jamais le multiplicateur (spec §1.5).
    cafeBuffRemaining = CAFE_DUREE_BUFF;
  }
  const cafeBuffActive = cafeBuffRemaining > 0;

  // -- Étape 1 : loc_clic_tick — quantité (LoC), jamais × dt : le clic est un
  // événement discret accumulé sur ce tick, pas un débit continu (spec §1.2/§1.4).
  // Dette-technique-grand-rewrite.md §2.1 : no-op côté moteur pendant un
  // refactoring actif (pas seulement désactivé côté UI).
  const locClicTick = state.refactorActif
    ? new Decimal(0)
    : clickProduction(cafeBuffActive).mul(input.clicksEcrireCode);

  // -- Étape 2 : taux_generateurs_brute — débit total des générateurs (LoC/s).
  // PAS une quantité de tick : ne jamais l'utiliser telle quelle (Finding A).
  // Non affecté par refactorActif : la production passive continue (spec §2.1).
  // Insertion upgrades-acte-1-2.md §4.1 (U1 "Auto-complétion") : débit passif
  // constant ajouté ici, hérite automatiquement de tout ce qui s'applique déjà à
  // ce débit en aval (dt, archétype, bugs, dette) — aucun autre point de code.
  const tauxGenerateursBrute = GENERATOR_IDS.reduce(
    (sum, id) => sum.add(generatorRate(id, state.generators[id])),
    new Decimal(0),
  ).add(state.upgrades.autoComplete ? AUTO_COMPLETE_TAUX : 0);

  // -- Étape 3 : conversion du débit en quantité gagnée sur CE tick. Seule
  // multiplication par `dt` du côté production, faite ici et une seule fois.
  const locGenerateursTick = tauxGenerateursBrute.mul(dt);

  // -- Insertion dette-technique-grand-rewrite.md §4.1/§5, entre les étapes 3 et
  // 4 : multiplicateur de production de l'archétype actif, appliqué au total
  // clic+générateurs avant qu'il ne devienne loc_brute_tick. Un seul tirage par
  // tick pour JavaScript (§5), réutilisé pour clic ET générateurs — jamais deux
  // tirages séparés. `rngSeed` avance en conséquence (threadé purement).
  const { value: multProdLocTick, nextSeed: rngSeed } = archetypeProdMultiplier(
    state.langueActive,
    state.rngSeed,
  );

  // -- Étape 4 : quantité brute totale de LoC pour ce tick. --
  const locBruteTick = locClicTick.add(locGenerateursTick).mul(multProdLocTick);

  const { multTauxBug, multCoefDetteActe } = archetypeStaticMultipliers(
    state.langueActive,
  );

  // -- Étape 5 : génération de bugs sur loc_brute_tick (déjà une quantité par
  // tick, spec §3.2/§3.5) — PAS de dt supplémentaire ici, ce serait un double
  // comptage. Calculé avant la pénalité (§3.3) pour éviter toute boucle circulaire.
  // Les bugs sont un compteur non composé (spec §3.1) : conversion Decimal ->
  // number assumée à cette frontière. `taux_bug × mult_taux_bug` de l'archétype
  // actif (dette-technique-grand-rewrite.md §5, point "au point 5").
  // Sautée si `isFirstClickTick` (spec §3.6, étape 0) : `bugs_generes_ce_tick = 0`
  // pour ce tick uniquement.
  const bugsGeneres = isFirstClickTick
    ? 0
    : locBruteTick.toNumber() * TAUX_BUG * multTauxBug;

  // -- Étape 6 : correction passive du Rubber Duck — débit converti en quantité
  // de tick de la même façon qu'à l'étape 3 (deuxième et dernière apparition
  // explicite de `dt`, spec §3.5).
  const tauxCorrectionDuck = rubberDuckFixRate(state.generators.rubberDuck);
  const correctionDuckTick = tauxCorrectionDuck * dt;

  let bugs = Math.max(0, state.bugs + bugsGeneres - correctionDuckTick);

  // -- Étapes 7-8 : pénalité puis production nette. --
  // Insertion upgrades-acte-1-2.md §4.2 (U2 "Ça marche sur ma machine") : réduit
  // impact_bug effectif (pas taux_bug ni la dette) — plancher atteint à 80 bugs
  // actifs au lieu de 40 une fois l'upgrade possédée.
  const multiplicateurBug = bugMultiplier(bugs, impactBugEffectif(state.upgrades.worksOnMyMachine));
  const locNetteTick = locBruteTick.mul(multiplicateurBug);

  // -- Bloc Dette Technique (dette-technique-grand-rewrite.md §1/§2/§5), inséré
  // entre les étapes 8 et 9 du pipeline Acte I, dans l'ordre normatif §5 :
  // 1) accumulation (gatée acte>=2, §1.1/§1.2) sur loc_brute_tick — jamais sur
  //    loc_nette_tick (même raison que la génération de bugs, §1.2) ;
  // 2) réduction par refactoring actif (§2.2), avant clamp ;
  // 3) plancher 0 ;
  // 4) pénalité composée sur loc_nette_tick (§1.3) -> loc_nette_tick_dette.
  // Insertion upgrades-acte-1-2.md §4.3 (U3 "Tests automatisés"), sous-étape 1 :
  // multiplicateur cumulatif avec celui de l'archétype de langue, appliqué au
  // coefficient de dette uniquement (jamais à taux_bug ni à la pénalité §1.3).
  let dette = state.dette;
  if (state.acte >= 2) {
    const multCoefDetteEffectif =
      multCoefDetteActe * (state.upgrades.testsAutomatises ? TESTS_AUTO_MULT_COEF_DETTE : 1);
    dette = dette.add(locBruteTick.mul(COEF_DETTE_ACTE * multCoefDetteEffectif));
  }
  if (state.refactorActif) {
    dette = dette.sub(TAUX_REFACTOR * dt);
  }
  dette = Decimal.max(0, dette);
  const locNetteTickDette = locNetteTickAvecDette(locNetteTick, dette);

  // -- Étape 9 (amendée §1.3/§5) : compteurs cumulatifs alimentés par
  // loc_nette_tick_dette, pas loc_nette_tick — identique tant que dette=0. --
  const loc = state.loc.add(locNetteTickDette);
  const locTotal = state.locTotal.add(locNetteTickDette);

  // -- Contrat de transition Acte I -> Acte II (docs/design/acte-2-open-source.md
  // §1-3), vérifié juste après l'étape 9 (locTotal à jour du tick courant), sur
  // ce même tick. Gardé par `acte === 1` : ne peut s'exécuter qu'une seule fois
  // par run (idempotent par construction, §2/§4 critère 3). SEED_STARS_TRANSITION
  // est une dotation *provisoire* ("cadeau de bienvenue", pas dérivée d'une
  // formule) — cf. constants.ts et acte-2-open-source.md §2.
  let acte = state.acte;
  let stars = state.stars;
  if (acte === 1 && locTotal.gte(SEUIL_FIN_ACTE_1)) {
    acte = 2;
    stars = stars.add(SEED_STARS_TRANSITION);
  }

  // -- Étape 10 : clic Debug, indépendant du reste du pipeline, plancher 0.
  // No-op pendant un refactoring actif (spec §2.1), au même titre que le clic
  // "Écrire du code" à l'étape 1.
  bugs = state.refactorActif ? bugs : Math.max(0, bugs - input.clicksDebug);

  return {
    ...state,
    loc,
    locTotal,
    bugs,
    cafeStock,
    cafeBuffRemaining,
    acte,
    stars,
    dette,
    rngSeed,
  };
}
