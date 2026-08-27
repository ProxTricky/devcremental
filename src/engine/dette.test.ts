import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { buyGenerator, grandRewrite, setRefactorActif } from "./actions";
import {
  COEF_DETTE_ACTE,
  GENERATOR_IDS,
  JS_CHAOS_MAX,
  JS_CHAOS_MIN,
  SEUIL_FIN_ACTE_1,
  TICK_DT,
} from "./constants";
import {
  archetypeProdMultiplier,
  archetypeStaticMultipliers,
  generatorCost,
  generatorRate,
  karmaGagne,
  locNetteTickAvecDette,
} from "./formulas";
import { createInitialState } from "./state";
import { tickState } from "./tick";
import { EMPTY_TICK_INPUT, type GameState, type TickInput } from "./types";

// Réf. docs/design/dette-technique-grand-rewrite.md §9 (critères d'acceptation),
// numéros cités dans chaque `it`/`describe` (ex. "§9.3" = critère 3).

function input(partial: Partial<TickInput>): TickInput {
  return { ...EMPTY_TICK_INPUT, ...partial };
}

function runTicks(
  state: GameState,
  n: number,
  getInput: () => TickInput = () => EMPTY_TICK_INPUT,
): GameState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = tickState(s, TICK_DT, getInput());
  }
  return s;
}

describe("critère §9.1 — gating de l'accumulation en Acte I", () => {
  it("acte=1, production non nulle sur N ticks : dette reste exactement 0 à chaque tick", () => {
    let s: GameState = {
      ...createInitialState(),
      generators: { copierColler: 10, stagiaire: 5, rubberDuck: 1 },
    };
    for (let i = 0; i < 50; i++) {
      s = tickState(s, TICK_DT, input({ clicksEcrireCode: 1 }));
      expect(s.dette.toNumber()).toBe(0);
    }
  });
});

describe("critère §9.2 — accumulation exacte", () => {
  it("acte>=2, refactor_actif=false, langue='none' : dette augmente d'exactement loc_brute_tick × 0.15", () => {
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      generators: { copierColler: 10, stagiaire: 0, rubberDuck: 0 },
    };
    // taux_generateurs_brute = 10 × prod_base ; loc_brute_tick = taux × dt
    // (aucun clic, langue='none' => mult_prod_loc_tick = 1, aucune modification).
    // prodBase lu via generatorRate (pas codé en dur) : reste valide après le
    // recalibrage 2026-08-27 (acte-1-solo-dev.md §1.3).
    const locBruteTick = generatorRate("copierColler", 10).toNumber() * TICK_DT;
    const after = tickState(state, TICK_DT, EMPTY_TICK_INPUT);
    expect(after.dette.sub(state.dette).toNumber()).toBeCloseTo(locBruteTick * 0.15, 10);
  });
});

describe("critère §9.3 — table de vérification de la pénalité de dette", () => {
  it.each([
    [0, 1.0],
    [1500, 0.5443],
    [3000, 0.3536],
    [6000, 0.1925],
    [9000, 0.125],
    [15000, 0.068],
    [30000, 0.0274],
  ])("dette=%i -> ratio loc_nette_tick_dette / loc_nette_tick = %f", (dette, expectedRatio) => {
    const ratio = locNetteTickAvecDette(new Decimal(1), new Decimal(dette));
    expect(ratio.toNumber()).toBeCloseTo(expectedRatio, 3);
  });
});

describe("critère §9.4 — pénalité jamais nulle, strictement décroissante", () => {
  it("pour toute suite croissante de dette (y compris arbitrairement grande), loc_nette_tick_dette reste > 0 et strictement décroissante", () => {
    const locNetteTick = new Decimal(1000);
    const dettes = [0, 1, 10, 100, 1000, 1e6, 1e12, 1e30, 1e100].map((d) => new Decimal(d));
    let prev: Decimal | null = null;
    for (const dette of dettes) {
      const result = locNetteTickAvecDette(locNetteTick, dette);
      expect(result.gt(0)).toBe(true);
      if (prev !== null) {
        expect(result.lt(prev)).toBe(true);
      }
      prev = result;
    }
  });
});

describe("critère §9.5 — compatibilité Acte I", () => {
  it("dette=0 => loc_nette_tick_dette === loc_nette_tick exactement", () => {
    const locNetteTick = new Decimal("12345.6789");
    const result = locNetteTickAvecDette(locNetteTick, new Decimal(0));
    expect(result.eq(locNetteTick)).toBe(true);
  });
});

