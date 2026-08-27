import Decimal from "break_eternity.js";
import { describe, expect, it } from "vitest";
import { CAFE_MAX_STOCK, GENERATORS, TAUX_BUG, TICK_DT } from "./constants";
import { generatorRate, rubberDuckFixRate } from "./formulas";
import { grandRewrite } from "./actions";
import { createInitialState } from "./state";
import { tickState } from "./tick";
import { EMPTY_TICK_INPUT, type GameState, type TickInput } from "./types";

// Réf. docs/design/acte-1-solo-dev.md §4 (critères d'acceptation), numéros cités
// dans chaque `it`.

function input(partial: Partial<TickInput>): TickInput {
  return { ...EMPTY_TICK_INPUT, ...partial };
}

function runTicks(state: GameState, n: number, getInput: () => TickInput = () => EMPTY_TICK_INPUT): GameState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = tickState(s, TICK_DT, getInput());
  }
  return s;
}

describe("Mise à l'échelle du débit générateur au tick — Finding A (non-régression historique) — §4.3", () => {
  it("10 Copier-coller Stack Overflow, 10 ticks (1s réelle), aucun autre effet : la part générateur du gain de LoC vaut exactement k × prod_base, jamais ×10", () => {
    // Réf. balance-qa 2026-08-04 : le pipeline appliquait `dt` au Rubber Duck et
    // au clic mais jamais aux générateurs, un facteur ~10× de surproduction.
    // Test au niveau formule (taux_generateurs_brute × dt), indépendant de toute
    // pénalité de bugs, pour vérifier la conversion débit -> quantité de tick
    // isolément — c'est exactement l'étape 3 du pipeline (tick.ts) qui avait
    // sauté cette multiplication. `prodBase` lu depuis la constante (pas codé en
    // dur) : reste valide après le recalibrage 2026-08-27 (acte-1-solo-dev.md).
    const k = 10;
    const prodBase = GENERATORS.copierColler.prodBase;
    const tauxGenerateursBrute = generatorRate("copierColler", k);
    let totalBruteSur10Ticks = new Decimal(0);
    for (let i = 0; i < 10; i++) {
      totalBruteSur10Ticks = totalBruteSur10Ticks.add(tauxGenerateursBrute.mul(TICK_DT));
    }
    expect(totalBruteSur10Ticks.toNumber()).toBeCloseTo(k * prodBase, 10);
    expect(totalBruteSur10Ticks.toNumber()).not.toBeCloseTo(k * prodBase * 10, 0);
  });

  it("via le pipeline complet (tickState) : le gain de LoC net sur 10 ticks reste au voisinage du débit annoncé, jamais ×10", () => {
    // Garde-fou d'intégration : contrairement au test ci-dessus (formule pure),
    // celui-ci passe par tickState et aurait donc détecté le Finding A même s'il
    // n'avait vécu QUE dans le câblage de tick.ts (générateur jamais multiplié
    // par dt avant d'être ajouté à loc_brute_tick), pas dans formulas.ts.
    // 1 unité à prod_base=1.0 (recalibré 2026-08-27) reproduit exactement le même
    // débit total (1.0 LoC/s) que l'ancien "10 unités à prod_base=0.1" : bornes
    // de tolérance inchangées.
    const state: GameState = {
      ...createInitialState(),
      generators: { copierColler: 1, stagiaire: 0, rubberDuck: 0 },
    };
    const after = runTicks(state, 10);
    // Légèrement sous 1.0 (pénalité de bugs générés par cette même production,
    // §3.3), jamais proche de 10.0 (régression du Finding A).
    expect(after.loc.toNumber()).toBeGreaterThan(0.99);
    expect(after.loc.toNumber()).toBeLessThan(1.0);
  });
});

describe("Clic de base — §4.3", () => {
  it("un clic sans buff café ajoute exactement 1 LoC brute au tick courant", () => {
    // locTotal fixé à une valeur non nulle en entrée pour exercer le pipeline
    // standard (hors cas particulier "premier clic", §3.6, testé séparément
    // ci-dessous) : un état frais (locTotal=0) déclencherait l'exemption de
    // pénalité de bugs et masquerait ce que ce test vérifie ici.
    const state: GameState = { ...createInitialState(), locTotal: new Decimal(1) };
    const after = tickState(state, TICK_DT, input({ clicksEcrireCode: 1 }));
    // La brute (prod_clic_brute) vaut 1 exactement — vérifié isolément par
    // clickProduction(false) dans formulas.test.ts. Ici, le clic génère aussi
    // 2% de bugs (TAUX_BUG=0.02, recalibrage 2026-08-25) qui pénalisent CE MÊME
    // tick (spec §3.5, étape 4 précède étape 6) : loc n'est donc pas 1 pile mais
    // 1 × (1 - 0.02 × 0.02) = 0.9996.
    expect(after.loc.toNumber()).toBeCloseTo(0.9996, 10);
  });
});

