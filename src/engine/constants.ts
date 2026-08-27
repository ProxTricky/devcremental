/**
 * Constantes de balancing de l'Acte I.
 * Réf. docs/design/acte-1-solo-dev.md — chaque groupe de constantes renvoie vers
 * la section de la spec qui le définit. Ne jamais coder ces valeurs en dur ailleurs.
 */

/** Tick logique fixe, cf. CLAUDE.md "Boucle de jeu" / PLAN.md §7. */
export const TICK_RATE = 10; // ticks par seconde
export const TICK_DT = 1 / TICK_RATE; // secondes par tick

export type GeneratorId = "copierColler" | "stagiaire" | "rubberDuck";

export const GENERATOR_IDS: GeneratorId[] = [
  "copierColler",
  "stagiaire",
  "rubberDuck",
];

/** Spec §1.1 : cout(n) = cout_base × taux_croissance^n, commun aux 3 générateurs. */
export const GROWTH_RATE = 1.15;

/**
 * Spec §1.3 — table des paramètres nommés des 3 générateurs.
 * Recalibré le 2026-08-27 (retour de playtest Reddit — "Stack Overflow
 * copy-paste... as far as I can tell, it does nothing" — décision produit,
 * cf. changelog en tête d'acte-1-solo-dev.md) : `copierColler.coutBase` reste
 * inchangé à `10` (borné par PLAN.md §8 "1er générateur < 30s", pas de raison
 * de le remonter) ; `prodBase` ×10 (0.1 -> 1.0) pour rendre le gain lisible
 * (+1 LoC/s = un incrément visible chaque seconde). `stagiaire.coutBase` ×7.14
 * (100 -> 700) et `prodBase` ×7.14 (0.7 -> 5.0) pour préserver son ratio
 * production/coût. `rubberDuck.coutBase` ×7 (1000 -> 7000) et `prodBase` ×7
 * (5.0 -> 35.0), même ratio production/coût qu'avant (Finding C : sans ce
 * recalibrage `stagiaire` serait devenu strictement dominant en production
 * pure pour un dixième du prix du canard).
 */
export const GENERATORS: Record<
  GeneratorId,
  { coutBase: number; prodBase: number }
> = {
  copierColler: { coutBase: 10, prodBase: 1.0 },
  stagiaire: { coutBase: 700, prodBase: 5.0 },
  rubberDuck: { coutBase: 7000, prodBase: 35.0 },
};

/** Spec §2, note sous la table de balancing : seuil de visibilité = 0.5 × cout_base. */
export const UNLOCK_THRESHOLD_RATIO = 0.5;

/** Spec §1.4 — clic de base "Écrire du code". */
export const BASE_CLIC = 1; // LoC par clic, avant buffs

/** Spec §1.5 — le buff Café. */
export const CAFE_REGEN_RATE_PER_SECOND = 1 / 30; // 1 café / 30s
export const CAFE_MAX_STOCK = 3;
export const CAFE_COUT_PAR_USAGE = 1;
export const CAFE_MULT_CLIC = 3;
export const CAFE_DUREE_BUFF = 20; // secondes

/**
 * Spec §3.2/§3.3 — mécanique Bugs.
 * Recalibré 0.05 -> 0.02 (décision user, revue balance-qa 2026-08-25) : à 0.05 le
 * temps jusqu'à 10 000 LoC totales gagnées (profil "actif sans Debug") mesurait
 * 50.36 min, très hors de la fenêtre cible 25-30 min (±30% = 17.5-39 min) — le
 * profil passait 89% du temps au plancher de pénalité. À 0.02 : 23.30 min, dans
 * la tolérance. `IMPACT_BUG`/`BUG_PLANCHER` inchangés (garde-fous structurels
 * anti-mur-mort, pas des paramètres de pacing, cf. spec §3.2).
 */
export const TAUX_BUG = 0.02; // part de prod_brute convertie en bugs générés
export const IMPACT_BUG = 0.02; // pénalité de prod par bug actif
export const BUG_PLANCHER = 0.2; // multiplicateur minimal (jamais de mur mort)

