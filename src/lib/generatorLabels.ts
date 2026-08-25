import type { GeneratorId } from "../engine/constants";

/**
 * Noms et effet secondaire des générateurs — repris tels quels de
 * docs/design/acte-1-solo-dev.md §0/§1.3 (spec normative de game-designer),
 * pas du flavor text inventé ici. Partagé entre GeneratorCard.svelte et
 * App.svelte (prochain déblocage) pour ne pas dupliquer la table.
 */
export const GENERATOR_LABELS: Record<GeneratorId, string> = {
  copierColler: "Copier-coller Stack Overflow",
  stagiaire: "Stagiaire",
  rubberDuck: "Rubber Duck",
};

export const GENERATOR_EFFECT: Partial<Record<GeneratorId, string>> = {
  rubberDuck: "Corrige aussi des bugs passivement.",
};