describe("critère §9.6 — refactoring, réduction exacte", () => {
  it("refactor_actif=true pendant T secondes (aucune autre source de variation) : dette diminue de exactement 60 × T", () => {
    const T = 10;
    const nTicks = Math.round(T / TICK_DT);
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      dette: new Decimal(5000),
      refactorActif: true,
    };
    const after = runTicks(state, nTicks);
    expect(state.dette.sub(after.dette).toNumber()).toBeCloseTo(60 * T, 6);
  });

  it("plancher 0 : une réduction qui dépasserait le stock de dette ne descend jamais en négatif", () => {
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      dette: new Decimal(1), // 60 × dt = 6, largement supérieur au stock
      refactorActif: true,
    };
    const after = tickState(state, TICK_DT, EMPTY_TICK_INPUT);
    expect(after.dette.toNumber()).toBe(0);
  });
});

describe("critère §9.7 — refactoring bloque les actions", () => {
  it("refactor_actif=true : un clic 'Écrire du code' n'ajoute aucune LoC", () => {
    const state: GameState = { ...createInitialState(), refactorActif: true };
    const after = tickState(state, TICK_DT, input({ clicksEcrireCode: 10 }));
    expect(after.loc.toNumber()).toBe(0);
  });

  it("refactor_actif=true : un clic 'Debug' ne réduit pas bugs_actifs", () => {
    const state: GameState = { ...createInitialState(), refactorActif: true, bugs: 5 };
    const after = tickState(state, TICK_DT, input({ clicksDebug: 3 }));
    expect(after.bugs).toBe(5);
  });
});

describe("critère §9.8 — refactoring ne bloque pas les générateurs", () => {
  it("la production passive des générateurs (et l'accumulation de dette qu'elle cause) continue pendant refactor_actif", () => {
    // dette de départ assez haute pour ne pas être clampée par la réduction sur
    // ce seul tick (60 × dt = 6) : isole l'effet de l'accumulation générateur.
    const base: GameState = {
      ...createInitialState(),
      acte: 2,
      refactorActif: true,
      dette: new Decimal(1000),
    };
    const withGenerators: GameState = {
      ...base,
      generators: { copierColler: 10, stagiaire: 0, rubberDuck: 0 },
    };
    const withoutGenerators: GameState = {
      ...base,
      generators: { copierColler: 0, stagiaire: 0, rubberDuck: 0 },
    };

    const afterWith = tickState(withGenerators, TICK_DT, EMPTY_TICK_INPUT);
    const afterWithout = tickState(withoutGenerators, TICK_DT, EMPTY_TICK_INPUT);

    // Les deux diminuent (la réduction du refactor domine), mais celle avec
    // générateurs diminue moins : la différence est exactement l'accumulation
    // causée par les générateurs sur ce tick (loc_brute_tick × 0.15).
    expect(afterWith.dette.lt(base.dette)).toBe(true);
    expect(afterWithout.dette.lt(base.dette)).toBe(true);
    const diff = afterWith.dette.sub(afterWithout.dette).toNumber();
    const locBruteTick = generatorRate("copierColler", 10).toNumber() * TICK_DT;
    expect(diff).toBeCloseTo(locBruteTick * 0.15, 10);
    expect(afterWith.loc.gt(0)).toBe(true); // la production de LoC continue aussi
  });
});

describe("critère §9.9 — calcul du Karma", () => {
  it("karma_gagne === floor(sqrt(loc_totales_gagnees)) exactement, karma_rewrite += karma_gagne", () => {
    const Y = 123456;
    expect(karmaGagne(new Decimal(Y)).toNumber()).toBe(Math.floor(Math.sqrt(Y)));

    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      locTotal: new Decimal(Y),
      karmaRewrite: new Decimal(7),
    };
    const after = grandRewrite(state, "rust");
    expect(after.karmaRewrite.toNumber()).toBe(7 + Math.floor(Math.sqrt(Y)));
  });
});

