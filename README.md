# devcremental

Jeu incrémental sur le thème du développement logiciel, pour un public dev.
Les mécaniques *sont* des concepts de dev (dette technique, refactoring, Grand
Rewrite, bugs) plutôt qu'un simple thème posé sur un clicker générique.

**Jouer** : https://proxtricky.github.io/devcremental/

## Contexte projet

- `PLAN.md` — plan de jeu complet et faisant autorité (concept, boucle de jeu,
  balancing, roadmap).
- `CLAUDE.md` — résumé opérationnel pour les agents/contributeurs.
- `docs/design/` — specs normatives par mécanique (Acte I, Dette Technique,
  upgrades, progression offline, notation des nombres, identité visuelle).
- `THIRD_PARTY_NOTICES.md` — attribution des extraits de code réel affichés
  dans le faux terminal (un dépôt public par archétype de langage).

## Développement

```bash
npm install
npm run dev      # serveur de dev, http://localhost:5173
npm run check    # svelte-check + typecheck (app/worker/node)
npm test         # vitest
npm run build    # build de production (dist/)
```

Stack : TypeScript + Svelte 5 + Vite, `break_eternity.js` pour les grands
nombres, tick logique 10/s + accumulator dans un Web Worker, sauvegarde
localStorage (export/import base64). Aucun backend — site statique.

## Branches & CI

- `main` : branche de production, protégée — un push doit avoir le check CI
  ("test" : typecheck + tests + build) déjà vert sur ce commit.
- `dev` : branche de travail.
- Chaque push sur `main` déploie automatiquement sur GitHub Pages
  (`.github/workflows/ci.yml`).

## Licence

[MIT](LICENSE).
