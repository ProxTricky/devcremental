#!/usr/bin/env node
/**
 * Régénère src/lib/codeSamples.ts à partir de fonctions complètes et réelles
 * choisies à la main dans des dépôts publics emblématiques (un par archétype
 * de langage du Grand Rewrite, cf. src/engine/constants.ts LANGUE_IDS).
 *
 * Contrairement à une première version qui filtrait des LIGNES isolées, ce
 * script extrait des FONCTIONS COMPLÈTES (plage de lignes exacte, choisie et
 * relue à la main) : Terminal.svelte révèle une fonction ligne par ligne au
 * fil des clics, puis insère une blague une fois la fonction terminée, avant
 * d'en commencer une nouvelle (src/lib/terminalLines.ts, `nextTerminalLine`).
 * Une fonction de 3 lignes se "tape" en 3 clics, une de 12 lignes en 12 —
 * la borne ci-dessous (MAX_FUNCTION_LINES) existe pour qu'aucune fonction ne
 * fasse traîner ce rythme en longueur.
 *
 * Usage : node scripts/fetch-code-samples.mjs (nécessite un accès réseau à
 * raw.githubusercontent.com). Pas branché en CI — à relancer manuellement si
 * on veut ajouter/retirer une fonction (éditer FUNCTIONS ci-dessous), jamais
 * en scannant automatiquement un fichier (on veut choisir et relire chaque
 * fonction affichée aux joueurs, pas la découvrir a posteriori).
 */

const MAX_FUNCTION_LINES = 12;

const SOURCES = [
  { langue: "rust", repo: "rust-lang/rust", licence: "MIT OR Apache-2.0" },
  { langue: "python", repo: "django/django", licence: "BSD-3-Clause" },
  { langue: "javascript", repo: "facebook/react", licence: "MIT" },
];

// Plages de lignes choisies et relues à la main (pas de scan automatique,
// cf. commentaire de tête) — 1-indexé, bornes incluses, comme dans un éditeur.
const FUNCTIONS = {
  rust: [
    { file: "library/core/src/option.rs", from: 682, to: 684 }, // is_none
    { file: "library/core/src/option.rs", from: 742, to: 747 }, // as_ref
    { file: "library/core/src/option.rs", from: 764, to: 769 }, // as_mut
    { file: "library/core/src/result.rs", from: 647, to: 649 }, // is_err
  ],
  python: [
    { file: "django/utils/text.py", from: 25, to: 31 }, // capfirst (+ décorateur)
    { file: "django/core/paginator.py", from: 155, to: 166 }, // get_page
    { file: "django/core/paginator.py", from: 132, to: 143 }, // _validate_number
  ],
  javascript: [
    { file: "packages/react/src/ReactHooks.js", from: 53, to: 63 }, // useContext
    { file: "packages/react/src/ReactHooks.js", from: 66, to: 71 }, // useState
    { file: "packages/react/src/ReactHooks.js", from: 82, to: 85 }, // useRef
    { file: "packages/react/src/ReactHooks.js", from: 183, to: 186 }, // useId
  ],
};

