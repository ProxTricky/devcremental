import type { LangueId } from "../engine/constants";

/**
 * Libellés fonctionnels neutres des archétypes de langage (Grand Rewrite) et de
 * l'action de refactoring. PAS du flavor text : `flavorText.ts` ne contient
 * encore aucune entrée pour ces éléments (vérifié 2026-08-04) — c'est une tâche
 * en attente pour content-writer, cf. dette-technique-grand-rewrite.md §8. En
 * attendant, uniquement des noms tels quels et des effets mécaniques chiffrés
 * repris exactement de la spec §4.2 (même convention que `GENERATOR_EFFECT`
 * dans generatorLabels.ts).
 */
export const LANGUE_LABELS: Record<Exclude<LangueId, "none">, string> = {
  rust: "Rust",
  python: "Python",
  javascript: "JavaScript",
};

export const LANGUE_EFFECT: Record<Exclude<LangueId, "none">, string> = {
  rust: "Production ×0.80, bugs ×0.10, dette ×0.50 — plus lent, mais quasi zéro bug.",
  python: "Production ×1.15, bugs ×1.30 — plus rapide, plus de bugs runtime.",
  javascript:
    "Production aléatoire ×0.70 à ×1.90 par tick (espérance ×1.30) — pas d'effet sur bugs/dette.",
};

/** Libellé neutre de l'action de refactoring (§2.1) — même remarque que ci-dessus. */
export const REFACTOR_LABEL = "Refactorer";

/**
 * Nom de fichier du buffer selon l'archétype actif — signature de l'onglet
 * (visual-identity.md §4.2) : "le changement de langage est visible avant même
 * de regarder les chiffres." Mapping normatif exact de la doc, partagé entre
 * TabBar.svelte et ExplorerPanel.svelte (même arbre de fichiers).
 */
export const LANGUE_FILE_NAME: Record<LangueId, string> = {
  none: "main.js",
  rust: "main.rs",
  python: "main.py",
  javascript: "index.js",
};
