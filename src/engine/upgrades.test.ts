import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { buyUpgrade, claimNpmInstall, grandRewrite } from "./actions";
import {
  AUTO_COMPLETE_TAUX,
  COEF_DETTE_ACTE,
  GENERATOR_IDS,
  NPM_INSTALL_BURST_DETTE,
  NPM_INSTALL_BURST_LOC,
  SEUIL_FIN_ACTE_1,
  TESTS_AUTO_MULT_COEF_DETTE,
  TICK_DT,
  UPGRADES,
} from "./constants";
import {
  bugMultiplier,
  generatorCost,
  generatorRate,
  impactBugEffectif,
  isUpgradeUnlocked,
  unlockThreshold,
  upgradeCost,
  upgradeUnlockThreshold,
} from "./formulas";
import { createInitialState } from "./state";
import { tickState } from "./tick";
import { EMPTY_TICK_INPUT, type GameState, type TickInput } from "./types";

// Réf. docs/design/upgrades-acte-1-2.md §6 (critères d'acceptation), numéros
// cités dans chaque `it`/`describe` (ex. "§6.3" = critère 3) — même convention
// que dette.test.ts ("§9.N").

function input(partial: Partial<TickInput>): TickInput {
  return { ...EMPTY_TICK_INPUT, ...partial };
}

describe("critère §6.1 — U1 achat", () => {
  it("avec LoC >= 250, achète Auto-complétion : déduit exactement 250, ne touche pas locTotal, upgrades.autoComplete=true", () => {
    const state: GameState = { ...createInitialState(), loc: new Decimal(250) };
    const after = buyUpgrade(state, "autoComplete");
    expect(after.loc.toNumber()).toBe(0);
    expect(after.locTotal.eq(state.locTotal)).toBe(true);
    expect(after.upgrades.autoComplete).toBe(true);
  });

  it("indisponible/non visible tant que loc_totales_gagnees < 125, visible dès 125", () => {
    const threshold = upgradeUnlockThreshold("autoComplete");
    expect(threshold.toNumber()).toBe(125);
    expect(isUpgradeUnlocked("autoComplete", threshold.sub(0.01))).toBe(false);
    expect(isUpgradeUnlocked("autoComplete", threshold)).toBe(true);
  });
});

describe("critère §6.2 — U1 effet", () => {
  it("upgrades.autoComplete=true, 0 générateur, 0 clic, sur 10 ticks (1s réelle) : gain de LoC brut = 1.5 exactement (langue='none', via la dette qui accumule sur loc_brute_tick, non affectée par la pénalité de bugs)", () => {
    let s: GameState = {
      ...createInitialState(),
      acte: 2, // seul moyen d'observer loc_brute_tick sans le bruit de la pénalité
      // de bugs (dette-technique-grand-rewrite.md §1.2 : la dette accumule sur
      // loc_brute_tick, jamais loc_nette_tick — même principe que §1.4 du
      // document upgrades pour ratio_idle).
      upgrades: { ...createInitialState().upgrades, autoComplete: true },
    };
    for (let i = 0; i < 10; i++) {
      s = tickState(s, TICK_DT, EMPTY_TICK_INPUT);
    }
    // dette = Σ loc_brute_tick × COEF_DETTE_ACTE (multCoefDetteActe='none' => 1)
    expect(s.dette.div(COEF_DETTE_ACTE).toNumber()).toBeCloseTo(1.5, 10);
  });

  it("affecté par l'archétype de langue actif, exactement comme loc_generateurs_tick (même mult_prod_loc_tick)", () => {
    // Python : mult_prod_loc_tick=1.15, mult_coef_dette_acte=1.0 (inchangé) — isole
    // l'effet de production de l'effet de dette de l'archétype (contrairement à
    // Rust, qui changerait les deux à la fois).
    let s: GameState = {
      ...createInitialState(),
      acte: 2,
      langueActive: "python",
      upgrades: { ...createInitialState().upgrades, autoComplete: true },
    };
    for (let i = 0; i < 10; i++) {
      s = tickState(s, TICK_DT, EMPTY_TICK_INPUT);
    }
    expect(s.dette.div(COEF_DETTE_ACTE).toNumber()).toBeCloseTo(1.5 * 1.15, 10);
  });

  it("non affecté par le café (le café ne multiplie que loc_clic_tick, jamais taux_generateurs_brute)", () => {
    const base: GameState = {
      ...createInitialState(),
      upgrades: { ...createInitialState().upgrades, autoComplete: true },
    };
    const withoutCafe = tickState(base, TICK_DT, EMPTY_TICK_INPUT);
    const withCafe = tickState(
      { ...base, cafeBuffRemaining: 20 },
      TICK_DT,
      EMPTY_TICK_INPUT,
    );
    expect(withCafe.loc.eq(withoutCafe.loc)).toBe(true);
  });
});