describe("Cas particulier premier clic — §3.6/§4.18", () => {
  it("(a) locTotal=0 en entrée + un clic : gain net = loc_clic_tick exactement, bugs_actifs=0 en sortie", () => {
    const state = createInitialState();
    expect(state.locTotal.toNumber()).toBe(0);
    const after = tickState(state, TICK_DT, input({ clicksEcrireCode: 1 }));
    // base_clic = 1, aucune réduction par la pénalité de bugs que ce même clic
    // génère sur ce même tick (spec §3.6, exemption étape 5).
    expect(after.loc.toNumber()).toBe(1);
    expect(after.locTotal.toNumber()).toBe(1);
    expect(after.bugs).toBe(0);
  });

  it("(a bis) locTotal=0 + un clic avec buff Café actif : gain net = base_clic × cafe_mult_clic exactement", () => {
    const state: GameState = { ...createInitialState(), cafeBuffRemaining: 20 };
    const after = tickState(state, TICK_DT, input({ clicksEcrireCode: 1 }));
    // L'exemption porte uniquement sur la pénalité de bugs, jamais sur le
    // multiplicateur Café (spec §3.6, "ce que ce cas ne change pas").
    expect(after.loc.toNumber()).toBe(3);
    expect(after.bugs).toBe(0);
  });

  it("(b) le tick immédiatement suivant (locTotal > 0) applique de nouveau le pipeline standard, sans exemption", () => {
    const state = createInitialState();
    const firstClick = tickState(state, TICK_DT, input({ clicksEcrireCode: 1 }));
    expect(firstClick.locTotal.gt(0)).toBe(true);

    const secondClick = tickState(firstClick, TICK_DT, input({ clicksEcrireCode: 1 }));
    // Pipeline standard : loc_brute_tick=1, bugs générés=1×0.02=0.02, pénalité
    // appliquée sur bugs_actifs=0.02 => multiplicateur = 1 - 0.02×0.02 = 0.9996.
    const gain = secondClick.loc.sub(firstClick.loc).toNumber();
    expect(gain).toBeCloseTo(0.9996, 10);
    expect(secondClick.bugs).toBeCloseTo(0.02, 10);
  });

  it("(c) après un Grand Rewrite, un nouveau premier clic observe exactement le même comportement qu'à la création d'une run fraîche", () => {
    // Run initiale poussée jusqu'à l'Acte II puis rewritée, pour obtenir un état
    // "post-Rewrite" réaliste (locTotal=0, bugs=0, generators=0, comme un état
    // frais) plutôt qu'un état construit à la main.
    const preRewrite: GameState = {
      ...createInitialState(),
      acte: 2,
      locTotal: new Decimal(500),
    };
    const postRewrite = grandRewrite(preRewrite, "none");
    expect(postRewrite.locTotal.toNumber()).toBe(0);

    const freshRun = createInitialState();

    const afterPostRewriteClick = tickState(postRewrite, TICK_DT, input({ clicksEcrireCode: 1 }));
    const afterFreshRunClick = tickState(freshRun, TICK_DT, input({ clicksEcrireCode: 1 }));

    expect(afterPostRewriteClick.loc.toNumber()).toBe(afterFreshRunClick.loc.toNumber());
    expect(afterPostRewriteClick.loc.toNumber()).toBe(1);
    expect(afterPostRewriteClick.bugs).toBe(0);
  });
});

