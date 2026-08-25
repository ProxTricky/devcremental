import type { GeneratorId } from "../engine/constants";
import type { Locale } from "./i18n";

/**
 * Noms et effet secondaire des générateurs — repris tels quels de
 * docs/design/acte-1-solo-dev.md §0/§1.3 (spec normative de game-designer),
 * pas du flavor text inventé ici. Partagé entre GeneratorCard.svelte et
 * App.svelte (prochain déblocage) pour ne pas dupliquer la table.
 *
 * Locale-aware depuis la demande user du 2026-08-25 (i18n fr/en) : `fr` est
 * copié tel quel du contenu d'origine. `en` relu par content-writer le
 * 2026-08-25 : ces noms ne sont pas neutres (« Copier-coller Stack Overflow »,
 * « Stagiaire » sont déjà la blague), la version anglaise vise donc la même
 * saveur et pas la traduction technique la plus littérale.
 */
export const GENERATOR_LABELS: Record<Locale, Record<GeneratorId, string>> = {
  fr: {
    copierColler: "Copier-coller Stack Overflow",
    stagiaire: "Stagiaire",
    rubberDuck: "Rubber Duck",
  },
  en: {
    copierColler: "Stack Overflow Copy-Paste",
    stagiaire: "Intern",
    rubberDuck: "Rubber Duck",
  },
};

export const GENERATOR_EFFECT: Record<Locale, Partial<Record<GeneratorId, string>>> = {
  fr: {
    rubberDuck: "Corrige aussi des bugs passivement.",
  },
  en: {
    rubberDuck: "Also fixes bugs passively.",
  },
};
