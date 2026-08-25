/**
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
 * - rust : rust-lang/rust (MIT OR Apache-2.0) — library/core/src/option.rs, library/core/src/result.rs
 * - python : django/django (BSD-3-Clause) — django/utils/text.py, django/core/paginator.py
 * - javascript : facebook/react (MIT) — packages/react/src/ReactHooks.js
 *
 * 'none' (avant le premier Grand Rewrite) réutilise le pool javascript : les
 * deux partagent le même nom de fichier d'onglet (main.js), cf.
 * langueLabels.ts LANGUE_FILE_NAME.
 */
import type { LangueId } from "../engine/constants";

const RUST_FUNCTIONS: readonly (readonly string[])[] = [
  [
    "    pub const fn is_none(&self) -> bool {",
    "        !self.is_some()",
    "    }",
  ],
  [
    "    pub const fn as_ref(&self) -> Option<&T> {",
    "        match *self {",
    "            Some(ref x) => Some(x),",
    "            None => None,",
    "        }",
    "    }",
  ],
  [
    "    pub const fn as_mut(&mut self) -> Option<&mut T> {",
    "        match *self {",
    "            Some(ref mut x) => Some(x),",
    "            None => None,",
    "        }",
    "    }",
  ],
  [
    "    pub const fn is_err(&self) -> bool {",
    "        !self.is_ok()",
    "    }",
  ],
];

const PYTHON_FUNCTIONS: readonly (readonly string[])[] = [
  [
    "@keep_lazy_text",
    "def capfirst(x):",
    "    \"\"\"Capitalize the first letter of a string.\"\"\"",
    "    if not x:",
    "        return x",
    "    if not isinstance(x, str):",
    "        x = str(x)",
  ],
  [
    "    def get_page(self, number):",
    "        \"\"\"",
    "        Return a valid page, even if the page argument isn't a number or isn't",
    "        in range.",
    "        \"\"\"",
    "        try:",
    "            number = self.validate_number(number)",
    "        except PageNotAnInteger:",
    "            number = 1",
    "        except EmptyPage:",
    "            number = self.num_pages",
    "        return self.page(number)",
  ],
  [
    "    def _validate_number(self, number, num_pages):",
    "        \"\"\"Validate the given 1-based page number.\"\"\"",
    "        try:",
    "            if isinstance(number, float) and not number.is_integer():",
    "                raise ValueError",
    "            number = int(number)",
    "        except (TypeError, ValueError):",
    "            raise PageNotAnInteger(self.error_messages[\"invalid_page\"])",
    "        if number < 1:",
    "            raise EmptyPage(self.error_messages[\"min_page\"])",
    "        if number > num_pages:",
    "            raise EmptyPage(self.error_messages[\"no_results\"])",
  ],
];

const JAVASCRIPT_FUNCTIONS: readonly (readonly string[])[] = [
  [
    "export function useContext<T>(Context: ReactContext<T>): T {",
    "  const dispatcher = resolveDispatcher();",
    "  if (__DEV__) {",
    "    if (Context.$$typeof === REACT_CONSUMER_TYPE) {",
    "      console.error(",
    "        'Calling useContext(Context.Consumer) is not supported and will cause bugs. ' +",
    "          'Did you mean to call useContext(Context) instead?',",
    "      );",
    "    }",
    "  }",
    "  return dispatcher.useContext(Context);",
  ],
  [
    "export function useState<S>(",
    "  initialState: (() => S) | S,",
    "): [S, Dispatch<BasicStateAction<S>>] {",
    "  const dispatcher = resolveDispatcher();",
    "  return dispatcher.useState(initialState);",
    "}",
  ],
  [
    "export function useRef<T>(initialValue: T): {current: T} {",
    "  const dispatcher = resolveDispatcher();",
    "  return dispatcher.useRef(initialValue);",
    "}",
  ],
  [
    "export function useId(): string {",
    "  const dispatcher = resolveDispatcher();",
    "  return dispatcher.useId();",
    "}",
  ],
];

export const CODE_SAMPLES: Record<LangueId, readonly (readonly string[])[]> = {
  none: JAVASCRIPT_FUNCTIONS,
  rust: RUST_FUNCTIONS,
  python: PYTHON_FUNCTIONS,
  javascript: JAVASCRIPT_FUNCTIONS,
};

/** Attribution affichée en jeu (onglet README.md, cf. EditorView.svelte). */
export const CODE_SAMPLE_SOURCE: Record<LangueId, { repo: string; url: string }> = {
  none: { repo: "facebook/react", url: "https://github.com/facebook/react" },
  rust: { repo: "rust-lang/rust", url: "https://github.com/rust-lang/rust" },
  python: { repo: "django/django", url: "https://github.com/django/django" },
  javascript: { repo: "facebook/react", url: "https://github.com/facebook/react" },
};
