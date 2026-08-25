import Decimal from "break_eternity.js";
import {
  ALPHA_DETTE,
  ARCHETYPES,
  BASE_CLIC,
  BUG_PLANCHER,
  CAFE_MULT_CLIC,
  GENERATORS,
  GROWTH_RATE,
  IMPACT_BUG,
  JS_CHAOS_MAX,
  JS_CHAOS_MIN,
  K_DETTE,
  RUBBER_DUCK_FIX_RATE,
  UNLOCK_THRESHOLD_RATIO,
  UPGRADES,
  WORKS_ON_MY_MACHINE_MULT_IMPACT_BUG,
  type GeneratorId,
  type LangueId,
  type UpgradeId,
} from "./constants";
import { nextUniform } from "./rng";

/**
 * Coût de la (n+1)-ième unité d'un générateur.
 * Spec §1.1 : cout(n) = cout_base × taux_croissance^n (n = unités déjà possédées,
 * 0-indexé — cout(0) = cout_base exactement, critère d'acceptation §4.1).
 */
export function generatorCost(id: GeneratorId, possedes: number): Decimal {
  return new Decimal(GENERATORS[id].coutBase).mul(
    new Decimal(GROWTH_RATE).pow(possedes),
  );
}

/**
 * Seuil de LoC totales gagnées à partir duquel un générateur devient
 * visible/déblocable. Spec §2 : seuil = 0.5 × cout_base.
 */
export function unlockThreshold(id: GeneratorId): Decimal {
  return new Decimal(GENERATORS[id].coutBase).mul(UNLOCK_THRESHOLD_RATIO);
}

/** Critère d'acceptation §4.12 : visible dès locTotal >= seuil, ni avant ni après. */
export function isUnlocked(id: GeneratorId, locTotal: Decimal): boolean {
  return locTotal.gte(unlockThreshold(id));
}

/**
 * Débit de production brute d'un générateur (spec §1.2) : taux_generateur =
 * possedes × prod_base, en LoC **par seconde**. Ce n'est PAS une quantité par
 * tick — ne jamais l'ajouter directement à une ressource : le pipeline §3.5
 * (tick.ts) doit d'abord la multiplier par `dt` (étape 3). C'est l'omission de
 * cette conversion qui causait le Finding A (~10× de surproduction).
 * Pas de multiplicateur par-unité en Acte I (YAGNI — arrive en Acte II avec les
 * upgrades de Karma, cf. spec §1.2).
 */
export function generatorRate(id: GeneratorId, possedes: number): Decimal {
  return new Decimal(GENERATORS[id].prodBase).mul(possedes);
}

/**
 * Quantité de LoC brute gagnée pour un clic "Écrire du code" (spec §1.4/§1.5).
 * Contrairement à `generatorRate`, c'est déjà une **quantité** (le clic est un
 * événement discret, pas un débit continu) : jamais multipliée par `dt`.
 * Le café multiplie UNIQUEMENT la production de clic, jamais les générateurs
 * (spec §1.5, règle explicite — critère d'acceptation §4.6).
 */
export function clickProduction(cafeBuffActive: boolean): Decimal {
  return new Decimal(BASE_CLIC).mul(cafeBuffActive ? CAFE_MULT_CLIC : 1);
}

/**
 * Multiplicateur de pénalité de bugs (spec §3.3) :
 * clamp(1 - impact_bug × bugs_actifs, plancher, 1).
 * Plancher (0.2) atteint à bugs_actifs = 40 — garde-fou anti-mur-mort (spec §3.1/§3.3).
 * `impactBug` par défaut = IMPACT_BUG (comportement Acte I inchangé) ; tick.ts
 * passe `impactBugEffectif(...)` ci-dessous une fois U2 prise en compte
 * (upgrades-acte-1-2.md §4.2) — le plancher est alors atteint à 80 au lieu de 40.
 */
export function bugMultiplier(
  bugsActifs: number,
  impactBug: number = IMPACT_BUG,
): number {
  const raw = 1 - impactBug * bugsActifs;
  return Math.min(1, Math.max(BUG_PLANCHER, raw));
}

/**
 * upgrades-acte-1-2.md §4.2 (U2 "Ça marche sur ma machine") : `impact_bug_effectif
 * = IMPACT_BUG × (upgrade possédée ? WORKS_ON_MY_MACHINE_MULT_IMPACT_BUG : 1)`.
 * Isolée de `bugMultiplier` pour rester testable indépendamment (critère §6.4).
 */
export function impactBugEffectif(worksOnMyMachine: boolean): number {
  return IMPACT_BUG * (worksOnMyMachine ? WORKS_ON_MY_MACHINE_MULT_IMPACT_BUG : 1);
}