describe("critère §6.3 — U2 achat", () => {
  it("avec LoC >= 3000, achète 'Ça marche sur ma machine' : déduit exactement 3000, ne touche pas locTotal, upgrades.worksOnMyMachine=true", () => {
    const state: GameState = { ...createInitialState(), loc: new Decimal(3000) };
    const after = buyUpgrade(state, "worksOnMyMachine");
    expect(after.loc.toNumber()).toBe(0);
    expect(after.locTotal.eq(state.locTotal)).toBe(true);
    expect(after.upgrades.worksOnMyMachine).toBe(true);
  });

  it("indisponible/non visible tant que loc_totales_gagnees < 1500, visible dès 1500", () => {
    const threshold = upgradeUnlockThreshold("worksOnMyMachine");
    expect(threshold.toNumber()).toBe(1500);
    expect(isUpgradeUnlocked("worksOnMyMachine", threshold.sub(0.01))).toBe(false);
    expect(isUpgradeUnlocked("worksOnMyMachine", threshold)).toBe(true);
  });
});

describe("critère §6.4 — U2 effet", () => {
  it("upgrades.worksOnMyMachine=true : multiplicateur_bug(80)=0.2 exactement (plancher déplacé de 40 à 80), multiplicateur_bug(40)=0.6 (pas 0.2)", () => {
    const impactEffectif = impactBugEffectif(true);
    expect(impactEffectif).toBeCloseTo(0.01, 10);
    expect(bugMultiplier(80, impactEffectif)).toBe(0.2);
    expect(bugMultiplier(40, impactEffectif)).toBeCloseTo(0.6, 10);
  });

  it("sans l'upgrade, la table §4.9 d'acte-1-solo-dev.md reste inchangée (plancher à 40, pas 80)", () => {
    const impactSansUpgrade = impactBugEffectif(false);
    expect(impactSansUpgrade).toBe(0.02);
    expect(bugMultiplier(40, impactSansUpgrade)).toBe(0.2);
    expect(bugMultiplier(80, impactSansUpgrade)).toBe(0.2);
  });
});

describe("critère §6.5 — U2 sans effet sur la génération de bugs ni sur la dette", () => {
  it("à loc_brute_tick constant, bugs_generes_ce_tick et l'incrément de dette sont strictement identiques avec ou sans l'upgrade, sur un tick isolé", () => {
    const base: GameState = {
      ...createInitialState(),
      acte: 2,
      generators: { copierColler: 10, stagiaire: 0, rubberDuck: 0 },
    };
    const withUpgrade = tickState(
      { ...base, upgrades: { ...base.upgrades, worksOnMyMachine: true } },
      TICK_DT,
      EMPTY_TICK_INPUT,
    );
    const withoutUpgrade = tickState(base, TICK_DT, EMPTY_TICK_INPUT);

    expect(withUpgrade.bugs).toBe(withoutUpgrade.bugs);
    expect(withUpgrade.dette.eq(withoutUpgrade.dette)).toBe(true);
  });
});