async function fetchFile(repo, path) {
  const url = `https://raw.githubusercontent.com/${repo}/HEAD/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

function sliceFunction(raw, from, to, file) {
  const lines = raw.split("\n");
  const slice = lines.slice(from - 1, to).map((l) => l.replace(/\s+$/u, ""));
  if (slice.length === 0 || slice.some((l) => l.length === 0)) {
    throw new Error(`Plage vide ou ligne blanche dans ${file}:${from}-${to} — vérifier les numéros de ligne (le fichier source a peut-être changé).`);
  }
  if (slice.length > MAX_FUNCTION_LINES) {
    throw new Error(`${file}:${from}-${to} fait ${slice.length} lignes > MAX_FUNCTION_LINES (${MAX_FUNCTION_LINES}).`);
  }
  return slice;
}

function tsStringLiteral(s) {
  return JSON.stringify(s);
}

async function main() {
  const fileCache = new Map();
  const pools = {};
  const credits = [];

  for (const source of SOURCES) {
    const ranges = FUNCTIONS[source.langue];
    const functions = [];
    for (const range of ranges) {
      const cacheKey = `${source.repo}/${range.file}`;
      if (!fileCache.has(cacheKey)) {
        fileCache.set(cacheKey, await fetchFile(source.repo, range.file));
      }
      functions.push(sliceFunction(fileCache.get(cacheKey), range.from, range.to, range.file));
    }
    pools[source.langue] = functions;
    const files = [...new Set(ranges.map((r) => r.file))];
    credits.push(`${source.langue} : ${source.repo} (${source.licence}) — ${files.join(", ")}`);
    console.log(`${source.langue}: ${functions.length} fonctions (${functions.map((f) => f.length).join("+")} lignes) depuis ${source.repo}`);
  }

  const reactSource = SOURCES.find((s) => s.langue === "javascript");

  const renderPool = (fns) =>
    `[\n${fns.map((f) => `  [\n${f.map((l) => `    ${tsStringLiteral(l)},`).join("\n")}\n  ],`).join("\n")}\n]`;

  const body = `/**
 * Fonctions réelles complètes, une source par archétype de langage (Grand
 * Rewrite, src/engine/constants.ts LANGUE_IDS). Chaque entrée de
 * CODE_SAMPLES est une fonction entière (tableau de lignes, dans l'ordre) —
 * généré par scripts/fetch-code-samples.mjs à partir de plages de lignes
 * choisies à la main, ne pas éditer ce fichier directement, relancer le
 * script pour ajouter/retirer une fonction.
 *
 * Terminal.svelte révèle une fonction ligne par ligne au fil des clics
 * "Écrire du code" (une fonction de N lignes = N clics), puis insère une
 * blague de terminalLines.ts une fois la fonction terminée, avant d'en tirer
 * une nouvelle au hasard (voir nextTerminalLine dans terminalLines.ts) — pour
 * donner au buffer l'air d'un vrai projet tout en gardant l'humour,
 * différenciateur du jeu (PLAN.md §6).
 *
 * Attribution (dépôts publics permissifs, cf. THIRD_PARTY_NOTICES.md) :
${credits.map((c) => ` * - ${c}`).join("\n")}
 *
 * 'none' (avant le premier Grand Rewrite) réutilise le pool javascript : les
 * deux partagent le même nom de fichier d'onglet (main.js), cf.
 * langueLabels.ts LANGUE_FILE_NAME.
 */
import type { LangueId } from "../engine/constants";

const RUST_FUNCTIONS: readonly (readonly string[])[] = ${renderPool(pools.rust)};

const PYTHON_FUNCTIONS: readonly (readonly string[])[] = ${renderPool(pools.python)};

const JAVASCRIPT_FUNCTIONS: readonly (readonly string[])[] = ${renderPool(pools.javascript)};

export const CODE_SAMPLES: Record<LangueId, readonly (readonly string[])[]> = {
  none: JAVASCRIPT_FUNCTIONS,
  rust: RUST_FUNCTIONS,
  python: PYTHON_FUNCTIONS,
  javascript: JAVASCRIPT_FUNCTIONS,
};

/** Attribution affichée en jeu (onglet README.md, cf. EditorView.svelte). */
export const CODE_SAMPLE_SOURCE: Record<LangueId, { repo: string; url: string }> = {
  none: { repo: ${tsStringLiteral(reactSource.repo)}, url: ${tsStringLiteral(`https://github.com/${reactSource.repo}`)} },
${SOURCES.map(
  (s) =>
    `  ${s.langue}: { repo: ${tsStringLiteral(s.repo)}, url: ${tsStringLiteral(`https://github.com/${s.repo}`)} },`,
).join("\n")}
};
`;

  const { writeFile } = await import("node:fs/promises");
  const outPath = new URL("../src/lib/codeSamples.ts", import.meta.url);
  await writeFile(outPath, body, "utf-8");
  console.log(`\nÉcrit : ${outPath.pathname.replace(/^\//, "")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