/**
 * Débit de correction passive de bugs par les Rubber Ducks (spec §3.4, §3.5
 * étape 6) : taux_correction_duck = possedes × RUBBER_DUCK_FIX_RATE, en bugs
 * **par seconde**. Comme `generatorRate`, c'est un débit — le pipeline (tick.ts)
 * le multiplie explicitement par `dt` à l'étape 6, jamais ici (même règle que
 * pour les générateurs, cf. commentaire de `generatorRate`).
 * Extraite en fonction nommée pour pouvoir la tester isolément du reste du
 * pipeline — cf. critère d'acceptation §4.11 : le Rubber Duck produit aussi des
 * LoC (et donc des bugs) via prod_base, donc en pipeline complet le solde net
 * n'est pas forcément décroissant ; ce que le critère §4.11 vérifie précisément,
 * c'est ce taux de correction lui-même.
 */
export function rubberDuckFixRate(possedesRubberDuck: number): number {
  return possedesRubberDuck * RUBBER_DUCK_FIX_RATE;
}

/**
 * Diviseur composé de la pénalité de dette (dette-technique-grand-rewrite.md
 * §1.3) : (1 + dette/K_dette)^alpha_dette. Vaut exactement 1 quand `dette = 0`
 * (note de compatibilité §1.3) — condition nécessaire pour que la pénalité,
 * appliquée sans condition dès l'Acte I (§1.1), n'y change rien tant que `dette`
 * reste gatée à 0.
 */
export function detteDivisor(dette: Decimal): Decimal {
  return new Decimal(1).add(dette.div(K_DETTE)).pow(ALPHA_DETTE);
}

/**
 * `loc_nette_tick_dette = loc_nette_tick / diviseur(dette)` (spec §1.3). Nouveau
 * symbole en aval qui consomme `loc_nette_tick` (déjà pénalisé par les bugs,
 * acte-1-solo-dev.md §3.5 point 8) sans le modifier — ne remplace ce dernier
 * qu'au point 9 du pipeline (tick.ts), jamais avant.
 */
export function locNetteTickAvecDette(
  locNetteTick: Decimal,
  dette: Decimal,
): Decimal {
  return locNetteTick.div(detteDivisor(dette));
}

/**
 * Karma gagné au déclenchement d'un Grand Rewrite (spec §3.2) :
 * `floor(sqrt(loc_totales_gagnees))` de la run qui se termine (KARMA_COEF=1
 * implicite). `Decimal` de bout en bout : `loc_totales_gagnees` peut dépasser
 * `Number.MAX_SAFE_INTEGER` en fin de run avancée.
 */
export function karmaGagne(locTotalesGagnees: Decimal): Decimal {
  return locTotalesGagnees.sqrt().floor();
}

/**
 * Multiplicateurs statiques (bugs, dette) de l'archétype de langage actif (spec
 * §4.1/§4.2) — jamais aléatoires, contrairement à la production (voir
 * `archetypeProdMultiplier`).
 */
export function archetypeStaticMultipliers(langue: LangueId): {
  multTauxBug: number;
  multCoefDetteActe: number;
} {
  const a = ARCHETYPES[langue];
  return { multTauxBug: a.multTauxBug, multCoefDetteActe: a.multCoefDetteActe };
}

/**
 * Multiplicateur de production de l'archétype actif pour CE tick (spec
 * §4.1/§4.2/§5) : constante pour `'none'`/Python/Rust, tirage
 * `Uniform(0.70, 1.90)` pour JavaScript — un seul tirage par tick, réutilisé pour
 * le total clic+générateurs (spec §5 : "pas un tirage séparé pour le clic et pour
 * les générateurs"). `nextSeed` n'avance que quand un tirage a réellement lieu
 * (JavaScript) ; sur les autres archétypes il est renvoyé inchangé, sans gaspiller
 * d'état PRNG pour rien.
 */
export function archetypeProdMultiplier(
  langue: LangueId,
  rngSeed: number,
): { value: number; nextSeed: number } {
  const constant = ARCHETYPES[langue].multProdLocTick;
  if (constant !== null) {
    return { value: constant, nextSeed: rngSeed };
  }
  return nextUniform(rngSeed, JS_CHAOS_MIN, JS_CHAOS_MAX);
}

/**
 * Coût d'achat d'une upgrade U1-U3 (upgrades-acte-1-2.md §2) : `cout_base` fixe,
 * pas de courbe de croissance (achat unique, contrairement aux générateurs).
 */
export function upgradeCost(id: UpgradeId): Decimal {
  return new Decimal(UPGRADES[id].coutBase);
}

/**
 * Seuil de visibilité d'une upgrade U1-U3 (§2 : "même convention que les
 * générateurs") — même rôle que `unlockThreshold` pour les générateurs ci-dessus.
 */
export function upgradeUnlockThreshold(id: UpgradeId): Decimal {
  return new Decimal(UPGRADES[id].seuilVisibilite);
}

/** Critère §6.1/§6.3/§6.6 : visible dès locTotal >= seuil, ni avant ni après. */
export function isUpgradeUnlocked(id: UpgradeId, locTotal: Decimal): boolean {
  return locTotal.gte(upgradeUnlockThreshold(id));
}