describe("critère §6.6 — U3 achat", () => {
  it("avec LoC >= 3000, achète 'Tests automatisés' : déduit exactement 3000, ne touche pas locTotal, upgrades.testsAutomatises=true, achetable dès acte===1", () => {
    // coutBase recalibré 5000 -> 3000 (décision user, upgrades-acte-1-2.md §4.3,
    // 2026-08-25).
    const state: GameState = {
      ...createInitialState(),
      acte: 1,
      loc: new Decimal(3000),
    };
    const after = buyUpgrade(state, "testsAutomatises");
    expect(after.loc.toNumber()).toBe(0);
    expect(after.locTotal.eq(state.locTotal)).toBe(true);
    expect(after.upgrades.testsAutomatises).toBe(true);
  });

  it("indisponible/non visible tant que loc_totales_gagnees < 1500, visible dès 1500", () => {
    // Seuil recalibré 2500 -> 1500 (= 0.5 × nouveau coutBase 3000, §4.3) —
    // désormais identique à celui de `worksOnMyMachine`, égalité acceptée par
    // décision documentée (§4.3), pas un oubli.
    const threshold = upgradeUnlockThreshold("testsAutomatises");
    expect(threshold.toNumber()).toBe(1500);
    expect(isUpgradeUnlocked("testsAutomatises", threshold.sub(0.01))).toBe(false);
    expect(isUpgradeUnlocked("testsAutomatises", threshold)).toBe(true);
  });

  it("dormant tant que acte===1 (achetée mais aucun effet, dette reste 0)", () => {
    let s: GameState = {
      ...createInitialState(),
      acte: 1,
      upgrades: { ...createInitialState().upgrades, testsAutomatises: true },
      generators: { copierColler: 10, stagiaire: 0, rubberDuck: 0 },
    };
    for (let i = 0; i < 20; i++) {
      s = tickState(s, TICK_DT, EMPTY_TICK_INPUT);
    }
    expect(s.dette.toNumber()).toBe(0);
  });
});

describe("critère §6.7 — U3 effet", () => {
  it("acte>=2, testsAutomatises=true, langue='none' : dette augmente d'exactement loc_brute_tick × 0.15 × 0.7", () => {
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      langueActive: "none",
      upgrades: { ...createInitialState().upgrades, testsAutomatises: true },
      generators: { copierColler: 10, stagiaire: 0, rubberDuck: 0 },
    };
    // taux_generateurs_brute = 10 × prod_base ; loc_brute_tick = taux × dt.
    // prodBase lu via generatorRate (pas codé en dur) : reste valide après le
    // recalibrage 2026-08-27 (acte-1-solo-dev.md §1.3).
    const locBruteTick = generatorRate("copierColler", 10).toNumber() * TICK_DT;
    const after = tickState(state, TICK_DT, EMPTY_TICK_INPUT);
    expect(after.dette.sub(state.dette).toNumber()).toBeCloseTo(
      locBruteTick * COEF_DETTE_ACTE * TESTS_AUTO_MULT_COEF_DETTE,
      10,
    );
  });

  it("avec langue='rust' en plus : incrément = loc_brute_tick × 0.15 × 0.5 × 0.7 (loc_brute_tick déjà réduit ×0.8 par l'archétype)", () => {
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      langueActive: "rust",
      upgrades: { ...createInitialState().upgrades, testsAutomatises: true },
      generators: { copierColler: 10, stagiaire: 0, rubberDuck: 0 },
    };
    // taux_generateurs_brute × dt × mult_prod_loc_tick(rust)
    const locBruteTick = generatorRate("copierColler", 10).toNumber() * TICK_DT * 0.8;
    const after = tickState(state, TICK_DT, EMPTY_TICK_INPUT);
    expect(after.dette.sub(state.dette).toNumber()).toBeCloseTo(
      locBruteTick * COEF_DETTE_ACTE * 0.5 * TESTS_AUTO_MULT_COEF_DETTE,
      10,
    );
  });
});

describe("critère §6.8 — U4 gating", () => {
  it("indisponible tant que acte===1, quel que soit loc_totales_gagnees", () => {
    const lowLoc: GameState = { ...createInitialState(), acte: 1, locTotal: new Decimal(0) };
    const highLoc: GameState = {
      ...createInitialState(),
      acte: 1,
      locTotal: new Decimal(1_000_000),
    };
    expect(claimNpmInstall(lowLoc)).toBe(lowLoc);
    expect(claimNpmInstall(highLoc)).toBe(highLoc);
  });

  it("disponible dès acte >= 2", () => {
    const state: GameState = { ...createInitialState(), acte: 2 };
    const after = claimNpmInstall(state);
    expect(after.upgrades.npmInstallClaimed).toBe(true);
  });
});

