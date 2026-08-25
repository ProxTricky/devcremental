/// <reference lib="webworker" />
import { advanceTime } from "../engine/accumulator";
import {
  buyGenerator,
  buyUpgrade,
  claimNpmInstall,
  grandRewrite,
  setRefactorActif,
} from "../engine/actions";
import { TICK_DT } from "../engine/constants";
import { createInitialState } from "../engine/state";
import { EMPTY_TICK_INPUT, type GameState, type TickInput } from "../engine/types";
import { decodeSave, encodeSave } from "../save/save";
import type { InboundMessage, OutboundMessage } from "./protocol";

/**
 * Le Worker possède l'état canonique du jeu (CLAUDE.md "Boucle de jeu") : aucune
 * logique de jeu ne doit vivre dans le thread principal. Ce fichier n'est que de
 * la glue (protocole postMessage <-> fonctions pures de src/engine) ; la logique
 * testée se trouve dans accumulator.ts/tick.ts/formulas.ts, pas ici.
 */

// `postMessage` de `DedicatedWorkerGlobalScope` n'est pas typé sur son argument :
// ce wrapper est le seul point d'émission, il garantit que tout message sortant
// respecte `OutboundMessage`.
function post(msg: OutboundMessage): void {
  postMessage(msg);
}

let state: GameState = createInitialState();
let accumulator = 0;
let lastTime = performance.now();
let pending: TickInput = { ...EMPTY_TICK_INPUT };

function takePendingInput(): TickInput {
  const input = pending;
  pending = { ...EMPTY_TICK_INPUT };
  return input;
}

function loop(): void {
  const now = performance.now();
  const realDt = (now - lastTime) / 1000;
  lastTime = now;

  const result = advanceTime(state, realDt, accumulator, takePendingInput);
  state = result.state;
  accumulator = result.accumulator;

  post({ type: "state", save: encodeSave(state) });
}

setInterval(loop, TICK_DT * 1000);

self.onmessage = (event: MessageEvent<InboundMessage>) => {
  const msg = event.data;
  switch (msg.type) {
    case "clickCode":
      pending.clicksEcrireCode += 1;
      break;
    case "clickDebug":
      pending.clicksDebug += 1;
      break;
    case "drinkCoffee":
      pending.drinkCoffee = true;
      break;
    case "buyGenerator":
      state = buyGenerator(state, msg.id);
      break;
    case "refactorStart":
      state = setRefactorActif(state, true);
      break;
    case "refactorStop":
      state = setRefactorActif(state, false);
      break;
    case "grandRewrite":
      state = grandRewrite(state, msg.langue);
      break;
    case "buyUpgrade":
      state = buyUpgrade(state, msg.id);
      break;
    case "claimNpmInstall":
      state = claimNpmInstall(state);
      break;
    case "loadSave":
      try {
        state = decodeSave(msg.encoded);
        accumulator = 0;
        // Progression-offline.md §3/§5 point 4 : rattrapage du delta offline
        // clampé, en un seul appel à advanceTime avec EMPTY_TICK_INPUT (§4).
        // refactorActif est forcé à false avant le rattrapage — un hold ne peut
        // pas avoir été "maintenu" pendant une absence (§3) — uniquement quand
        // un rattrapage non-nul est effectivement appliqué.
        if (msg.offlineSeconds !== undefined && msg.offlineSeconds > 0) {
          state = { ...state, refactorActif: false };
          const result = advanceTime(state, msg.offlineSeconds, 0);
          state = result.state;
          accumulator = result.accumulator;
        }
      } catch (err) {
        post({ type: "loadError", message: err instanceof Error ? err.message : String(err) });
      }
      break;
    case "requestSave":
      post({ type: "saveData", encoded: encodeSave(state) });
      break;
  }
};