describe("Bugs — génération sur loc_brute_tick, jamais loc_nette_tick — §4.7", () => {
  it("bugs_actifs augmente de loc_brute_tick × 0.02, calculé avant la pénalité de ce tick", () => {
    // locTotal fixé non nul en entrée pour rester hors du cas particulier
    // "premier clic" (§3.6, testé séparément) — sinon l'étape 5 serait sautée.
    const state: GameState = {
      ...createInitialState(),
      locTotal: new Decimal(1),
      generators: { copierColler: 10, stagiaire: 0, rubberDuck: 0 },
    };
    // taux_generateurs_brute = 10 × prod_base (débit) ; converti en quantité de
    // CE tick via × dt (étape 3, Finding A) : loc_brute_tick = taux × dt.
    // bugs=0 initial => pas de pénalité sur ce tick (qui utiliserait de toute
    // façon loc_nette_tick seulement pour LoC, jamais pour la génération de bugs).
    // TAUX_BUG recalibré 0.05 -> 0.02 (2026-08-25). prodBase lu depuis la
    // constante : reste valide après le recalibrage 2026-08-27.
    const locBruteTick = generatorRate("copierColler", 10).toNumber() * TICK_DT;
    const after = tickState(state, TICK_DT, EMPTY_TICK_INPUT);
    expect(after.bugs).toBeCloseTo(locBruteTick * TAUX_BUG, 10);
  });
});

describe("Bugs — plancher jamais nul — §4.9", () => {
  it("prod_nette reste strictement positive même avec un nombre de bugs arbitrairement grand", () => {
    const state: GameState = {
      ...createInitialState(),
      bugs: 1_000_000, // état de test contrôlé, cf. §4.8
      generators: { copierColler: 10, stagiaire: 0, rubberDuck: 0 },
    };
    const after = tickState(state, TICK_DT, EMPTY_TICK_INPUT);
    expect(after.loc.gt(state.loc)).toBe(true);
    expect(after.loc.sub(state.loc).toNumber()).toBeGreaterThan(0);
  });
});

describe("Debug (clic) — §4.10", () => {
  it("réduit bugs_actifs d'exactement 1 sans toucher aux autres ressources", () => {
    const state: GameState = {
      ...createInitialState(),
      bugs: 5,
      generators: { copierColler: 3, stagiaire: 0, rubberDuck: 0 },
    };
    const withDebug = tickState(state, TICK_DT, input({ clicksDebug: 1 }));
    const withoutDebug = tickState(state, TICK_DT, EMPTY_TICK_INPUT);

    expect(withDebug.bugs).toBeCloseTo(withoutDebug.bugs - 1, 10);
    expect(withDebug.loc.eq(withoutDebug.loc)).toBe(true);
    expect(withDebug.cafeStock).toBeCloseTo(withoutDebug.cafeStock, 10);
    expect(withDebug.generators).toEqual(withoutDebug.generators);
  });

  it("ne descend jamais sous 0", () => {
    const state: GameState = { ...createInitialState(), bugs: 0.3 };
    const after = tickState(state, TICK_DT, input({ clicksDebug: 5 }));
    expect(after.bugs).toBe(0);
  });
});

