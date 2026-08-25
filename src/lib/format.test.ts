import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { formatNumber } from "./format";

// Réf. docs/design/notation-nombres.md §7 (critères d'acceptation), numéros cités
// dans chaque `describe`. Les tables §2.5/§4.4 sont reprises telles quelles.

describe("Règle 0 — arrondi entier préalable partagé (§1, critère 2)", () => {
  it("0.999 s'affiche comme l'entier 1 dans les 4 notations", () => {
    const v = new Decimal(0.999);
    expect(formatNumber(v, "integer")).toBe("1");
    expect(formatNumber(v, "compact")).toBe("1");
    expect(formatNumber(v, "scientific")).toBe("1.00e+0");
    expect(formatNumber(v, "hex")).toBe("0x1");
  });
});

describe("integer — non régressé (critère 3)", () => {
  it("0, 999, 1e15 : jamais de bascule automatique de notation", () => {
    expect(formatNumber(new Decimal(0), "integer")).toBe("0");
    expect(formatNumber(new Decimal(999), "integer")).toBe("999");
    expect(formatNumber(new Decimal(1e15), "integer")).toBe("1000000000000000");
  });
});

describe("compact — sous 1000, identique à integer (critère 4)", () => {
  for (const v of [0, 1, 42, 999]) {
    it(`${v}`, () => {
      const d = new Decimal(v);
      expect(formatNumber(d, "compact")).toBe(formatNumber(d, "integer"));
    });
  }
});

describe("compact — table de vérification exacte (§2.5, critère 5)", () => {
  const cases: Array<[number, string]> = [
    [0, "0"],
    [0.999, "1"],
    [999, "999"],
    [999.95, "1.0k"],
    [1000, "1.0k"],
    [1234, "1.2k"],
    [999949, "999.9k"],
    [999950, "1.0M"],
    [1000000, "1.0M"],
    [1500000, "1.5M"],
    [999999999, "1.0B"],
    [12300000000, "12.3B"],
    [5000000000000, "5.0T"],
    [999949999999999, "999.9T"],
    [999950000000000, "1.00e+15"],
    [1e15, "1.00e+15"],
  ];

  for (const [value, expected] of cases) {
    it(`${value} -> "${expected}"`, () => {
      expect(formatNumber(new Decimal(value), "compact")).toBe(expected);
    });
  }
});

describe("compact — jamais de palier invalide (critère 6)", () => {
  it("balayage ±1 autour de chaque frontière : mantisse jamais >= 1000.0 avec suffixe", () => {
    const suffixed = /^(\d+)\.\d(k|M|B|T)$/;
    const borders = [1e3, 1e6, 1e9, 1e12, 1e15];
    for (const border of borders) {
      for (const delta of [-1, 0, 1]) {
        const s = formatNumber(new Decimal(border + delta), "compact");
        const match = s.match(suffixed);
        if (match) {
          expect(Number(match[1])).toBeLessThan(1000);
        }
      }
    }
  });
});

describe("compact — seuil dur à 1e15 (critère 7)", () => {
  it("compact(1e15) === scientific(1e15)", () => {
    const v = new Decimal(1e15);
    expect(formatNumber(v, "compact")).toBe(formatNumber(v, "scientific"));
  });
});

describe("scientific — table de vérification (critère 8)", () => {
  const cases: Array<[number, string]> = [
    [0, "0.00e+0"],
    [42, "4.20e+1"],
    [999, "9.99e+2"],
    [1234, "1.23e+3"],
    [1e15, "1.00e+15"],
  ];

  for (const [value, expected] of cases) {
    it(`${value} -> "${expected}"`, () => {
      expect(formatNumber(new Decimal(value), "scientific")).toBe(expected);
    });
  }
});

describe("scientific — implémentation, délégation pure à toExponential(2) (critère 9)", () => {
  it("aucun post-traitement de la chaîne native pour layer 0", () => {
    for (const v of [0, 42, 999, 1234, 1e15]) {
      const value = new Decimal(v);
      expect(formatNumber(value, "scientific")).toBe(
        new Decimal(v).round().toExponential(2),
      );
    }
  });
});

describe("scientific — jamais d'exception à layer >= 1 (critère 10)", () => {
  it("ne lève pas et renvoie une chaîne non vide", () => {
    const highLayer = Decimal.fromComponents(1, 2, 100);
    expect(() => formatNumber(highLayer, "scientific")).not.toThrow();
    expect(formatNumber(highLayer, "scientific").length).toBeGreaterThan(0);
  });
});

describe("hex — table de vérification exacte (§4.4, critère 11)", () => {
  const cases: Array<[number, string]> = [
    [0, "0x0"],
    [0.999, "0x1"],
    [10, "0xA"],
    [255, "0xFF"],
    [999, "0x3E7"],
    [1000, "0x3E8"],
    [1234, "0x4D2"],
    [65535, "0xFFFF"],
    [1000000, "0xF4240"],
  ];

  for (const [value, expected] of cases) {
    it(`${value} -> "${expected}"`, () => {
      expect(formatNumber(new Decimal(value), "hex")).toBe(expected);
    });
  }
});

describe("hex — propriété générale round-trip (critère 12)", () => {
  it("parseInt(hex, 16) === Number(integer) pour 100 valeurs aléatoires seedées", () => {
    // ponytail: RNG maison seedée (mulberry32) au lieu d'un package dédié —
    // suffisant pour 100 tirages déterministes dans un test.
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let i = 0; i < 100; i++) {
      const v = Math.floor(rand() * 1e15);
      const value = new Decimal(v);
      const hex = formatNumber(value, "hex");
      const integer = formatNumber(value, "integer");
      expect(parseInt(hex.slice(2), 16)).toBe(Number(integer));
    }
  });
});

describe("hex — seuil dur à 1e15 (critère 13)", () => {
  it("hex(1e15) === scientific(1e15)", () => {
    const v = new Decimal(1e15);
    expect(formatNumber(v, "hex")).toBe(formatNumber(v, "scientific"));
  });
});

describe("hex — pas de déblocage requis (critère 14)", () => {
  it("produit un résultat valide sans condition de déblocage", () => {
    expect(formatNumber(new Decimal(1234), "hex")).toBe("0x4D2");
  });
});
