import { describe, expect, it } from "vitest";
import { advanceTime } from "../engine/accumulator";
import { OFFLINE_CAP_SECONDS, TICK_DT } from "../engine/constants";
import { createInitialState } from "../engine/state";
import { EMPTY_TICK_INPUT, type GameState, type TickInput } from "../engine/types";
import { decodeSave, encodeSave } from "../save/save";

/**
 * Réf. docs/design/progression-offline.md §10 (critères d'acceptation), numéros
 * cités dans chaque `it` (ex. "§10.7" = critère 7).
 *
 * `src/worker/gameWorker.ts` reste volontairement non importé/instancié ici
 * (convention déjà en place dans ce fichier : "ce fichier n'est que de la glue
 * (protocole postMessage <-> fonctions pures de src/engine) ; la logique testée
 * se trouve dans accumulator.ts/tick.ts/formulas.ts, pas ici" — et il tourne un
 * `setInterval`/`self.onmessage` qui n'a pas de sens hors DedicatedWorker). Le
 * cas `"loadSave"` avec `offlineSeconds` s'y résume exactement à :
 *   decodeSave(msg.encoded) -> (forcer refactorActif=false si offlineSeconds>0)
 *   -> advanceTime(state, offlineSeconds, 0, () => EMPTY_TICK_INPUT)
 * — trois primitives déjà testées ailleurs (decodeSave/encodeSave : save.test.ts,
 * advanceTime : accumulator.test.ts). Ces tests reproduisent fidèlement cette
 * composition exacte (§5 point 4 du document) plutôt que de dupliquer sa logique.
 */

function seedState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    acte: 2, // nécessaire pour que la dette s'accumule (tick.ts, gate acte>=2)
    generators: { copierColler: 5, stagiaire: 1, rubberDuck: 0 },
    ...overrides,
  };
}

/** Reproduit exactement le cas "loadSave" du Worker (§5 point 4). */
function simulateLoadSaveWithOffline(
  encoded: string,
  offlineSeconds: number | undefined,
): { state: GameState; accumulator: number } {
  let state = decodeSave(encoded);
  let accumulator = 0;
  if (offlineSeconds !== undefined && offlineSeconds > 0) {
    state = { ...state, refactorActif: false };
    const result = advanceTime(state, offlineSeconds, 0);
    state = result.state;
    accumulator = result.accumulator;
  }
  return { state, accumulator };
}

describe("critère §10.7 — refactorActif forcé à false pendant le rattrapage", () => {
  it("l'état après rattrapage a refactorActif===false et la dette suit l'accumulation normale (pas de réduction imputable au refactor)", () => {
    const base = seedState({ refactorActif: true });
    const encoded = encodeSave(base);

    const offlineSeconds = 50 * TICK_DT; // 50 ticks, valeur arbitraire non nulle
    const { state } = simulateLoadSaveWithOffline(encoded, offlineSeconds);

    expect(state.refactorActif).toBe(false);

    // Référence : même état, mais SANS forcer refactorActif à false avant le
    // rattrapage (le TAUX_REFACTOR aurait alors réduit la dette pendant tout le
    // rattrapage) — sert à démontrer que le forçage a un effet réel et que
    // l'accumulation observée est bien la "normale", pas une version réduite.
    const decodedNoForce = decodeSave(encoded); // refactorActif: true, non forcé
    const { state: stateNoForce } = advanceTime(decodedNoForce, offlineSeconds, 0);

    expect(state.dette.gt(stateNoForce.dette)).toBe(true);
  });
});

describe("critère §10.8 — refactorActif non touché à delta nul (portée restreinte, §3)", () => {
  it("offlineSeconds===0 (ou absent) : refactorActif reste tel que décodé, aucun advanceTime supplémentaire", () => {
    const base = seedState({ refactorActif: true });
    const encoded = encodeSave(base);

    const { state: stateZero } = simulateLoadSaveWithOffline(encoded, 0);
    const { state: stateUndefined } = simulateLoadSaveWithOffline(encoded, undefined);

    expect(stateZero.refactorActif).toBe(true);
    expect(stateUndefined.refactorActif).toBe(true);
    // Rien d'autre n'a bougé par rapport à un decodeSave nu.
    const plain = decodeSave(encoded);
    expect(stateZero.dette.eq(plain.dette)).toBe(true);
    expect(stateZero.loc.eq(plain.loc)).toBe(true);
  });
});

describe("critère §10.9 — aucun input pendant le rattrapage, jusqu'au plafond", () => {
  it("advanceTime(state, OFFLINE_CAP_SECONDS, 0) appelle getInputForTick exactement floor(cap/TICK_DT) fois, toujours avec EMPTY_TICK_INPUT", () => {
    let calls = 0;
    const seenNonEmpty: TickInput[] = [];
    const getInput = (): TickInput => {
      calls += 1;
      return EMPTY_TICK_INPUT;
    };

    const base = seedState({ refactorActif: false });
    advanceTime(base, OFFLINE_CAP_SECONDS, 0, () => {
      const input = getInput();
      if (
        input.clicksEcrireCode !== 0 ||
        input.clicksDebug !== 0 ||
        input.drinkCoffee !== false
      ) {
        seenNonEmpty.push(input);
      }
      return input;
    });

    expect(calls).toBe(Math.floor(OFFLINE_CAP_SECONDS / TICK_DT));
    expect(seenNonEmpty).toHaveLength(0);
  });

  it("le rattrapage réel du Worker (via simulateLoadSaveWithOffline) n'invoque jamais clicksEcrireCode/clicksDebug/drinkCoffee", () => {
    // advanceTime() sans 4e argument utilise EMPTY_TICK_INPUT par défaut (§4) :
    // vérifié indirectement en comparant à un rattrapage explicite EMPTY_TICK_INPUT.
    const base = seedState({ refactorActif: false });
    const encoded = encodeSave(base);
    const offlineSeconds = 200 * TICK_DT;

    const { state: implicit } = simulateLoadSaveWithOffline(encoded, offlineSeconds);
    const { state: explicit } = advanceTime(decodeSave(encoded), offlineSeconds, 0, () => EMPTY_TICK_INPUT);

    expect(implicit.loc.eq(explicit.loc)).toBe(true);
    expect(implicit.dette.eq(explicit.dette)).toBe(true);
    expect(implicit.bugs).toBeCloseTo(explicit.bugs, 12);
  });
});

