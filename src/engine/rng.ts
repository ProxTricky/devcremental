/**
 * PRNG seedable minimal (mulberry32), requis par
 * docs/design/dette-technique-grand-rewrite.md §4.2/§4.3 pour le tirage
 * `chaos_tick` de l'archétype JavaScript : le moteur ne doit jamais dépendre de
 * `Math.random()` (non reproductible en test, cf. §9 critères 14/15).
 *
 * Exposé comme une fonction pure `(seed) -> (valeur, seed suivant)` plutôt qu'un
 * générateur à état interne mutable, pour rester cohérent avec `tickState`
 * `(state, dt, input) -> state` : le seed courant vit dans `GameState.rngSeed` et
 * est threadé explicitement à travers le pipeline (tick.ts), jamais un singleton
 * global.
 */
export function nextRandom(seed: number): { value: number; nextSeed: number } {
  let a = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, nextSeed: a };
}

/** Tirage uniforme dans [min, max) à partir de `nextRandom`. */
export function nextUniform(
  seed: number,
  min: number,
  max: number,
): { value: number; nextSeed: number } {
  const { value, nextSeed } = nextRandom(seed);
  return { value: min + value * (max - min), nextSeed };
}
