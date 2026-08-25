import Decimal from "break_eternity.js";

/**
 * Notations d'affichage des nombres (PLAN.md §6) : entiers propres en MVP Acte I,
 * puis K/M/B ("compact"), puis notation scientifique, puis notation hexa en
 * déblocage cosmétique. Le type existe déjà avec ses 4 valeurs pour fixer le
 * contrat dès maintenant — un seul endroit à étendre plus tard, jamais un
 * formatage ad hoc dans un composant.
 */
export type NumberNotation = "integer" | "compact" | "scientific" | "hex";

/** docs/design/notation-nombres.md §2.2 : table de suffixes, bornes en puissances de 1000. */
const COMPACT_SUFFIXES: Array<{ tier: number; suffix: string }> = [
  { tier: 3, suffix: "k" },
  { tier: 6, suffix: "M" },
  { tier: 9, suffix: "B" },
  { tier: 12, suffix: "T" },
];

/** docs/design/notation-nombres.md §2.4 / §4.2 : au-delà, relais total vers `scientific`. */
const COMPACT_SCIENTIFIC_THRESHOLD = new Decimal(1e15);

/** docs/design/notation-nombres.md §3.2 */
const SCIENTIFIC_DECIMAL_PLACES = 2;

function formatCompact(rounded: Decimal): string {
  if (rounded.lt(1000)) {
    return rounded.toFixed(0);
  }
  if (rounded.gte(COMPACT_SCIENTIFIC_THRESHOLD)) {
    return formatScientific(rounded);
  }

  // docs/design/notation-nombres.md §2.3 : palier + arrondi + cascade. Conversion
  // Decimal → number une seule fois (sûre : rounded < 1e15), puis arithmétique en
  // number natif pour éviter l'imprécision de la division Decimal par 10^tier.
  const n = rounded.toNumber();
  const e = Math.floor(Math.log10(n));
  let tier = Math.min(Math.max(Math.floor(e / 3) * 3, 3), 12);
  let mant1 = Number((n / 10 ** tier).toFixed(1));

  if (mant1 >= 1000 && tier < 12) {
    tier += 3;
    mant1 = Number((n / 10 ** tier).toFixed(1));
  }

  if (mant1 >= 1000 && tier === 12) {
    // Aucun palier au-delà de T défini par ce document → relais scientifique.
    return formatScientific(rounded);
  }

  const suffix = COMPACT_SUFFIXES.find((s) => s.tier === tier)!.suffix;
  return mant1.toFixed(1) + suffix;
}

function formatScientific(rounded: Decimal): string {
  // docs/design/notation-nombres.md §3.1 : réutilise l'API native de
  // break_eternity.js, aucune extraction manuelle de mantisse/exposant.
  return rounded.toExponential(SCIENTIFIC_DECIMAL_PLACES);
}

function formatHex(rounded: Decimal): string {
  if (rounded.gte(COMPACT_SCIENTIFIC_THRESHOLD)) {
    return formatScientific(rounded);
  }
  // Sûr : rounded < 1e15 < Number.MAX_SAFE_INTEGER (docs/design/notation-nombres.md §4.3).
  return "0x" + rounded.toNumber().toString(16).toUpperCase();
}

/**
 * Formate un Decimal (break_eternity.js, valeurs du moteur) pour l'affichage.
 * N'altère jamais l'état réel du jeu : l'arrondi ici est strictement un problème
 * d'affichage, jamais appliqué à `state.loc`/`state.locTotal` eux-mêmes.
 *
 * Règle 0 (docs/design/notation-nombres.md §1) : les 4 notations opèrent
 * uniquement sur `value.round()`, jamais sur `value` brut — ça garantit qu'aucune
 * notation n'affiche jamais de résidu fractionnaire sub-unitaire (ex. le premier
 * clic "Écrire du code" à 0.999 LoC net s'affiche "1" dans toutes les notations).
 */
export function formatNumber(
  value: Decimal,
  notation: NumberNotation = "integer",
): string {
  const rounded = value.round();
  switch (notation) {
    case "integer":
      return rounded.toFixed(0);
    case "compact":
      return formatCompact(rounded);
    case "scientific":
      return formatScientific(rounded);
    case "hex":
      return formatHex(rounded);
  }
}
