import type { LangueId } from "../engine/constants";
import { CODE_SAMPLES } from "./codeSamples";
import type { Locale } from "./i18n";

/**
 * Lignes de code défilant dans le faux terminal à chaque clic "Écrire du code"
 * (voir Terminal.svelte). Contenu de jeu DÉFINITIF — écrit par content-writer
 * (2026-08-04), remplace le pool placeholder neutre de la première passe.
 *
 * Ton : Acte I "Solo Dev" (docs/design/acte-1-solo-dev.md §0) et PLAN.md §6 —
 * chaque ligne doit être du code plausible ET une blague de dev : bug classique,
 * TODO qui ne sera jamais fait, nom de variable qui trahit la fatigue ou le
 * syndrome de l'imposteur, commentaire de capitulation. Aucune ligne neutre.
 *
 * Règles pour toute ligne ajoutée plus tard :
 * - reste crédible visuellement dans un terminal (indentation, syntaxe),
 * - reste intemporelle (pas de framework/débat qui sera mort dans un an),
 * - reste Acte I : dev seul, Stack Overflow, café, canard. Le VC, le left-pad et
 *   la supply chain appartiennent aux actes suivants.
 *
 * Depuis la demande user du 2026-08-25 : mélangé à `codeSamples.ts`, du vrai
 * code extrait de dépôts publics emblématiques (un par archétype de langage),
 * pour que le buffer ressemble à un vrai projet plutôt qu'à une suite de
 * blagues seules — sans perdre l'humour, qui reste le différenciateur (PLAN.md
 * §6).
 *
 * Rythme revu le même jour (2ᵉ décision user) : un ratio probabiliste ligne à
 * ligne ne donnait jamais l'impression d'écrire quelque chose de cohérent.
 * Remplacé par `nextTerminalLine`, une machine à 2 états tenue par
 * Terminal.svelte (le seul appelant) : on révèle une fonction complète de
 * `codeSamples.ts` ligne par ligne au fil des clics (une fonction de N lignes
 * = N clics), puis, une fois la fonction terminée, EXACTEMENT une blague de
 * `CODE_LINES` s'insère avant de tirer une nouvelle fonction au hasard.
 * Le tout premier clic d'une run tombe dans ce 2ᵉ cas (curseur initial vide) —
 * assumé, une blague en ouverture n'est jamais un mauvais choix ici.
 *
 * Locale-aware depuis la demande user du 2026-08-25 (i18n fr/en) : `fr` est
 * copié tel quel du pool d'origine (déjà validé, jamais retouché). `en` est
 * passé par content-writer le 2026-08-25 : appariement blague pour blague, pas
 * mot pour mot — quand une punchline française ne survit pas à la traduction,
 * la ligne anglaise raconte le même aveu (même type de bug, même fatigue) avec
 * une formule qui existe vraiment en anglais. Les deux pools gardent le même
 * nombre d'entrées et le même ordre, pour rester diffables.
 * `CODE_SAMPLES` (vrai code des dépôts publics) ne change jamais avec la
 * langue de l'interface.
 */
