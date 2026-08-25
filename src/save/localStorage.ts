import { OFFLINE_CAP_SECONDS } from "../engine/constants";
import type { GameState } from "../engine/types";
import { decodeSave, encodeSave, SAVE_KEY } from "./save";

/**
 * Persistance localStorage — thread principal UNIQUEMENT (`localStorage` n'est
 * pas exposé dans un DedicatedWorker, cf. commentaire dans save.ts). Le worker
 * possède l'état canonique et émet des saves encodées via postMessage ; c'est le
 * thread principal qui les écrit ici. Autosave 30s : CLAUDE.md "Sauvegarde".
 */
export function saveToLocalStorage(state: GameState): void {
  localStorage.setItem(SAVE_KEY, encodeSave(state));
}

export function loadFromLocalStorage(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? decodeSave(raw) : null;
}

/**
 * Progression offline — docs/design/progression-offline.md §1.1. Clé distincte
 * de `SAVE_KEY` : ce n'est pas de la donnée `GameState` (le timestamp vit à côté
 * de la save, pas dedans — `SaveDataV1` reste inchangé), juste un horodatage de
 * session, epoch ms stocké en string pour cohérence avec `Date.now()` déjà
 * utilisé partout ailleurs (`lastTickAt`/`lastAutosaveAt`/... dans
 * `src/lib/gameStore.svelte.ts`).
 */
export const OFFLINE_TIMESTAMP_KEY = "devcremental-last-active-at";

/** §1.2 — écrit à `beforeunload` et à chaque autosave réussie. */
export function saveLastActiveAt(): void {
  localStorage.setItem(OFFLINE_TIMESTAMP_KEY, String(Date.now()));
}

/**
 * §1.1 — `null` si la clé est absente ou corrompue (jamais `NaN`/négatif), sans
 * jamais lever : une valeur illisible dégrade vers "pas de delta calculable",
 * exactement comme une save corrompue dégrade vers une erreur gérée plutôt qu'un
 * crash (`decodeSave`).
 */
export function loadLastActiveAt(): number | null {
  const raw = localStorage.getItem(OFFLINE_TIMESTAMP_KEY);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * §2 — delta de temps offline, clampé à `[0, OFFLINE_CAP_SECONDS]`. Extraite en
 * fonction pure exportée (le §5 du document la décrit comme calculée inline dans
 * le constructeur de `GameStore`, ce qui reste vrai : c'est le seul point
 * d'appel) uniquement pour être testable en isolation sans instancier le Worker
 * ni le DOM — évite aussi de dupliquer la formule de clamp entre le code et ses
 * tests (cf. CLAUDE.md "Formules toujours documentées... jamais codées en dur").
 */
export function computeOfflineDeltaSeconds(
  nowMs: number,
  lastActiveMs: number | null,
): number {
  const rawDeltaS = lastActiveMs === null ? 0 : (nowMs - lastActiveMs) / 1000;
  return Math.max(0, Math.min(rawDeltaS, OFFLINE_CAP_SECONDS));
}
