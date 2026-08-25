import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { createInitialState } from "../engine/state";
import type { GameState } from "../engine/types";
import { decodeSave, encodeSave, type SaveDataV1 } from "./save";

describe("save/load — round-trip", () => {
  it("encode puis decode redonne un état strictement identique", () => {
    const state: GameState = {
      ...createInitialState(),
      loc: new Decimal("1.23e21"), // au-delà de Number.MAX_SAFE_INTEGER : vérifie
      locTotal: new Decimal("4.56e22"), // que le round-trip ne perd pas la précision.
      bugs: 12.5,
      cafeStock: 2.3333333333,
      cafeBuffRemaining: 17,
      generators: { copierColler: 42, stagiaire: 3, rubberDuck: 1 },
      acte: 2,
      stars: new Decimal("7.89e18"), // au-delà de MAX_SAFE_INTEGER, même exigence
      // de précision que loc/locTotal (cf. commentaire ci-dessus).
      dette: new Decimal("3000.5"),
      refactorActif: true,
      karmaRewrite: new Decimal("9.87e15"),
      langueActive: "rust",
      rngSeed: 123456789,
      // Upgrades-acte-1-2.md §2 : les 4 champs, un mélange true/false pour
      // vérifier qu'aucun n'est silencieusement écrasé par un défaut au round-trip.
      upgrades: {
        autoComplete: true,
        worksOnMyMachine: false,
        testsAutomatises: true,
        npmInstallClaimed: false,
      },
    };

    const encoded = encodeSave(state);
    const decoded = decodeSave(encoded);

    expect(decoded.version).toBe(1);
    expect(decoded.loc.eq(state.loc)).toBe(true);
    expect(decoded.locTotal.eq(state.locTotal)).toBe(true);
    expect(decoded.bugs).toBe(state.bugs);
    expect(decoded.cafeStock).toBeCloseTo(state.cafeStock, 12);
    expect(decoded.cafeBuffRemaining).toBe(state.cafeBuffRemaining);
    expect(decoded.generators).toEqual(state.generators);
    expect(decoded.acte).toBe(state.acte);
    expect(decoded.stars.eq(state.stars)).toBe(true);
    expect(decoded.dette.eq(state.dette)).toBe(true);
    expect(decoded.refactorActif).toBe(state.refactorActif);
    expect(decoded.karmaRewrite.eq(state.karmaRewrite)).toBe(true);
    expect(decoded.langueActive).toBe(state.langueActive);
    expect(decoded.rngSeed).toBe(state.rngSeed);
    expect(decoded.upgrades).toEqual(state.upgrades);
  });

  it("tolère une charge utile v1 antérieure au champ upgrades (défauts : les 4 champs à false)", () => {
    const legacy = {
      version: 1,
      loc: "10",
      locTotal: "20",
      bugs: 0,
      cafeStock: 0,
      cafeBuffRemaining: 0,
      generators: { copierColler: 0, stagiaire: 0, rubberDuck: 0 },
      acte: 2,
      stars: "5",
      dette: "0",
      refactorActif: false,
      karmaRewrite: "0",
      langueActive: "none",
      rngSeed: 1,
    };
    const decoded = decodeSave(btoa(JSON.stringify(legacy)));
    expect(decoded.upgrades).toEqual({
      autoComplete: false,
      worksOnMyMachine: false,
      testsAutomatises: false,
      npmInstallClaimed: false,
    });
  });

  it("tolère une charge utile v1 antérieure aux champs dette/refactor/karma/langue/rngSeed (défauts : dette=0, refactorActif=false, karmaRewrite=0, langue='none')", () => {
    const legacy = {
      version: 1,
      loc: "10",
      locTotal: "20",
      bugs: 0,
      cafeStock: 0,
      cafeBuffRemaining: 0,
      generators: { copierColler: 0, stagiaire: 0, rubberDuck: 0 },
      acte: 2,
      stars: "5",
    };
    const decoded = decodeSave(btoa(JSON.stringify(legacy)));
    expect(decoded.dette.toNumber()).toBe(0);
    expect(decoded.refactorActif).toBe(false);
    expect(decoded.karmaRewrite.toNumber()).toBe(0);
    expect(decoded.langueActive).toBe("none");
    expect(typeof decoded.rngSeed).toBe("number");
  });

  it("tolère une charge utile v1 antérieure aux champs acte/stars (défaut acte=1, stars=0)", () => {
    // Aucun format v1 sans ces champs n'a jamais été publié à des joueurs, mais
    // le dev courant peut avoir une save locale antérieure à cette tâche — on
    // dégrade proprement plutôt que de planter au chargement (cf. deserializeState).
    const legacy = {
      version: 1,
      loc: "10",
      locTotal: "20",
      bugs: 0,
      cafeStock: 0,
      cafeBuffRemaining: 0,
      generators: { copierColler: 0, stagiaire: 0, rubberDuck: 0 },
    };
    const decoded = decodeSave(btoa(JSON.stringify(legacy)));
    expect(decoded.acte).toBe(1);
    expect(decoded.stars.toNumber()).toBe(0);
  });

  it("l'export est bien une chaîne base64 (portable, indépendante du localStorage)", () => {
    const encoded = encodeSave(createInitialState());
    expect(() => atob(encoded)).not.toThrow();
    expect(JSON.parse(atob(encoded)).version).toBe(1);
  });
});

describe("migration — version inconnue", () => {
  it("rejette explicitement un format non reconnu plutôt que d'échouer silencieusement", () => {
    const bogus: Partial<SaveDataV1> = { version: 99 as 1 };
    const encoded = btoa(JSON.stringify(bogus));
    expect(() => decodeSave(encoded)).toThrow(/version 99/);
  });

  it("rejette une charge utile sans champ version", () => {
    const encoded = btoa(JSON.stringify({ loc: "0" }));
    expect(() => decodeSave(encoded)).toThrow();
  });

  // Aucune migration réelle n'existe encore : v1 est le tout premier format de
  // sauvegarde jamais publié pour ce jeu (cf. commentaire dans save.ts). Un test
  // de migration "depuis un ancien format" nécessiterait un v0 qui n'a jamais
  // existé — le point d'extension (`migrate`) est en place et testé ci-dessus
  // via le rejet explicite d'une version inconnue ; le prochain format (v2)
  // ajoutera son propre test de migration v1 -> v2 ici.
});