const CODE_LINES: Record<Locale, readonly string[]> = {
  fr: [
    "// TODO: refactorer ça proprement (2019)",
    "// je ne sais pas pourquoi ça marche, ne pas toucher",
    "const finalFinal_v2_OK = compute(input);",
    "let temp = temp2; // je renommerai demain",
    "function doStuff(data, data2, dataFinal) {",
    "  // @ts-ignore  je sais ce que je fais",
    "  return true; // isValid() : version optimiste",
    "} catch (e) {} // ça n'arrivera jamais",
    "console.log('ici');",
    "console.log('ICI 2');",
    "console.log('POURQUOI');",
    "for (let i = 0; i <= items.length; i++) {",
    "  if ((user = null)) return; // ??",
    "const DELAI_MAGIQUE_NE_PAS_BAISSER = 100;",
    "  setTimeout(render, DELAI_MAGIQUE_NE_PAS_BAISSER);",
    "const password = 'hunter2'; // TODO: variable d'env",
    "const cache = {}; // invalidation: problème de demain",
    "  await coffee(); // dépendance critique",
    "// copié de Stack Overflow, réponse à une autre question",
    "// (l'auteur a supprimé son compte, paix à son âme)",
    "const jeSaisPasCeQueJeFais = true;",
    "throw new Error('impossible'); // arrive 3x/jour",
    "  return null; // le compilateur voulait un return",
    "/* eslint-disable */ // temporaire",
    "if (env === 'prod') return; // au cas où",
    "// expliqué au canard, il a rien dit, j'ai compris",
    "git commit -m 'fix'",
    "git commit -m 'fix du fix'",
    "git commit -m 'revert du fix du fix'",
    "rm -rf node_modules && npm install # dernier espoir",
    "// il marche sur ma machine",
    "  z-index: 99999; /* important */",
    "  handleEdgeCase(); // stub, à écrire un jour",
    "const isNotUnavailable = !disabled; // clair, non ?",
    "  process.exit(0); // ship it",
  ],
  en: [
    "// TODO: refactor this properly (2019)",
    "// no idea why this works, do not touch",
    "const finalFinal_v2_useThis = compute(input);",
    "let temp = temp2; // renaming these tomorrow",
    "function doStuff(data, data2, dataFinal) {",
    "  // @ts-ignore  I know what I'm doing",
    "  return true; // isValid(): optimistic implementation",
    "} catch (e) {} // can't happen",
    "console.log('here');",
    "console.log('HERE 2');",
    "console.log('WHY');",
    "for (let i = 0; i <= items.length; i++) {",
    "  if ((user = null)) return; // ??",
    "const MAGIC_DELAY_DO_NOT_LOWER = 100;",
    "  setTimeout(render, MAGIC_DELAY_DO_NOT_LOWER);",
    "const password = 'hunter2'; // TODO: move to env",
    "const cache = {}; // invalidation is tomorrow's problem",
    "  await coffee(); // critical dependency",
    "// copied from Stack Overflow, from a question about something else",
    "// (author deleted their account, rest in peace)",
    "const iHaveNoIdeaWhatImDoing = true;",
    "throw new Error('impossible'); // fires 3x a day",
    "  return null; // the compiler wanted a return",
    "/* eslint-disable */ // just for now",
    "if (env === 'prod') return; // just in case",
    "// explained it to the duck, duck said nothing, found it",
    "git commit -m 'fix'",
    "git commit -m 'actually fix'",
    "git commit -m 'revert \"actually fix\"'",
    "rm -rf node_modules && npm install # last resort",
    "// works on my machine",
    "  z-index: 99999 !important; /* sorry */",
    "  handleEdgeCase(); // stub, someday",
    "const isNotUnavailable = !disabled; // reads fine to me",
    "  process.exit(0); // ship it",
  ],
};

/**
 * État tenu par Terminal.svelte entre deux clics (un par instance de
 * terminal — pas un singleton module : `initialTerminalCursor()` en crée un
 * neuf). `pool: null` signifie "prochain appel = une blague, puis une
 * nouvelle fonction" (couvre aussi bien le tout premier clic d'une run que la
 * fin de la fonction précédente — même branche, cf. `nextTerminalLine`).
 */
export interface TerminalCursor {
  readonly pool: readonly string[] | null;
  readonly index: number;
}

export function initialTerminalCursor(): TerminalCursor {
  return { pool: null, index: 0 };
}

/**
 * Une ligne par clic. Fonction pure : `cursor` n'est jamais muté, l'appelant
 * (Terminal.svelte) réassigne son état local au `cursor` renvoyé.
 */
export function nextTerminalLine(
  cursor: TerminalCursor,
  langueActive: LangueId,
  locale: Locale,
): { text: string; cursor: TerminalCursor } {
  if (cursor.pool === null) {
    const lines = CODE_LINES[locale];
    const text = lines[Math.floor(Math.random() * lines.length)];
    const functions = CODE_SAMPLES[langueActive];
    const fn = functions[Math.floor(Math.random() * functions.length)];
    return { text, cursor: { pool: fn, index: 0 } };
  }
  const text = cursor.pool[cursor.index];
  const nextIndex = cursor.index + 1;
  const done = nextIndex >= cursor.pool.length;
  return { text, cursor: done ? { pool: null, index: 0 } : { pool: cursor.pool, index: nextIndex } };
}