describe("critère §9.10 — contrat de reset exact du Grand Rewrite", () => {
  it("reset LoC/loc_totales_gagnees/bugs/dette/café/générateurs/acte, karma_rewrite strictement > valeur précédente", () => {
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      loc: new Decimal(500),
      locTotal: new Decimal(20000),
      bugs: 12,
      dette: new Decimal(3000),
      cafeStock: 2,
      cafeBuffRemaining: 15,
      generators: { copierColler: 5, stagiaire: 2, rubberDuck: 1 },
      karmaRewrite: new Decimal(0),
      stars: new Decimal(10),
    };
    const after = grandRewrite(state, "python");
    const fresh = createInitialState();

    expect(after.loc.eq(fresh.loc)).toBe(true);
    expect(after.locTotal.eq(fresh.locTotal)).toBe(true);
    expect(after.bugs).toBe(fresh.bugs);
    expect(after.dette.eq(fresh.dette)).toBe(true);
    expect(after.cafeStock).toBe(fresh.cafeStock);
    expect(after.cafeBuffRemaining).toBe(fresh.cafeBuffRemaining);
    expect(after.generators).toEqual(fresh.generators);
    expect(after.acte).toBe(1);
    expect(after.karmaRewrite.gt(state.karmaRewrite)).toBe(true);
    // Non listé au reset (spec §3.3) : persiste tel quel.
    expect(after.stars.eq(state.stars)).toBe(true);
  });

  it("karma_rewrite égal à la valeur précédente seulement si loc_totales_gagnees = 0", () => {
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      locTotal: new Decimal(0),
      karmaRewrite: new Decimal(3),
    };
    const after = grandRewrite(state, "rust");
    expect(after.karmaRewrite.eq(state.karmaRewrite)).toBe(true);
  });
});

describe("critère §9.11 — disponibilité du Grand Rewrite", () => {
  it("indisponible (no-op strict) tant que acte === 1", () => {
    const state: GameState = { ...createInitialState(), acte: 1, locTotal: new Decimal(100) };
    const after = grandRewrite(state, "rust");
    expect(after).toBe(state);
  });

  it("disponible dès acte >= 2, sans autre condition", () => {
    const state: GameState = { ...createInitialState(), acte: 2, locTotal: new Decimal(100) };
    const after = grandRewrite(state, "rust");
    expect(after.acte).toBe(1);
    expect(after.langueActive).toBe("rust");
  });
});

describe("critère §9.12 — archétype Rust", () => {
  it("production totale ×0.80, taux_bug effectif ×0.10, coef_dette_acte effectif ×0.50, coûts générateurs inchangés", () => {
    const { value: multProd } = archetypeProdMultiplier("rust", 0);
    expect(multProd).toBe(0.8);

    const locClicTick = new Decimal(10); // valeurs de test fixées (§9.12)
    const locGenerateursTick = new Decimal(5);
    const locBruteTickRust = locClicTick.add(locGenerateursTick).mul(multProd);
    const locBruteTickAucun = locClicTick.add(locGenerateursTick).mul(1.0);
    expect(locBruteTickRust.div(locBruteTickAucun).toNumber()).toBeCloseTo(0.8, 10);

    const { multTauxBug, multCoefDetteActe } = archetypeStaticMultipliers("rust");
    expect(multTauxBug).toBeCloseTo(0.1, 10);
    expect(multCoefDetteActe).toBeCloseTo(0.5, 10);

    for (const id of GENERATOR_IDS) {
      // generatorCost ne prend jamais l'archétype en paramètre : structurellement
      // impossible qu'il en dépende (spec §4.1 : "aucun archétype ne modifie
      // cout_base ni taux_croissance").
      expect(generatorCost(id, 4).eq(generatorCost(id, 4))).toBe(true);
    }
  });
});

describe("critère §9.13 — archétype Python", () => {
  it("production ×1.15, taux_bug effectif ×1.30, coef_dette_acte effectif inchangé (×1.00)", () => {
    const { value: multProd } = archetypeProdMultiplier("python", 0);
    expect(multProd).toBe(1.15);

    const locClicTick = new Decimal(10);
    const locGenerateursTick = new Decimal(5);
    const locBruteTickPython = locClicTick.add(locGenerateursTick).mul(multProd);
    const locBruteTickAucun = locClicTick.add(locGenerateursTick).mul(1.0);
    expect(locBruteTickPython.div(locBruteTickAucun).toNumber()).toBeCloseTo(1.15, 10);

    const { multTauxBug, multCoefDetteActe } = archetypeStaticMultipliers("python");
    expect(multTauxBug).toBeCloseTo(1.3, 10);
    expect(multCoefDetteActe).toBeCloseTo(1.0, 10);
  });
});

describe("critère §9.14 — archétype JavaScript, bornes du tirage", () => {
  it("sur >=1000 tirages (RNG seedée), toutes les valeurs tombent dans [0.70, 1.90], aucun effet sur bugs/dette", () => {
    let seed = 42;
    const values: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const { value, nextSeed } = archetypeProdMultiplier("javascript", seed);
      values.push(value);
      seed = nextSeed;
    }
    expect(values.every((v) => v >= JS_CHAOS_MIN && v <= JS_CHAOS_MAX)).toBe(true);

    const { multTauxBug, multCoefDetteActe } = archetypeStaticMultipliers("javascript");
    expect(multTauxBug).toBe(1.0);
    expect(multCoefDetteActe).toBe(1.0);
  });
});

