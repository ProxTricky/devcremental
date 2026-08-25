import { TICK_DT } from "./constants";
import { tickState } from "./tick";
import { EMPTY_TICK_INPUT, type GameState, type TickInput } from "./types";

/**
 * Boucle à pas fixe avec rattrapage ("accumulator" / fixed-timestep), cf.
 * CLAUDE.md "Boucle de jeu" : jamais un calcul lié au FPS ou au delta réel brut,
 * toujours une somme entière de ticks de durée TICK_DT.
 *
 * `getInputForTick` est appelé une fois par tick simulé (pas une fois par appel
 * de `advanceTime`) : c'est ce qui permet à un gros delta de temps (ex. retour
 * d'onglet inactif) de rattraper plusieurs ticks d'un coup tout en consommant les
 * entrées joueur au bon "instant logique" plutôt que de les perdre ou de les
 * ré-appliquer à chaque tick de rattrapage.
 */
export function advanceTime(
  state: GameState,
  realDtSeconds: number,
  accumulator: number,
  getInputForTick: () => TickInput = () => EMPTY_TICK_INPUT,
): { state: GameState; accumulator: number } {
  let acc = accumulator + realDtSeconds;
  let current = state;

  while (acc >= TICK_DT) {
    current = tickState(current, TICK_DT, getInputForTick());
    acc -= TICK_DT;
  }

  return { state: current, accumulator: acc };
}
