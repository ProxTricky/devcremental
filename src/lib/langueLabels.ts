import type { LangueId } from "../engine/constants";
import type { Locale } from "./i18n";

/**
 * Libellés fonctionnels neutres des archétypes de langage (Grand Rewrite) et de
 * l'action de refactoring. PAS du flavor text : `flavorText.ts` ne contient
 * encore aucune entrée pour ces éléments (vérifié 2026-08-04) — c'est une tâche
 * en attente pour content-writer, cf. dette-technique-grand-rewrite.md §8. En
 * attendant, uniquement des noms tels quels et des effets mécaniques chiffrés
 * repris exactement de la spec §4.2 (même convention que `GENERATOR_EFFECT`
 * dans generatorLabels.ts).
 *
 * Locale-aware depuis la demande user du 2026-08-25 (i18n fr/en), sauf
 * `LANGUE_LABELS` (noms propres Rust/Python/JavaScript, identiques dans les
 * deux langues) et `LANGUE_FILE_NAME` (noms de fichiers, artefacts de code
 * jamais traduits).
 */
export const LANGUE_LABELS: Record<Exclude<LangueId, "none">, string> = {
  rust: "Rust",
  python: "Python",
  javascript: "JavaScript",
};

export const LANGUE_EFFECT: Record<Locale, Record<Exclude<LangueId, "none">, string>> = {
  fr: {
    rust: "Production ×0.80, bugs ×0.10, dette ×0.50 — plus lent, mais quasi zéro bug.",
    python: "Production ×1.15, bugs ×1.30 — plus rapide, plus de bugs runtime.",
    javascript:
      "Production aléatoire ×0.70 à ×1.90 par tick (espérance ×1.30) — pas d'effet sur bugs/dette.",
  },
  en: {
    rust: "Production ×0.80, bugs ×0.10, debt ×0.50 — slower, but nearly zero bugs.",
    python: "Production ×1.15, bugs ×1.30 — faster, more runtime bugs.",
    javascript:
      "Random production ×0.70 to ×1.90 per tick (expected value ×1.30) — no effect on bugs/debt.",
  },
};

/** Libellé neutre de l'action de refactoring (§2.1) — même remarque que ci-dessus. */
export const REFACTOR_LABEL: Record<Locale, string> = {
  fr: "Refactorer",
  en: "Refactor",
};

/**
 * Nom de fichier du buffer selon l'archétype actif — signature de l'onglet
 * (visual-identity.md §4.2) : "le changement de langage est visible avant même
 * de regarder les chiffres." Mapping normatif exact de la doc, partagé entre
 * TabBar.svelte et ExplorerPanel.svelte (même arbre de fichiers). Ne change
 * jamais avec la langue de l'interface (artefact de code, pas du texte parlé).
 */
export const LANGUE_FILE_NAME: Record<LangueId, string> = {
  none: "main.js",
  rust: "main.rs",
  python: "main.py",
  javascript: "index.js",
};
