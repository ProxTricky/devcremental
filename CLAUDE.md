# devcremental — Contexte projet

Jeu incrémental sur le thème du développement logiciel. Plan complet et faisant
autorité : `PLAN.md` à la racine — tout subagent doit s'y référer, ce fichier n'en est
qu'un résumé opérationnel (chaque subagent démarre avec un contexte vide : ce qui n'est
pas ici ou dans PLAN.md n'existe pas pour lui).

## Stack technique (tranchée, PLAN.md §7)
- TypeScript + Svelte 5 + Vite
- Grands nombres : break_eternity.js
- Boucle de jeu : tick logique 10/s + accumulator, dans un Web Worker ;
  requestAnimationFrame pour l'affichage seulement
- Sauvegarde : localStorage, autosave 30s, export/import base64, versionnée + migrations
- Progression offline : timestamp au beforeunload, calcul agrégé plafonné (8h par défaut)
- Aucun backend (YAGNI) — site statique, GitHub Pages/Cloudflare Pages + itch.io + PWA

## Structure du jeu
5 actes qui changent le gameplay (pas juste les nombres) : Solo Dev → Open Source →
Startup → Tech Giant → Singularité. Détail complet dans PLAN.md §3.

Ressources : LoC · Bugs · Dette technique (le pilier du design, diviseur composé) ·
Features · ⭐ Stars · Users · € (MRR) · ☕ Café · Compute · Karma de Rewrite ·
Points de Framework.

## Équipe (subagents dans .claude/agents/)
- **game-designer** : mécaniques, formules, pacing
- **game-engineer** : implémentation cœur de jeu
- **art-director** : identité visuelle (docs/design/visual-identity.md) — à consulter
  avant tout travail UI substantiel, ui-engineer implémente sa direction sans improviser
- **ui-engineer** : UI Svelte, implémente la direction d'art-director
- **content-writer** : flavor text et humour (différenciateur clé du jeu, PLAN.md §6)
- **balance-qa** : validation équilibrage et robustesse (mémoire persistante)
- **perf-engineer** : optimisation sur goulots mesurés uniquement

## Conventions
- Specs de design dans `docs/design/acte-<n>-<nom>.md`, lues par game-engineer,
  ui-engineer et content-writer avant toute implémentation/rédaction.
- Formules toujours documentées avec leurs paramètres, jamais codées en dur sans
  commentaire renvoyant vers la spec.
- Tests unitaires obligatoires sur : formules de production/dette, save/load/migration,
  calcul de progression offline.
- Chaque upgrade/événement/achievement doit avoir un flavor text écrit par
  content-writer — jamais de placeholder en prod.

## Roadmap (PLAN.md §9)
Phase 0 (prototype spreadsheet des courbes) → Phase 1 MVP (Acte I + dette + Grand
Rewrite 3 langages) → Phase 2 (Acte II, achievements, playtest public) → Phase 3
(Actes III–IV) → Phase 4 (Acte V, éditeur de scripts) → Phase 5 (live).

## État du projet
- [x] Phase 1 (MVP) quasiment close : moteur Acte I + Dette Technique/Refactoring/
      Grand Rewrite (3 archétypes) + 4 upgrades intra-run + progression offline,
      tous implémentés et testés (129 tests). UI IDE-shell complète (révision 2 de
      `docs/design/visual-identity.md`), flavor text posé sur tout le MVP.
- [ ] Prochaine tâche : rééquilibrage chiffré des constantes de bugs/dette (voir
      `01-Projects/devcremental/kanban.md` dans le Second Brain — colonne "Reste
      pour clore Phase 1"), puis bascule en Phase 2 (boucle Acte II complète :
      Stars en flux continu, PRs, contributeurs).

## Historique de décisions notables
- Stack et architecture figées dès le plan initial (voir PLAN.md) — les remettre en
  cause demande une raison mesurée, pas une préférence.
- Dette Technique + Refactoring + Grand Rewrite (3 langages) forment un système
  transverse livré dès la Phase 1, indépendant du reste de la boucle Acte II
  (Stars/PRs/contributeurs, restés Phase 2) — voir `docs/design/dette-technique-grand-rewrite.md`.
- Terminal Acte I : mélange de blagues (`terminalLines.ts`) et d'extraits de code
  réel issus de dépôts publics permissifs par archétype de langage
  (`src/lib/codeSamples.ts`, `THIRD_PARTY_NOTICES.md`) — jamais de fetch runtime
  (contrainte PWA offline).