describe("Rubber Duck — correction passive, wiring dans le pipeline — §4.11 (Finding B recalibré)", () => {
  it("un seul tick : bugs_après = bugs_avant + génération(loc_brute_tick) - correction(k, dt)", () => {
    const state: GameState = {
      ...createInitialState(),
      // locTotal non nul : hors du cas particulier "premier clic" (§3.6).
      locTotal: new Decimal(1),
      bugs: 10, // état de test contrôlé : reste loin du plancher à 0 (§3.3) sur
      // ce seul tick, pour vérifier l'arithmétique du pipeline plutôt que le clamp.
      generators: { copierColler: 0, stagiaire: 0, rubberDuck: 3 },
    };
    const after = tickState(state, TICK_DT, EMPTY_TICK_INPUT);
    // prod_base_duck/RUBBER_DUCK_FIX_RATE lus via les fonctions de formulas.ts
    // (pas codés en dur) : reste valide après le recalibrage 2026-08-27
    // (acte-1-solo-dev.md — prod_base_duck 5.0 -> 35.0, RUBBER_DUCK_FIX_RATE
    // 0.5 -> 3.5).
    const tauxGenerateursBrute = generatorRate("rubberDuck", 3).toNumber();
    // Débit converti en quantité de CE tick (étape 3, Finding A) avant d'être
    // utilisé pour générer des bugs (étape 5).
    const locBruteTick = tauxGenerateursBrute * TICK_DT;
    // TAUX_BUG recalibré 0.05 -> 0.02 (2026-08-25).
    const expectedGeneration = locBruteTick * TAUX_BUG;
    const expectedCorrection = rubberDuckFixRate(3) * TICK_DT;
    expect(after.bugs).toBeCloseTo(10 + expectedGeneration - expectedCorrection, 10);
  });

  it("cumulée sur 100 ticks (10s), la correction vaut rubberDuckFixRate(k) × 10 malgré l'arrondi par tick", () => {
    // Le pipeline complet ne peut pas être "net décroissant" pour un Rubber Duck
    // seul (il produit aussi des LoC, donc génère des bugs, via prod_base) : ce
    // que §4.11 vérifie précisément est ce TAUX de correction, cumulé tick par
    // tick — d'où l'appel direct à rubberDuckFixRate plutôt qu'à tickState.
    const k = 4;
    let cumulativeCorrection = 0;
    for (let i = 0; i < 100; i++) {
      cumulativeCorrection += rubberDuckFixRate(k) * TICK_DT;
    }
    expect(cumulativeCorrection).toBeCloseTo(rubberDuckFixRate(k) * 10, 10);
  });

  it("critère §4.13 (Finding B, recalibré 2026-08-27) : seuls des Rubber Ducks possédés, bugs_actifs diminue net de k × (RUBBER_DUCK_FIX_RATE − prod_base_duck × taux_bug) bug/s", () => {
    const k = 5;
    const state: GameState = {
      ...createInitialState(),
      // locTotal non nul : hors du cas particulier "premier clic" (§3.6), qui
      // ne se déclencherait de toute façon qu'au tout premier des 100 ticks
      // mais fausserait la mesure de précision (toBeCloseTo à 6 décimales).
      locTotal: new Decimal(1),
      bugs: 1000, // loin du plancher à 0 sur toute la fenêtre de mesure, pour
      // observer le bilan net sans que le clamp ne le masque (§3.3).
      generators: { copierColler: 0, stagiaire: 0, rubberDuck: k },
    };
    const after = runTicks(state, 100); // 100 * TICK_DT = 10s
    // Bilan net : k × (RUBBER_DUCK_FIX_RATE − prod_base_duck × taux_bug)
    // = 5 × (3.5 − 35.0 × 0.02) = 5 × (3.5 − 0.7) = 5 × 2.8 = 14 bug/s, sur 10s
    // = 140 (valait k × 0.4 × 10 = 20 avant le recalibrage 2026-08-27, cf.
    // acte-1-solo-dev.md §3.4).
    const netRatePerSecond =
      rubberDuckFixRate(k) - generatorRate("rubberDuck", k).toNumber() * TAUX_BUG;
    expect(state.bugs - after.bugs).toBeCloseTo(netRatePerSecond * 10, 6);
  });
});

describe("Café — régénération — §4.4", () => {
  it("stock à 0 à t=0, +1 exactement après 30s sans consommation", () => {
    const state = createInitialState();
    expect(state.cafeStock).toBe(0);
    const after = runTicks(state, 300); // 300 * 0.1s = 30s
    expect(after.cafeStock).toBeCloseTo(1, 10);
  });

  it("plafonné à 3, sans dépassement ni perte de fraction au-delà du plafond", () => {
    const state: GameState = { ...createInitialState(), cafeStock: 2.9 };
    const after = runTicks(state, 300);
    expect(after.cafeStock).toBe(CAFE_MAX_STOCK);
  });
});