/**
 * Spec §3.4 — effet secondaire du Rubber Duck : correction passive de bugs.
 * Recalibré 0.05 -> 0.5 (Finding B, revue balance-qa 2026-08-04) : à 0.05 le
 * canard corrigeait moins de bugs qu'il n'en générait via sa propre production
 * (0.25/s/unité, avec l'ancien TAUX_BUG=0.05), le rendant net générateur de bugs
 * — contraire à son intention narrative (§0 : "il fait deux jobs et le fait
 * bien"). Depuis le recalibrage TAUX_BUG=0.02 (2026-08-25), sa propre génération
 * tombe à 0.1/s/unité (5.0 × 0.02) donc son net correcteur passe à 0.4/s/unité
 * (0.5 − 0.1) — RUBBER_DUCK_FIX_RATE lui-même restait inchangé à ce moment-là,
 * seule la dérivation changeait (cf. spec §3.4).
 * Recalibré une seconde fois, 0.5 -> 3.5 (×7, 2026-08-27, changelog
 * acte-1-solo-dev.md) : le recalibrage `prod_base_duck` 5.0 -> 35.0 (même date,
 * voir GENERATORS ci-dessus) fait remonter sa propre génération de bugs à
 * 0.7/s/unité (35.0 × 0.02) — sans ajuster RUBBER_DUCK_FIX_RATE dans les mêmes
 * proportions, le canard serait redevenu net générateur de bugs (0.5 − 0.7 =
 * −0.2), reproduisant Finding B une seconde fois. Règle de conception retenue à
 * partir de ce recalibrage (spec §3.4) : RUBBER_DUCK_FIX_RATE doit toujours être
 * dérivé comme `5 × prod_base_duck × taux_bug`, jamais fixé indépendamment —
 * marge de 5× (le net correcteur, 2.8/s/unité, cf. dérivé ci-dessous) préservée
 * à travers ce second recalibrage.
 */
export const RUBBER_DUCK_FIX_RATE = 3.5; // bugs corrigés / s / unité possédée

/**
 * Contrat de transition Acte I -> Acte II, docs/design/acte-2-open-source.md §1-2.
 * Seuil normatif sur `locTotal` (loc_totales_gagnees) ; dotation de Stars
 * provisoire ("cadeau de bienvenue"), pas dérivée d'une formule — sera recalibrée
 * une fois l'économie de Stars de l'Acte II spécifiée (§2 du document, hors scope
 * ici).
 */
export const SEUIL_FIN_ACTE_1 = 10_000;
export const SEED_STARS_TRANSITION = 10;

/**
 * Dette Technique — docs/design/dette-technique-grand-rewrite.md §1/§2/§3.
 * Toutes provisoires (marquées explicitement comme telles par game-designer,
 * §6/§7 du document), implémentées telles quelles sans recalibrage ici.
 */
export const COEF_DETTE_ACTE = 0.15; // §1.2 — coefficient sans dimension temporelle
export const K_DETTE = 3000; // §1.3
export const ALPHA_DETTE = 1.5; // §1.3
export const TAUX_REFACTOR = 60; // §2.2 — dette/s, débit (préfixe taux_ légitime)

/** §3.2 — KARMA_COEF=1 implicite dans floor(sqrt(loc_totales_gagnees)). */
export const KARMA_COEF = 1;

/** §4 — archétypes de langage (Grand Rewrite). */
export type LangueId = "none" | "rust" | "python" | "javascript";

export const LANGUE_IDS: LangueId[] = ["none", "rust", "python", "javascript"];

export interface ArchetypeMultipliers {
  /** Constante pour 'none'/'rust'/'python'. `null` = tiré par tick (JavaScript, §4.2). */
  multProdLocTick: number | null;
  multTauxBug: number;
  multCoefDetteActe: number;
}

/** §4.1/§4.2 — table chiffrée normative des 3 archétypes + 'none' (aucun effet, §4.1). */
export const ARCHETYPES: Record<LangueId, ArchetypeMultipliers> = {
  none: { multProdLocTick: 1.0, multTauxBug: 1.0, multCoefDetteActe: 1.0 },
  rust: { multProdLocTick: 0.8, multTauxBug: 0.1, multCoefDetteActe: 0.5 },
  python: { multProdLocTick: 1.15, multTauxBug: 1.3, multCoefDetteActe: 1.0 },
  javascript: { multProdLocTick: null, multTauxBug: 1.0, multCoefDetteActe: 1.0 },
};

