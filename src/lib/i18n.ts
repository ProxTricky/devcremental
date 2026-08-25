/**
 * Langue de l'interface — PAS `LangueId` (src/engine/constants.ts), qui est
 * l'archétype de langage du Grand Rewrite (Rust/Python/JavaScript). Deux
 * concepts homonymes en français ("langue"/"langage") : `Locale` ici pour
 * l'i18n, `LangueId` côté moteur pour le prestige. Jamais mélangés.
 *
 * Demande user du 2026-08-25 : le jeu n'était qu'en français en dur, aucune
 * détection ni traduction. Portée tranchée : 2 langues (fr/en), pas un
 * framework d'i18n (svelte-i18n, i18next...) — un jeu solo à 2 langues n'a
 * besoin ni de pluralisation ICU, ni de chargement paresseux de bundles,
 * juste de dictionnaires `Record<Locale, T>` à côté de chaque contenu
 * existant (même patron que `NumberNotation`/`LangueId` déjà dans le
 * projet). Voir `settings.svelte.ts` pour le réglage joueur (détection +
 * override persisté), `uiStrings.ts` pour les libellés d'interface, et
 * chaque fichier de contenu (`flavorText.ts`, `terminalLines.ts`,
 * `generatorLabels.ts`, `langueLabels.ts`, `upgradeLabels.ts`) pour le texte
 * traduit.
 */
export type Locale = "fr" | "en";

const SUPPORTED_LOCALES: readonly Locale[] = ["fr", "en"];

export function isLocale(value: string | null): value is Locale {
  return value !== null && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Détection au tout premier lancement, avant tout choix explicite du joueur
 * (cf. `settings.svelte.ts`) : français si le navigateur annonce une langue
 * commençant par "fr" (fr, fr-FR, fr-CA...), anglais sinon — repli par
 * défaut, le jeu n'a pas de 3ᵉ traduction vers laquelle replier.
 */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.toLowerCase() ?? "";
  return lang.startsWith("fr") ? "fr" : "en";
}