describe("critère §6.9 — U4 effet unique", () => {
  it("un premier claim ajoute exactement +8000 à LoC/loc_totales_gagnees et +1500 à dette ; un second claim est un no-op strict", () => {
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      loc: new Decimal(100),
      locTotal: new Decimal(20_000),
      dette: new Decimal(50),
    };
    const after = claimNpmInstall(state);
    expect(after.loc.sub(state.loc).toNumber()).toBe(NPM_INSTALL_BURST_LOC);
    expect(after.locTotal.sub(state.locTotal).toNumber()).toBe(NPM_INSTALL_BURST_LOC);
    expect(after.dette.sub(state.dette).toNumber()).toBe(NPM_INSTALL_BURST_DETTE);
    expect(after.upgrades.npmInstallClaimed).toBe(true);

    const second = claimNpmInstall(after);
    expect(second).toBe(after); // no-op strict, même référence
  });
});

describe("critère §6.10 — U4, cohérence avec l'invariant dette au tick de transition", () => {
  it("un claim déclenché sur l'état retourné par le tout premier tick où acte vient de passer à 2 réussit (traité après l'exécution complète du pipeline)", () => {
    const before: GameState = {
      ...createInitialState(),
      acte: 1,
      locTotal: new Decimal(SEUIL_FIN_ACTE_1).sub(0.01),
      generators: { copierColler: 10, stagiaire: 0, rubberDuck: 0 },
    };
    const atCrossing = tickState(before, TICK_DT, EMPTY_TICK_INPUT);
    expect(atCrossing.acte).toBe(2); // transition déjà appliquée en sortie du tick

    const claimed = claimNpmInstall(atCrossing);
    expect(claimed.upgrades.npmInstallClaimed).toBe(true);
    expect(claimed.loc.sub(atCrossing.loc).toNumber()).toBe(NPM_INSTALL_BURST_LOC);
    expect(claimed.dette.sub(atCrossing.dette).toNumber()).toBe(NPM_INSTALL_BURST_DETTE);
  });
});

describe("critère §6.11 — reset au Grand Rewrite", () => {
  it("après un Grand Rewrite, les 4 champs upgrades valent tous false, quelle que soit leur valeur avant", () => {
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      upgrades: {
        autoComplete: true,
        worksOnMyMachine: true,
        testsAutomatises: true,
        npmInstallClaimed: true,
      },
    };
    const after = grandRewrite(state, "rust");
    expect(after.upgrades).toEqual({
      autoComplete: false,
      worksOnMyMachine: false,
      testsAutomatises: false,
      npmInstallClaimed: false,
    });
  });
});

describe("critère §6.12 — indépendance mutuelle", () => {
  it("acheter/claim une upgrade ne modifie ni le coût, ni le seuil, ni l'état possédé des autres upgrades/générateurs", () => {
    const state: GameState = {
      ...createInitialState(),
      acte: 2,
      loc: new Decimal(1_000_000),
      locTotal: new Decimal(1_000_000),
      generators: { copierColler: 3, stagiaire: 1, rubberDuck: 0 },
    };

    const afterU1 = buyUpgrade(state, "autoComplete");
    expect(afterU1.upgrades.worksOnMyMachine).toBe(false);
    expect(afterU1.upgrades.testsAutomatises).toBe(false);
    expect(afterU1.upgrades.npmInstallClaimed).toBe(false);
    expect(afterU1.generators).toEqual(state.generators);

    const afterU2 = buyUpgrade(afterU1, "worksOnMyMachine");
    // Le coût de U2 reste 3000 pile, non affecté par l'achat préalable de U1.
    expect(state.loc.sub(afterU1.loc).toNumber()).toBe(UPGRADES.autoComplete.coutBase);
    expect(afterU1.loc.sub(afterU2.loc).toNumber()).toBe(UPGRADES.worksOnMyMachine.coutBase);
    expect(afterU2.upgrades.testsAutomatises).toBe(false);
    expect(afterU2.upgrades.npmInstallClaimed).toBe(false);

    const afterClaim = claimNpmInstall(afterU2);
    expect(afterClaim.upgrades.autoComplete).toBe(true);
    expect(afterClaim.upgrades.worksOnMyMachine).toBe(true);
    expect(afterClaim.generators).toEqual(state.generators);

    // Coûts/seuils des générateurs, indépendants de l'état des upgrades.
    for (const id of GENERATOR_IDS) {
      expect(generatorCost(id, 5).eq(generatorCost(id, 5))).toBe(true);
      expect(unlockThreshold(id).eq(unlockThreshold(id))).toBe(true);
    }
    expect(upgradeCost("testsAutomatises").toNumber()).toBe(3000); // recalibré 2026-08-25
  });
});

