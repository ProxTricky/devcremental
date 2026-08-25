import type { NumberNotation } from "./format";

/**
 * Préférences d'affichage (thread principal uniquement, jamais dans la save de
 * partie ni dans le Worker — ce n'est pas un état de jeu, cf. CLAUDE.md
 * accessibilité "option réduire les animations — non négociable").
 */
const REDUCE_MOTION_KEY = "devcremental-reduce-motion";

/** docs/design/notation-nombres.md §5.1 : préférence d'affichage pure, hors save. */
const NUMBER_NOTATION_KEY = "devcremental-number-notation";
const VALID_NOTATIONS: readonly NumberNotation[] = [
  "integer",
  "compact",
  "scientific",
  "hex",
];

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function loadReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(REDUCE_MOTION_KEY);
  // Respecte prefers-reduced-motion par défaut tant que le joueur n'a rien choisi
  // explicitement (CLAUDE.md) ; son choix explicite prime ensuite dessus.
  return stored === null ? prefersReducedMotion() : stored === "1";
}

function loadNumberNotation(): NumberNotation {
  if (typeof window === "undefined") return "integer";
  const stored = window.localStorage.getItem(NUMBER_NOTATION_KEY);
  // Valeur absente ou corrompue (édition manuelle, ancienne version) → repli
  // silencieux sur "integer", jamais d'exception (docs/design/notation-nombres.md §5.1).
  return VALID_NOTATIONS.includes(stored as NumberNotation)
    ? (stored as NumberNotation)
    : "integer";
}

class Settings {
  reduceMotion = $state(loadReduceMotion());
  numberNotation: NumberNotation = $state(loadNumberNotation());

  toggleReduceMotion(): void {
    this.reduceMotion = !this.reduceMotion;
    window.localStorage.setItem(REDUCE_MOTION_KEY, this.reduceMotion ? "1" : "0");
  }

  setNumberNotation(next: NumberNotation): void {
    this.numberNotation = next;
    window.localStorage.setItem(NUMBER_NOTATION_KEY, next);
  }
}

export const settings = new Settings();