/** §4.2 — bornes du tirage Uniform(0.70, 1.90) de l'archétype JavaScript. */
export const JS_CHAOS_MIN = 0.7;
export const JS_CHAOS_MAX = 1.9;

/** Seed RNG par défaut d'une nouvelle partie — arbitraire mais fixe (déterminisme
 * d'une save fraîche ; les tests reproductibles (§9 critères 14/15) fournissent
 * leur propre seed explicite plutôt que de dépendre de cette valeur). */
export const DEFAULT_RNG_SEED = 88_675_123;

/**
 * Upgrades intra-run — docs/design/upgrades-acte-1-2.md §2/§4/§5.
 * Achat unique en LoC (pas de courbe de coût, contrairement aux générateurs),
 * effet permanent pour la run en cours, reset au Grand Rewrite (§2, amende
 * dette-technique-grand-rewrite.md §3.3 point 2). `npmInstallClaimed` (U4) n'est
 * PAS dans cette liste : c'est une réclamation gratuite gatée sur `state.acte`,
 * pas un achat en LoC (§4.4) — voir NPM_INSTALL_BURST_LOC/DETTE plus bas.
 */
export type UpgradeId = "autoComplete" | "worksOnMyMachine" | "testsAutomatises";

export const UPGRADE_IDS: UpgradeId[] = [
  "autoComplete",
  "worksOnMyMachine",
  "testsAutomatises",
];

/** §5 — table des paramètres nommés des 3 upgrades achetables en LoC. */
export const UPGRADES: Record<
  UpgradeId,
  { coutBase: number; seuilVisibilite: number }
> = {
  autoComplete: { coutBase: 250, seuilVisibilite: 125 },
  worksOnMyMachine: { coutBase: 3_000, seuilVisibilite: 1_500 },
  // Recalibré 5000 -> 3000 (décision user, upgrades-acte-1-2.md §4.3, 2026-08-25) :
  // simulation balance-qa sur 3000/3250/3500, les trois non-mur-mort sur 4h ;
  // 3000 retenu comme seule valeur restant proche d'une session de jeu continue
  // (58.14 min d'achat mesurées). Seuil de visibilité suit la formule générique
  // §2 (0.5 × coutBase) : 2500 -> 1500. Égalité de coût/seuil avec
  // `worksOnMyMachine` acceptée par décision documentée (§4.3), pas un oubli.
  testsAutomatises: { coutBase: 3_000, seuilVisibilite: 1_500 },
};

/**
 * §4.1 — U1 "Auto-complétion" : débit passif constant (LoC/s), ajouté à
 * `taux_generateurs_brute` (tick.ts étape 2), indépendant du clic.
 */
export const AUTO_COMPLETE_TAUX = 1.5;

/**
 * §4.2 — U2 "Ça marche sur ma machine" : réduit `impact_bug` effectif (pas
 * `taux_bug` ni la dette), déplaçant le plancher de pénalité de 40 à 80 bugs actifs.
 */
export const WORKS_ON_MY_MACHINE_MULT_IMPACT_BUG = 0.5;

/**
 * §4.3 — U3 "Tests automatisés" : ralentit l'accumulation de dette (pas son
 * plancher ni sa pénalité), cumulatif multiplicativement avec le multiplicateur
 * d'archétype de langue (`multCoefDetteActe`).
 */
export const TESTS_AUTO_MULT_COEF_DETTE = 0.7;

/**
 * §4.4 — U4 "Installer une dépendance" (npm install) : réclamation gratuite,
 * unique par run, gatée sur `state.acte >= 2` (jamais l'Acte I — voir la
 * justification de gating dans le document, §4.4). Gain instantané hors pipeline.
 */
export const NPM_INSTALL_BURST_LOC = 8_000;
export const NPM_INSTALL_BURST_DETTE = 1_500;

/**
 * Progression offline — docs/design/progression-offline.md §2. Plafond du delta
 * de temps réel rattrapé en un seul appel à `advanceTime` au chargement d'une
 * save existante (8h = 8 × 3600s), normatif (PLAN.md §7 : "plafonné, ex. 8h").
 */
export const OFFLINE_CAP_SECONDS = 28_800;
