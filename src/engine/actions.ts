import Decimal from "break_eternity.js";
import { generatorCost, karmaGagne, upgradeCost } from "./formulas";
import type { GameState } from "./types";
import {
  NPM_INSTALL_BURST_DETTE,
  NPM_INSTALL_BURST_LOC,
  type GeneratorId,
  type LangueId,
  type UpgradeId,
} from "./constants";

/**
 * Achat d'une unité d'un générateur (spec §1.1). Action instantanée déclenchée
 * par l'input joueur, indépendante du tick logique 10/s (contrairement à la
 * production qui, elle, passe par tick.ts) — le coût est payé immédiatement,
 * pas de délai artificiel avant le prochain tick.
 * No-op silencieux si le solde de LoC est insuffisant.
 */
export function buyGenerator(state: GameState, id: GeneratorId): GameState {
  const cost = generatorCost(id, state.generators[id]);
  if (state.loc.lt(cost)) {
    return state;
  }
  return {
    ...state,
    loc: state.loc.sub(cost),
    generators: { ...state.generators, [id]: state.generators[id] + 1 },
  };
}

/**
 * Achat d'une upgrade U1-U3 (upgrades-acte-1-2.md §2) : coûte `cout_base` en LoC,
 * déduit du solde courant (pas `locTotal`) — même patron que `buyGenerator`
 * ci-dessus. Pas de courbe de coût (achat unique, jamais stackable) : no-op
 * silencieux si déjà possédée, en plus du no-op si solde insuffisant.
 */
export function buyUpgrade(state: GameState, id: UpgradeId): GameState {
  if (state.upgrades[id]) {
    return state;
  }
  const cost = upgradeCost(id);
  if (state.loc.lt(cost)) {
    return state;
  }
  return {
    ...state,
    loc: state.loc.sub(cost),
    upgrades: { ...state.upgrades, [id]: true },
  };
}

/**
 * Claim U4 "Installer une dépendance" (upgrades-acte-1-2.md §4.4) : réclamation
 * gratuite, unique par run, hors pipeline de tick — gatée sur `state.acte >= 2`
 * (jamais l'Acte I, cf. justification du document : la formule de pénalité de
 * dette est inconditionnelle dès le tick 0, seule l'accumulation est gatée ;
 * ajouter directement à `dette` en Acte I violerait l'invariant "dette reste à 0
 * tant que acte === 1", dette-technique-grand-rewrite.md §9.1). No-op silencieux
 * si `acte < 2` ou déjà réclamée (même patron que les autres actions ci-dessus).
 */
export function claimNpmInstall(state: GameState): GameState {
  if (state.acte < 2 || state.upgrades.npmInstallClaimed) {
    return state;
  }
  return {
    ...state,
    loc: state.loc.add(NPM_INSTALL_BURST_LOC),
    locTotal: state.locTotal.add(NPM_INSTALL_BURST_LOC),
    dette: state.dette.add(NPM_INSTALL_BURST_DETTE),
    upgrades: { ...state.upgrades, npmInstallClaimed: true },
  };
}

// Note : la correction manuelle de bug ("Debug", spec §3.4) n'a pas de fonction
// dédiée ici — son effet passe par TickInput.clicksDebug (pipeline §3.5 étape 9,
// voir tick.ts), pas par une action instantanée comme buyGenerator ci-dessus.

/**
 * Refactoring actif (dette-technique-grand-rewrite.md §2.1) : action "à
 * maintenir" (start/stop), pas un clic instantané. `refactorActif` est lu par
 * tick.ts à chaque tick — aucun autre état à faire évoluer ici.
 */
export function setRefactorActif(state: GameState, actif: boolean): GameState {
  return { ...state, refactorActif: actif };
}

/**
 * Grand Rewrite (spec §3) : prestige transverse, disponible dès `acte >= 2` sans
 * autre condition (§3.1) — no-op silencieux sinon, même pattern que
 * `buyGenerator` (solde insuffisant) ci-dessus.
 */
export function grandRewrite(state: GameState, langue: LangueId): GameState {
  if (state.acte < 2) {
    return state;
  }

  // Étape 1 (§3.3) : Karma calculé sur `locTotal` (loc_totales_gagnees) de la run
  // qui se termine, AVANT tout reset ci-dessous.
  const karmaGagneValue = karmaGagne(state.locTotal);

  return {
    ...state,
    loc: new Decimal(0),
    // Exception explicite à acte-1-solo-dev.md §2 ("loc_totales_gagnees ...
    // jamais décrémenté") : le Grand Rewrite est le SEUL mécanisme autorisé à
    // remettre ce compteur à 0 (reset de run au sens plein, pas une dépense
    // partielle) — dette-technique-grand-rewrite.md §3.3, point 2.
    locTotal: new Decimal(0),
    bugs: 0,
    dette: new Decimal(0),
    cafeStock: 0,
    cafeBuffRemaining: 0,
    generators: { copierColler: 0, stagiaire: 0, rubberDuck: 0 },
    acte: 1,
    // Non listés au reset par la spec §3.3 (persistent tels quels) : `stars`,
    // `rngSeed`. `refactorActif` n'est pas non plus listé, mais le remettre à
    // faux évite qu'une nouvelle run démarre bloquée sur un hold resté actif au
    // moment du Rewrite (aucun effet mécanique en Acte I de toute façon, dette=0).
    refactorActif: false,
    // Étape 3 (§3.3) : cumulatif, jamais reset par un Rewrite.
    karmaRewrite: state.karmaRewrite.add(karmaGagneValue),
    // Étape 4 (§3.3) : devient l'archétype actif de la nouvelle run dès le tick 0.
    langueActive: langue,
    // Amendement upgrades-acte-1-2.md §2/§6 critère 11 : les 4 upgrades sont
    // payées en LoC (une ressource qui reset déjà) et sont "de run" par contrat,
    // contrairement au Karma — elles resettent donc à `false`, dans cette même
    // passe, au même titre que générateurs/café/bugs/dette ci-dessus.
    upgrades: {
      autoComplete: false,
      worksOnMyMachine: false,
      testsAutomatises: false,
      npmInstallClaimed: false,
    },
  };
}