describe("Café — buff — §4.5", () => {
  it("consommer 1 café multiplie la prod de clic par 3 pendant 20s puis revient à ×1", () => {
    // locTotal non nul en entrée : hors du cas particulier "premier clic"
    // (§3.6) — sinon les deux clics de ce test (tous deux "premiers" sur leurs
    // branches respectives depuis `afterDrink`) seraient exemptés de pénalité.
    const start: GameState = { ...createInitialState(), cafeStock: 1, locTotal: new Decimal(1) };
    const afterDrink = tickState(start, TICK_DT, input({ drinkCoffee: true }));
    expect(afterDrink.cafeBuffRemaining).toBe(20);

    // Pendant le buff (15s plus tard) : un clic rapporte 3 LoC bruts, réduits à
    // 2.9964 par la pénalité que ce même clic génère sur ce même tick (bugs=0
    // avant ce tick, aucun autre clic/générateur n'en a produit entre-temps).
    // TAUX_BUG recalibré 0.05 -> 0.02 (2026-08-25) : 3×(1-0.02×(3×0.02))=2.9964.
    const during = runTicks(afterDrink, 150);
    const duringPlusClick = tickState(during, TICK_DT, input({ clicksEcrireCode: 1 }));
    const gainDuring = duringPlusClick.loc.sub(during.loc).toNumber();
    expect(gainDuring).toBeCloseTo(2.9964, 10);

    // Après expiration (25s après le buff) : un clic ne rapporte plus que
    // 1 LoC brut, réduit à 0.9996 pour la même raison (bugs=0 avant ce tick).
    const after = runTicks(afterDrink, 250);
    expect(after.cafeBuffRemaining).toBe(0);
    const afterPlusClick = tickState(after, TICK_DT, input({ clicksEcrireCode: 1 }));
    const gainAfter = afterPlusClick.loc.sub(after.loc).toNumber();
    expect(gainAfter).toBeCloseTo(0.9996, 10);
  });

  it("reboire pendant un buff actif rafraîchit à 20s sans stacker le multiplicateur", () => {
    const start: GameState = { ...createInitialState(), cafeStock: 3, locTotal: new Decimal(1) };
    const afterFirstDrink = tickState(start, TICK_DT, input({ drinkCoffee: true }));
    const tenSecondsLater = runTicks(afterFirstDrink, 100); // buff restant ~10s
    expect(tenSecondsLater.cafeBuffRemaining).toBeCloseTo(10, 6);

    const afterSecondDrink = tickState(tenSecondsLater, TICK_DT, input({ drinkCoffee: true }));
    expect(afterSecondDrink.cafeBuffRemaining).toBe(20);

    // bugs=0 avant ce tick (aucune production n'a eu lieu depuis le début du
    // test) : gain = 3 × (1 - 0.02 × (3 × 0.02)) = 2.9964, toujours ×3 côté
    // brut (jamais ×9, cf. clickProduction). TAUX_BUG recalibré 0.05 -> 0.02.
    const withClick = tickState(afterSecondDrink, TICK_DT, input({ clicksEcrireCode: 1 }));
    const gain = withClick.loc.sub(afterSecondDrink.loc).toNumber();
    expect(gain).toBeCloseTo(2.9964, 10);
  });
});

describe("Café — n'affecte pas les générateurs — §4.6", () => {
  it("la production des générateurs est identique avec ou sans buff actif", () => {
    const base: GameState = {
      ...createInitialState(),
      generators: { copierColler: 5, stagiaire: 2, rubberDuck: 1 },
    };
    const withBuff: GameState = { ...base, cafeBuffRemaining: 20 };
    const withoutBuff: GameState = { ...base, cafeBuffRemaining: 0 };

    // clicksEcrireCode=0 : seule la composante générateurs contribue au gain de LoC.
    const afterWithBuff = tickState(withBuff, TICK_DT, EMPTY_TICK_INPUT);
    const afterWithoutBuff = tickState(withoutBuff, TICK_DT, EMPTY_TICK_INPUT);

    expect(afterWithBuff.loc.sub(base.loc).toNumber()).toBeCloseTo(
      afterWithoutBuff.loc.sub(base.loc).toNumber(),
      10,
    );
  });
});

describe("Ordre du pipeline — le café n'influence la génération de bugs que via prod_clic_brute — §4.15", () => {
  it("la différence de bugs générés entre buff actif/inactif est exactement due au clic", () => {
    // locTotal non nul en entrée : hors du cas particulier "premier clic"
    // (§3.6) — sinon aucun bug ne serait généré sur ce tick, dans les deux cas.
    const base: GameState = {
      ...createInitialState(),
      locTotal: new Decimal(1),
      generators: { copierColler: 5, stagiaire: 0, rubberDuck: 0 },
    };
    const withBuff: GameState = { ...base, cafeBuffRemaining: 20 };
    const withoutBuff: GameState = { ...base, cafeBuffRemaining: 0 };

    const afterWithBuff = tickState(withBuff, TICK_DT, input({ clicksEcrireCode: 1 }));
    const afterWithoutBuff = tickState(withoutBuff, TICK_DT, input({ clicksEcrireCode: 1 }));

    // Δ prod_clic_brute = 3 - 1 = 2 => Δ bugs générés = 2 × taux_bug (0.02) = 0.04
    // (TAUX_BUG recalibré 0.05 -> 0.02, 2026-08-25).
    expect(afterWithBuff.bugs - afterWithoutBuff.bugs).toBeCloseTo(0.04, 10);
  });
});