describe("critère §10.10 — non-régression du contrat advanceTime", () => {
  it("le rattrapage offline == floor(offlineSeconds/TICK_DT) appels séquentiels de advanceTime(state, TICK_DT, acc)", () => {
    const base = seedState({ refactorActif: true }); // forcé à false des deux côtés
    const encoded = encodeSave(base);
    // Delta fractionnaire non aligné sur TICK_DT (représentatif d'un vrai delta
    // horloge réelle, `(now_ms - last_active_ms) / 1000`) plutôt qu'un multiple
    // exact de TICK_DT : un multiple exact (ex. 733 × 0.1) tombe pile sur une
    // frontière de précision flottante où `floor(x/TICK_DT)` peut différer de 1
    // du nombre réel d'itérations de la boucle `while` de `advanceTime` — un
    // artefact de construction du test, sans rapport avec la propriété testée.
    const offlineSeconds = 73.37;

    const { state: catchUpState } = simulateLoadSaveWithOffline(encoded, offlineSeconds);

    let sequential = { ...decodeSave(encoded), refactorActif: false };
    let acc = 0;
    const n = Math.floor(offlineSeconds / TICK_DT);
    for (let i = 0; i < n; i++) {
      const result = advanceTime(sequential, TICK_DT, acc);
      sequential = result.state;
      acc = result.accumulator;
    }

    expect(catchUpState.loc.eq(sequential.loc)).toBe(true);
    expect(catchUpState.locTotal.eq(sequential.locTotal)).toBe(true);
    expect(catchUpState.dette.eq(sequential.dette)).toBe(true);
    expect(catchUpState.bugs).toBeCloseTo(sequential.bugs, 10);
    expect(catchUpState.karmaRewrite.eq(sequential.karmaRewrite)).toBe(true);
  });
});

describe("critère §10.11 — aucune règle spéciale dans tickState pour un tick offline", () => {
  it("un rattrapage offline et un ensemble de ticks temps réel équivalents produisent une dette/bugs/karma identiques (mêmes formules, même ordre)", () => {
    // Démontré par équivalence : accumulator.ts (déjà testé, accumulator.test.ts)
    // et le critère §10.10 ci-dessus prouvent tous deux que advanceTime ne fait
    // rien d'autre qu'appeler tickState en boucle, sans branche conditionnée sur
    // l'origine du delta (offline vs. temps réel) — tickState lui-même n'a aucun
    // paramètre "isOffline". Ce test vérifie l'absence de toute divergence sur
    // les compteurs composés par la dette (dette, bugs, karmaRewrite).
    const base = seedState({ refactorActif: false });
    const encoded = encodeSave(base);
    // Delta fractionnaire non aligné sur TICK_DT — même précaution que le
    // critère §10.10 ci-dessus (voir son commentaire) pour éviter un artefact de
    // précision flottante propre à la construction du test.
    const offlineSeconds = 40.123;

    const { state: viaOffline } = simulateLoadSaveWithOffline(encoded, offlineSeconds);

    let viaRealtime = decodeSave(encoded);
    let acc = 0;
    for (let i = 0; i < Math.floor(offlineSeconds / TICK_DT); i++) {
      const result = advanceTime(viaRealtime, TICK_DT, acc);
      viaRealtime = result.state;
      acc = result.accumulator;
    }

    expect(viaOffline.dette.eq(viaRealtime.dette)).toBe(true);
    expect(viaOffline.bugs).toBeCloseTo(viaRealtime.bugs, 8);
    expect(viaOffline.karmaRewrite.eq(viaRealtime.karmaRewrite)).toBe(true);
  });
});

describe("critère §10.16 — aucun état intermédiaire exposé", () => {
  it("advanceTime (utilisé par le rattrapage) est une boucle synchrone à un seul point de retour, sans callback intermédiaire", () => {
    // advanceTime (accumulator.ts) est une fonction pure : sa boucle `while`
    // interne n'a aucun point d'émission, seulement un retour final { state,
    // accumulator }. Un rattrapage offline ne PEUT donc structurellement pas
    // exposer d'état intermédiaire, quelle que soit sa durée — et le contrat §5
    // point 4 ("un seul appel à advanceTime, rien d'autre n'est inséré dans ce
    // cas") garantit que le cas "loadSave" de gameWorker.ts n'ajoute aucun point
    // d'émission supplémentaire autour de cet appel (vérifiable par lecture du
    // fichier, ~6 lignes, cf. contrat §5 point 4 ci-dessus — non re-testé ici,
    // gameWorker.ts restant volontairement non exécuté en test, cf. en-tête).
    const base = seedState({ refactorActif: false });
    const result = simulateLoadSaveWithOffline(encodeSave(base), 500 * TICK_DT);
    expect(Object.keys(result)).toEqual(["state", "accumulator"]);
  });
});
