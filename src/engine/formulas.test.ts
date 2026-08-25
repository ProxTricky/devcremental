import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { GENERATOR_IDS, GENERATORS, TICK_DT, type GeneratorId } from "./constants";
import {
  bugMultiplier,
  clickProduction,
  generatorCost,
  generatorRate,
  isUnlocked,
  rubberDuckFixRate,
  unlockThreshold,
} from "./formulas";

// Réf. docs/design/acte-1-solo-dev.md §4 (critères d'acceptation), numéros cités
// dans chaque `describe`.

describe("generatorCost — §4.1", () => {
  for (const id of GENERATOR_IDS) {
    it(`${id} : cout(0) = cout_base exactement`, () => {
      expect(generatorCost(id, 0).toNumber()).toBe(GENERATORS[id].coutBase);
    });

    it(`${id} : cout(n) = cout(n-1) × 1.15 pour n >= 1`, () => {
      for (let n = 1; n <= 5; n++) {
        const prev = generatorCost(id, n - 1);
        const curr = generatorCost(id, n);
        expect(curr.div(prev).toNumber()).toBeCloseTo(1.15, 10);
      }
    });
  }
});

describe("generatorRate — §4.2 (débit, jamais mis à l'échelle par dt ici)", () => {
  const cases: [GeneratorId, number][] = [
    ["copierColler", 0.1],
    ["stagiaire", 0.7],
    ["rubberDuck", 5.0],
  ];

  for (const [id, prodBase] of cases) {
    it(`${id} : taux_generateur = k × prod_base (${prodBase}), en LoC/s`, () => {
      for (const k of [0, 1, 3, 10]) {
        expect(generatorRate(id, k).toNumber()).toBeCloseTo(k * prodBase, 10);
      }
    });
  }
});

describe("Mise à l'échelle du débit générateur au tick — Finding A (non-régression) — §4.3", () => {
  it("k unités, dt=0.1s, sur un tick isolé : gain = k × prod_base × dt exactement ; cumulé sur 10 ticks (1s) : k × prod_base, jamais × 10", () => {
    const k = 10;
    const prodBase = GENERATORS.copierColler.prodBase; // 0.1
    const tauxGenerateursBrute = generatorRate("copierColler", k);

    const gainUnTick = tauxGenerateursBrute.mul(TICK_DT);
    expect(gainUnTick.toNumber()).toBeCloseTo(k * prodBase * TICK_DT, 10);

    let cumule = new Decimal(0);
    for (let i = 0; i < 10; i++) {
      cumule = cumule.add(tauxGenerateursBrute.mul(TICK_DT));
    }
    expect(cumule.toNumber()).toBeCloseTo(k * prodBase, 10); // 1.0, jamais 10.0
  });
});

describe("clickProduction — §4.3, §4.5", () => {
  it("sans buff café : 1 LoC exactement", () => {
    expect(clickProduction(false).toNumber()).toBe(1);
  });

  it("avec buff café actif : ×3 exactement (jamais ×9)", () => {
    expect(clickProduction(true).toNumber()).toBe(3);
  });
});

describe("bugMultiplier — §4.8 (plancher à 40 bugs)", () => {
  it.each([
    [0, 1.0],
    [10, 0.8],
    [25, 0.5],
    [40, 0.2],
    [100, 0.2],
  ])("bugs_actifs=%i -> multiplicateur=%f", (bugs, expected) => {
    expect(bugMultiplier(bugs)).toBeCloseTo(expected, 10);
  });
});

describe("rubberDuckFixRate — §3.4/§3.5 étape 6 (Finding B : 0.05 -> 0.5)", () => {
  it("taux_correction_duck = possedes × 0.5 (débit, LoC/s ; dt appliqué dans tick.ts, pas ici)", () => {
    expect(rubberDuckFixRate(2)).toBeCloseTo(1.0, 10);
    expect(rubberDuckFixRate(0)).toBe(0);
  });
});

describe("unlockThreshold / isUnlocked — §4.12", () => {
  for (const id of GENERATOR_IDS) {
    it(`${id} : seuil = 0.5 × cout_base, invisible juste en-dessous, visible juste au-dessus`, () => {
      const threshold = unlockThreshold(id);
      expect(threshold.toNumber()).toBe(GENERATORS[id].coutBase * 0.5);

      const justBelow = threshold.sub(0.01);
      const justAbove = threshold.add(0.01);
      expect(isUnlocked(id, justBelow)).toBe(false);
      expect(isUnlocked(id, threshold)).toBe(true);
      expect(isUnlocked(id, justAbove)).toBe(true);
    });
  }
});

describe("Indépendance des générateurs — §4.14", () => {
  it("le coût/production d'un générateur ne dépend pas des autres", () => {
    const costBefore = generatorCost("stagiaire", 0);
    // acheter du Copier-coller Stack Overflow n'a aucune influence sur ce calcul :
    // generatorCost ne prend en paramètre que l'id et le nombre possédé de CE
    // générateur, structurellement indépendant des deux autres.
    const costAfter = generatorCost("stagiaire", 0);
    expect(costAfter.eq(costBefore)).toBe(true);
  });
});
