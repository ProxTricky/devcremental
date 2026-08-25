# Mentions tierces

Le faux terminal (`src/lib/Terminal.svelte`) mélange des blagues de dev
originales (`src/lib/terminalLines.ts`) à des **fonctions complètes**
réelles, tirées de dépôts publics emblématiques — un par archétype de
langage du Grand Rewrite (`src/engine/constants.ts` `LANGUE_IDS`). Une
fonction se révèle ligne par ligne au fil des clics, puis une blague
s'insère une fois la fonction terminée. Purement décoratif : aucune ligne
n'est exécutée, le jeu ne redistribue pas ces projets.

| Archétype | Dépôt | Licence | Fichiers échantillonnés |
|---|---|---|---|
| Rust | [rust-lang/rust](https://github.com/rust-lang/rust) | MIT OR Apache-2.0 | `library/core/src/option.rs`, `library/core/src/result.rs` |
| Python | [django/django](https://github.com/django/django) | BSD-3-Clause | `django/utils/text.py`, `django/core/paginator.py` |
| JavaScript (et `none`, avant le premier Rewrite) | [facebook/react](https://github.com/facebook/react) | MIT | `packages/react/src/ReactHooks.js` |

Fonctions choisies à la main (plages de lignes exactes, relues avant
publication — pas de scan automatique) et régénérées par
`scripts/fetch-code-samples.mjs` dans `src/lib/codeSamples.ts` — éditer la
table `FUNCTIONS` du script puis le relancer pour ajouter/retirer une
fonction ou changer de dépôt source.
