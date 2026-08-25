import type Decimal from "break_eternity.js";
import type { GeneratorId, LangueId } from "./constants";

/**
 * État canonique du jeu (Acte I, + contrat de transition Acte II). Vit dans le
 * Web Worker (src/worker), jamais dans le thread principal — cf. CLAUDE.md
 * "Boucle de jeu".
 *
 * Les valeurs qui composent (LoC, production, Stars) sont des Decimal
 * (break_eternity.js). Les bugs et le café ne composent pas (plafonnés/bornés
 * par design, spec §3.1 : "version simplifiée et non composée" de la future
 * Dette Technique) : `number` natif.
 */
export interface GameState {
  version: 1;
  /** Solde de LoC dépensable (baisse à l'achat d'un générateur). */
  loc: Decimal;
  /** LoC totales jamais gagnées, ne baisse jamais — sert aux seuils de déblocage (spec §2). */
  locTotal: Decimal;
  /** bugs_actifs, spec §3. */
  bugs: number;
  /** Stock de café, 0..CAFE_MAX_STOCK, fractionnaire (régén continue, spec §1.5). */
  cafeStock: number;
  /** Secondes restantes du buff café actif, 0 si inactif. */
  cafeBuffRemaining: number;
  /** Unités possédées par générateur. */
  generators: Record<GeneratorId, number>;
  /**
   * Acte courant (docs/design/acte-2-open-source.md §2/§3) : source de vérité
   * côté moteur, jamais dupliquée côté UI. Passe de 1 à 2 exactement une fois,
   * au tick où `locTotal` franchit `SEUIL_FIN_ACTE_1` (cf. tick.ts).
   */
  acte: number;
  /**
   * ⭐ Stars (PLAN.md §4), débloquées à la transition Acte I -> II. `Decimal`
   * comme le reste du state qui compose, même si sa valeur reste petite en
   * début d'Acte II (cf. acte-2-open-source.md §2, cohérence de type).
   */
  stars: Decimal;
  /**
   * Dette Technique (dette-technique-grand-rewrite.md §1) : diviseur composé
   * transverse, `Decimal` comme tout ce qui compose (CLAUDE.md). Reste
   * exactement à 0 tant que `acte === 1` (§1.1, gating explicite).
   */
  dette: Decimal;
  /**
   * Refactoring actif maintenu par le joueur (spec §2). Tant que vrai : la dette
   * diminue chaque tick, et les actions "Écrire du code"/"Debug" sont no-op
   * (bloquées côté moteur, pas seulement côté UI).
   */
  refactorActif: boolean;
  /**
   * Karma de Rewrite (spec §3.2) : compteur cumulatif **méta**, jamais reset par
   * un Grand Rewrite (contrairement à `locTotal`) — `Decimal` car il compose sur
   * de nombreuses runs (CLAUDE.md).
   */
  karmaRewrite: Decimal;
  /**
   * Archétype de langage actif (spec §4). `'none'` tant qu'aucun Rewrite n'a eu
   * lieu (§4.1 — les 3 multiplicateurs valent alors 1.0, aucun effet).
   */
  langueActive: LangueId;
  /**
   * Seed du PRNG (src/engine/rng.ts) consommé par le tirage `chaos_tick` de
   * l'archétype JavaScript (spec §4.2/§4.3) — threadé purement à travers
   * `tickState`, jamais un `Math.random()` global (§9 critères 14/15).
   */
  rngSeed: number;
  /**
   * Upgrades intra-run (docs/design/upgrades-acte-1-2.md §2) : booléens
   * possédé/non-possédé, jamais stackables. Reset au Grand Rewrite (§2, amende
   * dette-technique-grand-rewrite.md §3.3 point 2 — voir actions.ts:grandRewrite).
   */
  upgrades: {
    autoComplete: boolean;
    worksOnMyMachine: boolean;
    testsAutomatises: boolean;
    npmInstallClaimed: boolean;
  };
}

/** Entrées joueur agrégées sur un tick logique (100 ms), consommées par tickState. */
export interface TickInput {
  /** Nombre de clics "Écrire du code" survenus pendant ce tick. */
  clicksEcrireCode: number;
  /** Nombre de clics "Debug" survenus pendant ce tick. */
  clicksDebug: number;
  /** Au moins une demande "Boire un café" pendant ce tick. */
  drinkCoffee: boolean;
}

export const EMPTY_TICK_INPUT: TickInput = {
  clicksEcrireCode: 0,
  clicksDebug: 0,
  drinkCoffee: false,
};
