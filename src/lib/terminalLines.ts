import type { LangueId } from "../engine/constants";
import { CODE_SAMPLES } from "./codeSamples";

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
 * §6). Ratio remonté à 60 % vrai code / 40 % blague le même jour (décision
 * user) : le vrai code devient l'essentiel du buffer, l'humour reste présent
 * mais minoritaire.
 */
const REAL_CODE_RATIO = 0.6;
const CODE_LINES: readonly string[] = [
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
];

export function pickCodeLine(langueActive: LangueId): string {
  if (Math.random() < REAL_CODE_RATIO) {
    const pool = CODE_SAMPLES[langueActive];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return CODE_LINES[Math.floor(Math.random() * CODE_LINES.length)];
}