describe("critère §6.13 — ratio idle, jalon §1.4, profil actif", () => {
  it("~2 clics/s, achats de générateurs et d'U1 dès que possible, ratio_idle >= 0.50 au moment du premier Grand Rewrite (proxy : transition Acte I -> II)", () => {
    let state: GameState = createInitialState();
    let locClicSum = 0;
    let locGenSum = 0;
    let tickIndex = 0;
    const MAX_TICKS = 300_000; // garde-fou, largement au-dessus du pacing attendu (~30 min)

    while (state.acte === 1 && tickIndex < MAX_TICKS) {
      // Achat glouton : tout générateur affordable est acheté immédiatement,
      // puis Auto-complétion dès que possible (§1.4 : "profil joueur actif").
      let bought = true;
      while (bought) {
        bought = false;
        for (const id of GENERATOR_IDS) {
          const cost = generatorCost(id, state.generators[id]);
          if (state.loc.gte(cost)) {
            state = {
              ...state,
              loc: state.loc.sub(cost),
              generators: { ...state.generators, [id]: state.generators[id] + 1 },
            };
            bought = true;
          }
        }
      }
      if (!state.upgrades.autoComplete) {
        state = buyUpgrade(state, "autoComplete");
      }

      // ~2 clics/s à 10 ticks/s = 1 clic tous les 5 ticks.
      const clicksEcrireCode = tickIndex % 5 === 0 ? 1 : 0;

      // Composantes brutes de CE tick, calculées à partir de l'état d'entrée
      // (après achats ci-dessus, avant le tick) — même règle que le pipeline
      // (tick.ts étape 1/2), café toujours inactif dans ce profil (non consommé).
      locClicSum += clicksEcrireCode; // base_clic=1, pas de café
      const tauxGenerateursBrute = GENERATOR_IDS.reduce(
        (sum, id) => sum + generatorRate(id, state.generators[id]).toNumber(),
        0,
      ) + (state.upgrades.autoComplete ? AUTO_COMPLETE_TAUX : 0);
      locGenSum += tauxGenerateursBrute * TICK_DT;

      state = tickState(state, TICK_DT, input({ clicksEcrireCode }));
      tickIndex++;
    }

    expect(state.acte).toBe(2); // le profil atteint bien la transition dans le budget de ticks
    const ratioIdle = locGenSum / (locGenSum + locClicSum);
    expect(ratioIdle).toBeGreaterThanOrEqual(0.5);
  });
});

describe("critère §6.14 — ratio idle, profil passif après achat d'U1, non-stagnation", () => {
  it("0 générateur, upgrades.autoComplete=true, 0 clic après achat : loc_brute_tick > 0 à chaque tick (production nette strictement croissante)", () => {
    let s: GameState = {
      ...createInitialState(),
      upgrades: { ...createInitialState().upgrades, autoComplete: true },
    };
    for (let i = 0; i < 200; i++) {
      const before = s.loc;
      s = tickState(s, TICK_DT, EMPTY_TICK_INPUT);
      expect(s.loc.gt(before)).toBe(true);
    }
  });
});
