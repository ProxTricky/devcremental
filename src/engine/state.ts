import Decimal from "break_eternity.js";
import { DEFAULT_RNG_SEED } from "./constants";
import type { GameState } from "./types";

/**
 * État initial d'une partie Acte I.
 * Critère d'acceptation §4.4 : stock de café à 0 à t=0 (valeur initiale documentée ici).
 * Dette-technique-grand-rewrite.md §1.1/§4.1 : dette=0, langue='none' (aucun
 * effet d'archétype tant qu'aucun Rewrite n'a eu lieu).
 */
export function createInitialState(): GameState {
  return {
    version: 1,
    loc: new Decimal(0),
    locTotal: new Decimal(0),
    bugs: 0,
    cafeStock: 0,
    cafeBuffRemaining: 0,
    generators: { copierColler: 0, stagiaire: 0, rubberDuck: 0 },
    acte: 1,
    stars: new Decimal(0),
    dette: new Decimal(0),
    refactorActif: false,
    karmaRewrite: new Decimal(0),
    langueActive: "none",
    rngSeed: DEFAULT_RNG_SEED,
    // Upgrades-acte-1-2.md §2 : les 4 upgrades démarrent non possédées.
    upgrades: {
      autoComplete: false,
      worksOnMyMachine: false,
      testsAutomatises: false,
      npmInstallClaimed: false,
    },
  };
}
