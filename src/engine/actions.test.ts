import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { buyGenerator, buyUpgrade } from "./actions";
import { createInitialState } from "./state";
import type { GameState } from "./types";

/**
 * Contrat de référence dont dépend gameWorker.ts (acte-1-solo-dev.md §1.6,
 * upgrades-acte-1-2.md §7) pour détecter un achat réussi sans dupliquer les
 * gardes déjà présentes ici : un no-op renvoie EXACTEMENT la même référence
 * `state`, jamais un objet nouvellement construit même structurellement égal.
 * `claimNpmInstall`/`grandRewrite` ont déjà ce même test (upgrades.test.ts §6.9,
 * dette.test.ts §9.11) — complété ici pour `buyGenerator`/`buyUpgrade`, jusque-là
 * non couverts explicitement sur ce point précis.
 */

describe("buyGenerator — référence sur no-op (solde insuffisant)", () => {
  it("renvoie exactement la même référence state si loc < coût", () => {
    const state: GameState = { ...createInitialState(), loc: new Decimal(1) };
    const after = buyGenerator(state, "copierColler"); // coût 10
    expect(after).toBe(state);
  });

  it("renvoie un nouvel objet, loc débité et generators incrémenté si loc >= coût", () => {
    const state: GameState = { ...createInitialState(), loc: new Decimal(10) };
    const after = buyGenerator(state, "copierColler");
    expect(after).not.toBe(state);
    expect(after.loc.toNumber()).toBe(0);
    expect(after.generators.copierColler).toBe(1);
  });
});

describe("buyUpgrade — référence sur no-op", () => {
  it("solde insuffisant : renvoie exactement la même référence state", () => {
    const state: GameState = { ...createInitialState(), loc: new Decimal(1) };
    const after = buyUpgrade(state, "autoComplete"); // coût 250
    expect(after).toBe(state);
  });

  it("déjà possédée : renvoie exactement la même référence state, même avec un solde suffisant", () => {
    const state: GameState = {
      ...createInitialState(),
      loc: new Decimal(1_000_000),
      upgrades: { ...createInitialState().upgrades, autoComplete: true },
    };
    const after = buyUpgrade(state, "autoComplete");
    expect(after).toBe(state);
  });

  it("achat réussi : renvoie un nouvel objet, loc débité et upgrade possédée", () => {
    const state: GameState = { ...createInitialState(), loc: new Decimal(250) };
    const after = buyUpgrade(state, "autoComplete");
    expect(after).not.toBe(state);
    expect(after.loc.toNumber()).toBe(0);
    expect(after.upgrades.autoComplete).toBe(true);
  });
});