// Réf. docs/design/acte-2-open-source.md §1-4 (déclencheur, changement d'état,
// critères d'acceptation), numéros cités dans chaque `it`.
describe("Transition Acte I -> Acte II — acte-2-open-source.md §4", () => {
  /** État de test contrôlé : bugs=1000 sature le plancher de pénalité (§3.3 de
   * acte-1-solo-dev.md, multiplicateur = 0.2 exact) pour rendre loc_nette_tick
   * prévisible sans dépendre de l'arrondi de la génération de bugs sur ce tick. */
  function stateNearThreshold(locTotal: number): GameState {
    return {
      ...createInitialState(),
      locTotal: new Decimal(locTotal),
      bugs: 1000,
    };
  }

  it("critère 1 : sous le seuil (9999.99), aucun tick ne modifie acte ni stars", () => {
    const state = stateNearThreshold(9999.99);
    const after = tickState(state, TICK_DT, EMPTY_TICK_INPUT); // pas de production ce tick
    expect(after.acte).toBe(1);
    expect(after.stars.toNumber()).toBe(0);
  });

  it("critère 2 : le tick qui fait franchir le seuil déclenche acte=2 et stars=+10, sur ce même tick", () => {
    const state = stateNearThreshold(9990);
    // 100 clics "Écrire du code" à multiplicateurBug=0.2 (bugs=1000) : loc_nette_tick
    // = 100 × 1 × 0.2 = 20, locTotal 9990 -> 10010 (franchit 10 000 sur ce tick).
    const after = tickState(state, TICK_DT, input({ clicksEcrireCode: 100 }));
    expect(after.locTotal.toNumber()).toBeCloseTo(10010, 6);
    expect(after.acte).toBe(2);
    expect(after.stars.toNumber()).toBe(10);
  });

  it("critère 3 : dotation unique — les ticks suivants (acte déjà à 2) ne modifient plus stars", () => {
    const crossed = tickState(
      stateNearThreshold(9990),
      TICK_DT,
      input({ clicksEcrireCode: 100 }),
    );
    expect(crossed.acte).toBe(2);
    const later = tickState(crossed, TICK_DT, input({ clicksEcrireCode: 100 }));
    expect(later.acte).toBe(2);
    expect(later.stars.toNumber()).toBe(10);
  });

  it("critère 4 : aucune ressource autre que acte/stars n'est modifiée par la transition elle-même", () => {
    // Deux états identiques sauf sur `acte` (1 vs déjà 2), pour isoler l'effet de
    // la règle de transition du reste du pipeline (qui, lui, doit produire un
    // résultat strictement identique dans les deux cas).
    const crossing = stateNearThreshold(9990);
    const alreadyActe2: GameState = { ...stateNearThreshold(9990), acte: 2 };

    const afterCrossing = tickState(crossing, TICK_DT, input({ clicksEcrireCode: 100 }));
    const afterAlreadyActe2 = tickState(alreadyActe2, TICK_DT, input({ clicksEcrireCode: 100 }));

    // loc/locTotal ne sont PAS comparés ici depuis l'introduction de la Dette
    // Technique (docs/design/dette-technique-grand-rewrite.md §5) : le bloc dette
    // est inséré AVANT le point 9 (donc avant la règle de transition, qui
    // s'applique après le point 9, acte-2-open-source.md §1) et se gate sur
    // `state.acte` tel qu'il est EN ENTRÉE de ce tick. `alreadyActe2` (acte=2 dès
    // l'entrée) accumule donc de la dette sur ce tick même et voit sa production
    // légèrement pénalisée, contrairement à `crossing` (acte=1 à l'entrée, ne
    // devient 2 qu'après le point 9) — divergence légitime, pas une régression :
    // ce n'est pas la RÈGLE DE TRANSITION elle-même qui modifie loc/locTotal ici,
    // c'est le système dette (transverse, gaté sur l'acte pré-transition du tick).
    expect(afterCrossing.bugs).toBeCloseTo(afterAlreadyActe2.bugs, 10);
    expect(afterCrossing.cafeStock).toBeCloseTo(afterAlreadyActe2.cafeStock, 10);
    expect(afterCrossing.generators).toEqual(afterAlreadyActe2.generators);
  });

  it("critère 5 : le tick de transition exécute intégralement le pipeline Acte I (loc/bugs mis à jour normalement)", () => {
    const state = stateNearThreshold(9990);
    const after = tickState(state, TICK_DT, input({ clicksEcrireCode: 100 }));
    // Le pipeline normal (étapes 1-9) tourne malgré la transition : loc et bugs
    // bougent exactement comme sur n'importe quel autre tick.
    expect(after.loc.toNumber()).toBeCloseTo(20, 6);
    expect(after.bugs).toBeGreaterThan(state.bugs);
  });
});