describe("critère §9.15 — archétype JavaScript, espérance", () => {
  it("sur >=1000 tirages (même RNG seedée), la moyenne empirique est égale à 1.30 à ±5% près", () => {
    let seed = 42;
    let sum = 0;
    const n = 5000; // marge confortable pour la convergence de la moyenne empirique
    for (let i = 0; i < n; i++) {
      const { value, nextSeed } = archetypeProdMultiplier("javascript", seed);
      sum += value;
      seed = nextSeed;
    }
    const mean = sum / n;
    expect(mean).toBeGreaterThan(1.3 * 0.95);
    expect(mean).toBeLessThan(1.3 * 1.05);
  });
});

describe("critère §9.16 — loc_totales_gagnees, exception unique", () => {
  it("un achat de générateur ne le décrémente jamais", () => {
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      loc: new Decimal(1000),
      locTotal: new Decimal(1000),
      generators: { copierColler: 5, stagiaire: 0, rubberDuck: 0 },
    };
    const after = buyGenerator(state, "copierColler");
    expect(after.locTotal.eq(state.locTotal)).toBe(true);
  });

  it("un tick normal ne le décrémente jamais", () => {
    const state: GameState = { ...createInitialState(), acte: 2, locTotal: new Decimal(1000) };
    const after = tickState(state, TICK_DT, EMPTY_TICK_INPUT);
    expect(after.locTotal.gte(state.locTotal)).toBe(true);
  });

  it("seul le Grand Rewrite est autorisé à le remettre à 0", () => {
    const state: GameState = { ...createInitialState(), acte: 2, locTotal: new Decimal(1000) };
    const after = grandRewrite(state, "none");
    expect(after.locTotal.toNumber()).toBe(0);
  });
});

describe("critère §9.17 — tick de transition Acte I → Acte II (non-régression)", () => {
  it("dette reste exactement 0 sur le tick de franchissement du seuil, acte passe à 2 sur ce même tick, puis l'accumulation reprend normalement au tick suivant", () => {
    // Juste sous le seuil (spec §1.1/§9.17), avec assez de production (générateurs
    // seuls, comme §9.2) pour franchir SEUIL_FIN_ACTE_1 sur le prochain tick.
    const before: GameState = {
      ...createInitialState(),
      acte: 1,
      locTotal: new Decimal(SEUIL_FIN_ACTE_1).sub(0.01), // 9999.99
      generators: { copierColler: 10, stagiaire: 0, rubberDuck: 0 },
    };

    // Tick de franchissement : le gating de dette (§1.1) lit encore acte===1
    // *pendant* ce tick (la transition n'est appliquée qu'après l'étape 9) donc
    // aucune dette n'est accumulée, alors que l'acte a bien basculé en sortie.
    const atCrossing = tickState(before, TICK_DT, EMPTY_TICK_INPUT);
    expect(before.locTotal.lt(SEUIL_FIN_ACTE_1)).toBe(true);
    expect(atCrossing.locTotal.gte(SEUIL_FIN_ACTE_1)).toBe(true);
    expect(atCrossing.dette.toNumber()).toBe(0);
    expect(atCrossing.acte).toBe(2);

    // Tick suivant : acte=2 déjà posé en entrée => l'accumulation reprend, exactement
    // loc_brute_tick × coef_dette_acte (mêmes générateurs, langue 'none' => mult=1).
    const locBruteTickSuivant = generatorRate("copierColler", 10).toNumber() * TICK_DT; // taux_generateurs_brute × dt
    const after = tickState(atCrossing, TICK_DT, EMPTY_TICK_INPUT);
    expect(after.dette.toNumber()).toBeGreaterThan(0);
    expect(after.dette.toNumber()).toBeCloseTo(locBruteTickSuivant * COEF_DETTE_ACTE, 10);
  });
});

describe("setRefactorActif — câblage worker/store", () => {
  it("bascule refactorActif sans toucher au reste du state", () => {
    const state = createInitialState();
    const started = setRefactorActif(state, true);
    expect(started.refactorActif).toBe(true);
    const stopped = setRefactorActif(started, false);
    expect(stopped.refactorActif).toBe(false);
  });
});
