import { describe, expect, it } from "vitest";
import { CODE_SAMPLES } from "./codeSamples";
import { initialTerminalCursor, nextTerminalLine } from "./terminalLines";

// Vérifie la machine à 2 états décrite dans terminalLines.ts : révéler une
// fonction ligne par ligne, puis exactement une blague une fois la fonction
// terminée, avant d'en tirer une nouvelle — demande user du 2026-08-25.

describe("nextTerminalLine — révélation d'une fonction ligne par ligne", () => {
  it("le tout premier appel (curseur initial) renvoie une blague, jamais une ligne de fonction", () => {
    const jokeTexts = new Set(
      // Une blague ne fait jamais partie d'une fonction connue.
      Object.values(CODE_SAMPLES)
        .flat()
        .flat(),
    );
    for (let i = 0; i < 20; i++) {
      const { text } = nextTerminalLine(initialTerminalCursor(), "none", "fr");
      expect(jokeTexts.has(text)).toBe(false);
    }
  });

  it("après la blague d'ouverture, les appels suivants révèlent une fonction réelle ligne par ligne, dans l'ordre", () => {
    let cursor = initialTerminalCursor();
    const first = nextTerminalLine(cursor, "rust", "fr");
    cursor = first.cursor;
    expect(cursor.pool).not.toBeNull();
    const fn = cursor.pool!;

    const revealed: string[] = [];
    for (let i = 0; i < fn.length; i++) {
      const { text, cursor: next } = nextTerminalLine(cursor, "rust", "fr");
      revealed.push(text);
      cursor = next;
    }

    expect(revealed).toEqual(fn);
  });

  it("le clic qui suit la dernière ligne d'une fonction renvoie une blague, puis une nouvelle fonction démarre", () => {
    let cursor = initialTerminalCursor();
    ({ cursor } = nextTerminalLine(cursor, "python", "fr")); // blague d'ouverture -> pool posé
    const fnLength = cursor.pool!.length;

    // Épuise la fonction en cours.
    for (let i = 0; i < fnLength; i++) {
      ({ cursor } = nextTerminalLine(cursor, "python", "fr"));
    }
    expect(cursor.pool).toBeNull(); // fonction terminée -> prochain appel = blague

    const jokeTexts = new Set(
      Object.values(CODE_SAMPLES).flat().flat(),
    );
    const afterFn = nextTerminalLine(cursor, "python", "fr");
    expect(jokeTexts.has(afterFn.text)).toBe(false); // c'est bien une blague, pas une ligne de code
    expect(afterFn.cursor.pool).not.toBeNull(); // une nouvelle fonction a été tirée dans la foulée
  });

  it("'none' et 'javascript' partagent le même pool de fonctions (même fichier d'onglet, langueLabels.ts)", () => {
    expect(CODE_SAMPLES.none).toBe(CODE_SAMPLES.javascript);
  });

  it("toutes les fonctions de tous les langages sont non vides", () => {
    for (const [langue, functions] of Object.entries(CODE_SAMPLES)) {
      expect(functions.length, `pool vide pour ${langue}`).toBeGreaterThan(0);
      for (const fn of functions) {
        expect(fn.length, `fonction vide dans le pool ${langue}`).toBeGreaterThan(0);
      }
    }
  });

  it("la locale 'en' pioche aussi une blague (pas une ligne de fonction) au premier appel", () => {
    const jokeTexts = new Set(Object.values(CODE_SAMPLES).flat().flat());
    for (let i = 0; i < 20; i++) {
      const { text } = nextTerminalLine(initialTerminalCursor(), "none", "en");
      expect(jokeTexts.has(text)).toBe(false);
    }
  });
});
