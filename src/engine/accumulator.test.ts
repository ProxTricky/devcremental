import { describe, expect, it } from "vitest";
import { advanceTime } from "./accumulator";
import { TICK_DT } from "./constants";
import { createInitialState } from "./state";
import { EMPTY_TICK_INPUT, type GameState } from "./types";

/**
 * Critère de robustesse de la boucle de jeu (CLAUDE.md "Boucle de jeu") :
 * l'accumulator qui rattrape un gros delta de temps en une fois doit produire
 * un résultat identique à N ticks réguliers appelés un par un. C'est ce qui
 * garantit que revenir sur un onglet resté inactif de longues minutes ne
 * diverge pas d'une simulation tick par tick.
 */

function seedState(): GameState {
  return {
    ...createInitialState(),
    generators: { copierColler: 7, stagiaire: 2, rubberDuck: 1 },
  };
}

describe("advanceTime — équivalence rattrapage vs ticks réguliers", () => {
  it("un gros delta d'un coup == N appels séquentiels de TICK_DT (idle, sans input)", () => {
    const initial = seedState();
    const N = 137; // délai arbitraire, pas un multiple rond de TICK_RATE

    // Rattrapage en un seul appel avec un gros delta réel.
    const bigDelta = N * TICK_DT;
    const { state: catchUpState, accumulator: catchUpAcc } = advanceTime(
      initial,
      bigDelta,
      0,
    );

    // N ticks réguliers, un par un (ex. un setInterval qui tourne pile à TICK_DT).
    let sequentialState = initial;
    let sequentialAcc = 0;
    for (let i = 0; i < N; i++) {
      const result = advanceTime(sequentialState, TICK_DT, sequentialAcc);
      sequentialState = result.state;
      sequentialAcc = result.accumulator;
    }

    expect(catchUpState.loc.eq(sequentialState.loc)).toBe(true);
    expect(catchUpState.locTotal.eq(sequentialState.locTotal)).toBe(true);
    expect(catchUpState.bugs).toBeCloseTo(sequentialState.bugs, 12);
    expect(catchUpState.cafeStock).toBeCloseTo(sequentialState.cafeStock, 12);
    expect(catchUpState.cafeBuffRemaining).toBeCloseTo(
      sequentialState.cafeBuffRemaining,
      12,
    );
    expect(catchUpAcc).toBeCloseTo(sequentialAcc, 12);
  });

  it("un delta non multiple de TICK_DT laisse le reste dans l'accumulator, pas perdu", () => {
    const initial = seedState();
    // 5.37 ticks : doit exécuter 5 ticks logiques et garder 0.37*TICK_DT en réserve.
    const { state: afterFirstCall, accumulator: acc1 } = advanceTime(
      initial,
      5.37 * TICK_DT,
      0,
    );
    // Compléter avec le reste manquant pour former exactement 6 ticks au total.
    const { state: finalState, accumulator: acc2 } = advanceTime(
      afterFirstCall,
      0.63 * TICK_DT,
      acc1,
    );

    // Référence : 6 ticks réguliers d'affilée depuis l'état initial.
    let reference = initial;
    let refAcc = 0;
    for (let i = 0; i < 6; i++) {
      const result = advanceTime(reference, TICK_DT, refAcc);
      reference = result.state;
      refAcc = result.accumulator;
    }

    expect(finalState.loc.eq(reference.loc)).toBe(true);
    expect(acc2).toBeCloseTo(refAcc, 10);
  });

  it("respecte l'ordre des inputs : appelé une fois par tick simulé, pas une fois par appel", () => {
    let clicksLeft = 3;
    const getInput = () => {
      if (clicksLeft > 0) {
        clicksLeft -= 1;
        return { ...EMPTY_TICK_INPUT, clicksEcrireCode: 1 };
      }
      return EMPTY_TICK_INPUT;
    };

    const { state } = advanceTime(createInitialState(), 10 * TICK_DT, 0, getInput);
    // 3 clics consommés sur les 10 ticks rattrapés, depuis un état frais
    // (locTotal=0). Le tout premier clic (tick 1) tombe dans le cas particulier
    // "premier clic" (acte-1-solo-dev.md §3.6) : gain net = 1 pile, sans
    // pénalité de bugs. Les deux clics suivants (locTotal déjà > 0) suivent le
    // pipeline standard, avec TAUX_BUG=0.02 (recalibrage 2026-08-25) : tick 2
    // (bugs 0->0.02) donne 1 × (1 - 0.02×0.02) = 0.9996 ; tick 3 (bugs
    // 0.02->0.04) donne 1 × (1 - 0.02×0.04) = 0.9992. Total = 1 + 0.9996 +
    // 0.9992 = 2.9988, figé ensuite (pas de nouvelle génération sur les 7
    // ticks idle restants).
    expect(state.loc.toNumber()).toBeCloseTo(2.9988, 10);
    expect(clicksLeft).toBe(0);
  });
});
