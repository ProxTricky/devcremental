#!/usr/bin/env node
/**
 * Régénère src/lib/codeSamples.ts à partir d'extraits réels de dépôts publics
 * emblématiques (un par archétype de langage du Grand Rewrite, cf.
 * src/engine/constants.ts LANGUE_IDS). Lignes utilisées comme flavor "vrai
 * code" dans Terminal.svelte, mélangées aux blagues de terminalLines.ts.
 *
 * Usage : node scripts/fetch-code-samples.mjs (nécessite un accès réseau à
 * raw.githubusercontent.com). Pas branché en CI — à relancer manuellement si
 * on veut rafraîchir le pool (npm run fetch:code-samples).
 */

const SOURCES = [
  {
    langue: "rust",
    repo: "rust-lang/rust",
    licence: "MIT OR Apache-2.0",
    fichiers: [
      "library/core/src/option.rs",
      "library/core/src/result.rs",
    ],
  },
  {
    langue: "python",
    repo: "django/django",
    licence: "BSD-3-Clause",
    fichiers: [
      "django/utils/text.py",
      "django/core/paginator.py",
    ],
  },
  {
    langue: "javascript",
    repo: "facebook/react",
    licence: "MIT",
    fichiers: [
      "packages/shared/shallowEqual.js",
      "packages/react/src/ReactHooks.js",
    ],
  },
];

const MAX_LINE_LEN = 76;
const MIN_LINE_LEN = 6;
const MAX_CODE_LINES_PER_FILE = 28;
const MAX_COMMENT_LINES_PER_FILE = 8;

const DROP_RE = /copyright|spdx|license|@flow|@providesmodule/i;
const BRACE_ONLY_RE = /^[)\]}>;,:]+$/;
// Commentaire "ligne de code" (///, //, #) — mais pas doc de module (//!,
// trop nombreux et trop proses dans un fichier comme option.rs) ni attribut
// Rust (#[...], filtré séparément).
const COMMENT_RE = /^\s*(\/\/\/?(?!!)|#(?!\[))/;

function extractLines(raw) {
  const seen = new Set();
  const code = [];
  const comments = [];
  for (const rawLine of raw.split("\n")) {
    const line = rawLine.replace(/\s+$/u, "");
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < MIN_LINE_LEN) continue;
    if (line.length > MAX_LINE_LEN) continue;
    if (DROP_RE.test(trimmed)) continue;
    if (BRACE_ONLY_RE.test(trimmed)) continue;
    if (trimmed.includes("#[") || trimmed.startsWith("#![") || trimmed.startsWith("//!")) continue; // attributs Rust (même en milieu de ligne, y compris #![...]) / doc de module
    if (/"\]\s*$/.test(trimmed)) continue; // suite probable d'un attribut multi-lignes (ex: #[must_use = "...\n...\"]`)
    if (seen.has(line)) continue;
    seen.add(line);
    if (COMMENT_RE.test(trimmed)) {
      if (comments.length < MAX_COMMENT_LINES_PER_FILE) comments.push(line);
    } else if (code.length < MAX_CODE_LINES_PER_FILE) {
      code.push(line);
    }
    if (code.length >= MAX_CODE_LINES_PER_FILE && comments.length >= MAX_COMMENT_LINES_PER_FILE) {
      break;
    }
  }
  return [...code, ...comments];
}

async function fetchFile(repo, path) {
  const url = `https://raw.githubusercontent.com/${repo}/HEAD/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

function tsStringLiteral(s) {
  return JSON.stringify(s);
}

async function main() {
  const pools = {};
  const credits = [];

  for (const source of SOURCES) {
    const lines = [];
    for (const fichier of source.fichiers) {
      const raw = await fetchFile(source.repo, fichier);
      lines.push(...extractLines(raw));
    }
    pools[source.langue] = lines;
    credits.push(
      `${source.langue} : ${source.repo} (${source.licence}) — ${source.fichiers.join(", ")}`,
    );
    console.log(`${source.langue}: ${lines.length} lignes retenues depuis ${source.repo}`);
  }

  const reactSource = SOURCES.find((s) => s.langue === "javascript");

  const body = `/**
 * Extraits de code réel, une source par archétype de langage (Grand Rewrite,
 * src/engine/constants.ts LANGUE_IDS). Généré par
 * scripts/fetch-code-samples.mjs — ne pas éditer à la main, relancer le
 * script pour rafraîchir. Mélangé aux blagues de terminalLines.ts dans
 * Terminal.svelte (visual-identity.md) pour donner au buffer l'air d'un vrai
 * projet, tout en gardant l'humour, différenciateur du jeu (PLAN.md §6).
 *
 * Attribution (dépôts publics permissifs, cf. THIRD_PARTY_NOTICES.md) :
${credits.map((c) => ` * - ${c}`).join("\n")}
 *
 * 'none' (avant le premier Grand Rewrite) réutilise le pool javascript : les
 * deux partagent le même nom de fichier d'onglet (main.js), cf.
 * langueLabels.ts LANGUE_FILE_NAME.
 */
import type { LangueId } from "../engine/constants";

const RUST_CODE: readonly string[] = [
${pools.rust.map((l) => `  ${tsStringLiteral(l)},`).join("\n")}
];

const PYTHON_CODE: readonly string[] = [
${pools.python.map((l) => `  ${tsStringLiteral(l)},`).join("\n")}
];

const JAVASCRIPT_CODE: readonly string[] = [
${pools.javascript.map((l) => `  ${tsStringLiteral(l)},`).join("\n")}
];

export const CODE_SAMPLES: Record<LangueId, readonly string[]> = {
  none: JAVASCRIPT_CODE,
  rust: RUST_CODE,
  python: PYTHON_CODE,
  javascript: JAVASCRIPT_CODE,
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
