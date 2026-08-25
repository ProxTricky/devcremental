# devcremental — Plan de conception & réalisation

> Un jeu incrémental sur le thème du développement logiciel, fait **par** un dev **pour** des devs.
> Objectif : un jeu qui retient l'attention non pas par la manipulation, mais parce que chaque nouvelle couche de mécanique est une blague ou une vérité que seul un dev peut apprécier.

---

## 1. Pitch

Tu commences seul, à taper `console.log("Hello World")` à la main. Tu finis à la tête d'une entité qui a réécrit la réalité en Rust. Entre les deux : bugs, dette technique, stagiaires, levées de fonds, CI/CD, et l'inévitable Grand Rewrite.

Le fil rouge (à la *Universal Paperclips*) : le jeu **change de nature** plusieurs fois. Ce n'est pas un clicker qui devient plus gros, c'est un jeu qui se transforme — clicker → gestion → automatisation → programmation réelle.

---

## 2. État de l'art (recherche)

### Ce qui existe déjà
| Jeu | Ce qu'il fait bien | Limite |
|---|---|---|
| **Universal Paperclips** | Changements de phase radicaux, narration émergente, fin en ~6h | Pas thème dev |
| **Bitburner** | On programme *réellement* en JS pour jouer — l'arme absolue pour un public dev | Barrière d'entrée énorme, UI austère |
| **Cookie Clicker** | Densité d'upgrades, humour, "golden cookies" (événements actifs) | Boucle qui s'essouffle |
| **Antimatter Dimensions** | Couches de prestige imbriquées, des mois de contenu | Thème abstrait |
| **Idle Programmer / Code Clicker** (itch.io) | Thème dev | Prototypes superficiels : le thème est un skin, pas une mécanique |

### Le créneau
Les jeux "dev-themed" existants utilisent le thème comme **décor**. Personne n'a fait un incrémental où les mécaniques *sont* des concepts de dev (la dette technique comme ressource négative qui compose, le refactoring comme prestige, le YAGNI comme choix de build). C'est ça, le créneau : **les mécaniques sont la blague**.

### Principes de rétention validés par la recherche
- **3 phases d'engagement** : Hook (0–30 min, gratification immédiate), Habit (1–7 jours, check-ins avec vraie progression), Hobby (semaines, systèmes profonds).
- **~60% de la progression en idle, ~40% en jeu actif** — accessible mais récompense l'attention.
- **Toujours un objectif visible** : le prochain unlock doit être affiché et atteignable "bientôt".
- **Prestige au bon moment** : le joueur doit prestige quand sa vitesse tombe à ~10–20% du pic. La formule de gain doit rendre ce moment évident.
- **Milestones structurants** : premier prestige, premier automate, première couche méta — ce sont eux qui corrèlent avec la rétention longue.

---

## 3. Concept : les 5 actes

Chaque acte change le gameplay, pas juste les nombres.

### Acte I — Solo Dev (0–30 min) · *le Hook*
- On clique pour écrire des **lignes de code (LoC)**. Chaque clic affiche une vraie ligne de code qui défile dans un faux terminal (le feedback visuel EST un terminal).
- Le café multiplie les clics. Premiers générateurs : *Copier-coller Stack Overflow*, *Stagiaire*, *Rubber Duck*.
- Première vérité de dev : les LoC génèrent des **Bugs**. Les bugs réduisent la production. Il faut arbitrer : produire ou fixer.
- Fin d'acte : tu publies ton projet en open source → déblocage des **⭐ GitHub Stars** (réputation).

### Acte II — Open Source (30 min – jour 2) · *le Habit*
- Les Stars attirent des **contributeurs** (générateurs gratuits mais qui créent des issues).
- Nouvelle ressource antagoniste : la **Dette Technique**. Elle croît avec la production et agit comme un *diviseur composé* de tout. C'est la mécanique centrale du jeu. *(Mécanique transverse : livrée dès la Phase 1/MVP avec le Grand Rewrite — voir §9 et `docs/design/dette-technique-grand-rewrite.md` — indépendamment du reste de la boucle Acte II ci-dessous (Stars, PRs, contributeurs), qui elle attend la Phase 2. Décision et justification détaillées en tête de ce document de spec.)*
- Premier prestige : **le Grand Rewrite** — tout réécrire dans un nouveau langage. Reset des ressources, mais chaque langage donne un buff permanent différent (voir §5).
- Système de **Pull Requests** : événements actifs type "golden cookie" (une PR apparaît, la review donne un boost temporaire, la merger sans lire donne plus mais ajoute de la dette).

### Acte III — Startup (jours 2–7)
- Pivot : le code devient un moyen, les nouvelles monnaies sont **Users** et **MRR (€)**.
- Levées de fonds (seed, A, B) : gros boost immédiat contre un % de "contrôle" — et perdre le contrôle a des conséquences en acte V.
- Embauches : juniors (pas chers, beaucoup de bugs), seniors (chers, réduisent la dette), 10x dev (aléatoire, rare).
- Déblocage de la **CI/CD** : la couche d'automatisation — les pipelines achètent/réparent tout seuls. Le jeu devient un jeu de gestion.

### Acte IV — Tech Giant (semaines 2–4)
- Couche méta : **Frameworks** (prestige de niveau 2). On abandonne des pans entiers de features (mécanique de sacrifice) pour des multiplicateurs légendaires.
- **Compute** devient la ressource maîtresse : datacenters, puis entraînement de modèles.
- Événements mondiaux : incident en prod un vendredi 17h, faille supply chain dans une dépendance, `left-pad` disparaît de npm.

### Acte V — Singularité (endgame) · *le twist Bitburner*
- Tu as entraîné une IA qui code. Le jeu débloque un **éditeur de scripts intégré** : le joueur écrit du vrai JavaScript (sandboxé) pour automatiser sa propre partie — API du type `game.buy('intern')`, `game.debt()`, `game.prestige(...)`.
- C'est la killer feature pour le public dev : le endgame du jeu, c'est *programmer le jeu*.
- Fin (optionnelle, à la Paperclips) : l'IA n'a plus besoin de toi. Écran final + **New Game+**.

---

## 4. Boucle de jeu & ressources

```
clic/idle → LoC ──→ Features ──→ Users ──→ € ──→ générateurs/embauches ─┐
              │                    ↑                                     │
              └→ Bugs ──(freinent)─┘         ⭐ Stars → contributeurs    │
              └→ Dette technique ──(divise TOUT, compose)────────────────┤
                       ↑ refactoring actif la réduit                     │
                       └────────── Grand Rewrite (prestige) l'efface ←───┘
```

**Ressources** : LoC · Bugs · Dette technique · Features · ⭐ Stars · Users · € (MRR) · ☕ Café · Compute · *(méta)* Karma de Rewrite, Points de Framework.

**La dette technique est LE pilier du design** : c'est elle qui crée le mur de ralentissement (au lieu du simple coût exponentiel), elle qui rend le prestige *désirable* ("enfin, on repart propre !") et elle qui parle à chaque dev viscéralement. Le prestige n'est pas une punition-reset, c'est un **soulagement**.

## 5. Prestige : le Grand Rewrite

- Gain : **Karma** ∝ `√(LoC totales de la run)` — formule standard, rend le premier prestige atteignable en ~30–45 min.
- Choix du **langage** de la nouvelle run, chacun un archétype de build :
  - **Python** 🐍 : +vitesse de features, +bugs runtime
  - **Rust** 🦀 : production −20% mais quasi zéro bugs, dette qui croît 2× moins vite ("if it compiles, it works")
  - **JavaScript** : tout est plus rapide, événements chaotiques aléatoires
  - **Go / Java / Haskell / COBOL…** : débloqués progressivement ; COBOL = multiplicateur absurde mais mécaniques volontairement pénibles (blague qui se mérite)
- Upgrades permanentes achetées en Karma : arbre à 3 branches **Vélocité / Qualité / Influence**.
- Choix binaires permanents à la Cookie Clicker : **tabs vs spaces**, **vim vs emacs**, **rebase vs merge** — chacun un vrai trade-off mécanique, jamais neutre.

## 6. Humour & flavor (différenciateur clé)

L'écriture doit être au niveau d'un bon compte parodique de dev. Règle : **chaque upgrade a un flavor text qui est une vraie blague**, pas du lorem ipsum thématique.
- Upgrade "Il marche sur ma machine" : les bugs en prod ne comptent plus… sur ta machine.
- `npm install` : gagne 10 000 LoC instantanément (ce sont les `node_modules`), +500 de dette.
- Achievement "YAGNI" : finir un acte sans acheter une upgrade spécifique.
- Le stagiaire qui `git push --force` sur main : événement négatif rare.
- Nombres affichés en notation dev : `1.2k`, `3.4M`, puis en notation scientifique, puis en hexa (unlockable cosmétique).

## 7. Stack technique

| Choix | Quoi | Pourquoi |
|---|---|---|
| Langage | **TypeScript** | Balancing = beaucoup de formules ; le typage évite les heures de debug |
| UI | **Svelte 5 + Vite** | Réactivité fine sans re-render global — critique quand 50 compteurs bougent 10×/s. (React viable si tu le connais mieux, avec sélecteurs Zustand) |
| Grands nombres | **break_eternity.js** | Successeur de break_infinity, gère jusqu'à 10^^1e308 ; indispensable dès l'acte III |
| Boucle de jeu | `requestAnimationFrame` pour l'affichage + **tick logique fixe (10/s) à rattrapage** (`accumulator`), dans un **Web Worker** pour tourner onglet inactif | Progression fluide et exacte, pas liée au FPS |
| Sauvegarde | localStorage, autosave 30 s, **export/import base64** + versionnage de schéma avec migrations | L'export manuel est vital (localStorage se fait purger) |
| Progression offline | timestamp au `beforeunload` → simulation du delta au retour (plafonné, ex. 8 h, extensible par upgrade) | Standard du genre |
| Sandbox scripts (acte V) | Web Worker isolé + API `postMessage` blanche-listée, budget CPU par tick | Jamais d'`eval` dans le contexte principal |
| Déploiement | Site statique : GitHub Pages / Cloudflare Pages + **itch.io** (visibilité) + PWA installable | Gratuit, zéro backend |
| Backend | **Aucun** au départ | YAGNI. Cloud saves/leaderboards seulement si le jeu prend |

## 8. Balancing — règles chiffrées

- Coût des générateurs : `coût = base × 1.15^possédés` (1.07–1.12 pour les générateurs de late game).
- Production par palier : chaque nouveau générateur produit ~5–8× le précédent au moment de son unlock.
- Dette : `dette += production_brute × taux_acte` par tick ; effet = `production_nette = brute / (1 + dette/K)^α`. Le refactoring actif (bouton à maintenir/cooldown) la réduit — donne quelque chose à faire aux joueurs actifs.
- Timings cibles : 1er générateur < 30 s · 1er automate ~5 min · 1er Rewrite 30–45 min · Acte III jour 2 · Acte V semaine 3–4.
- **Toujours ≥ 2 objectifs visibles à l'écran** (prochain unlock + prochain milestone).
- Prototyper les courbes dans un **notebook/spreadsheet avant de coder** — itérer sur une formule dans Excel coûte 100× moins cher qu'en jeu.

### Anti-patterns à éviter
- Le "mur mort" : un palier où rien ne progresse ni ne se débloque pendant des heures sans que le prestige soit rentable.
- Le prestige-punition : si la re-montée n'est pas *nettement* plus rapide (×3 minimum), les joueurs quittent.
- Les upgrades +5% : chaque achat doit être *ressenti*. Moins d'upgrades, plus grosses.
- Dark patterns mobiles (timers frustrants, pubs) : le public dev les flaire et les déteste. La rétention vient du contenu.

## 9. Roadmap

### Phase 0 — Prototype papier (2–3 jours)
Spreadsheet des courbes de l'acte I–II. Valider : à quelle minute chaque unlock ? quand le 1er prestige ?

### Phase 1 — MVP jouable (1–2 semaines) 🎯
Acte I complet + dette technique + Grand Rewrite avec 3 langages. UI terminal/IDE (thème sombre évidemment). Save/load/export. Offline progress. **Critère de sortie : quelqu'un y rejoue le lendemain sans qu'on lui demande.**

### Phase 2 — Le jeu qui respire (2–3 semaines)
Acte II (Stars, PRs actives, contributeurs), achievements, événements aléatoires, flavor texts complets, stats, notation des nombres, équilibrage par playtest (poster sur r/incremental_games — feedback brutal et gratuit).

### Phase 3 — Profondeur (1 mois)
Actes III–IV : startup, embauches, CI/CD, frameworks (prestige 2), événements mondiaux.

### Phase 4 — Endgame (1 mois)
Acte V : éditeur de scripts sandboxé, API de jeu documentée, fin narrative, NG+.

### Phase 5 — Live
itch.io + Hacker News "Show HN" + r/incremental_games. Cloud saves si traction.

## 10. Premiers pas concrets

1. `npm create vite@latest devcremental -- --template svelte-ts`
2. Spreadsheet de balancing acte I (colonnes : générateur, coût base, prod, unlock à quelle LoC, minute attendue).
3. Moteur : store d'état + tick logique 10/s avec accumulator + break_eternity.
4. UI acte I : le faux terminal, le bouton "Écrire du code", 4 générateurs.
5. Dette + bugs → premier mur → Grand Rewrite.
6. Playtest toi-même 2 jours avant d'écrire la moindre feature de plus.

---

## Sources

- [Idle Games Best Practices — GridInc](https://gridinc.co.za/blog/idle-games-best-practices)
- [A Deep Dive into Idle Genre Game Design](https://www.designthegame.com/learning/courses/course/designing-mobile-idle-genre/a-deep-dive-idle-genre-game-design)
- [Idle Clicker Games: Best Practices — Mind Studios](https://games.themindstudios.com/post/idle-clicker-game-design-and-monetization/)
- [Incremental game — Wikipedia](https://en.wikipedia.org/wiki/Incremental_game)
- [Universal Paperclips — Wikipedia](https://en.wikipedia.org/wiki/Universal_Paperclips)
- [Bitburner — discussion Hacker News](https://news.ycombinator.com/item?id=48312616)
- [History of incremental games — Medium](https://medium.com/@touloutoumou/from-progress-quest-to-universal-paperclip-the-history-of-free-incremental-games-3c96bfeaa918)
- [Idle Programmer — itch.io](https://galemius.itch.io/idle-programmer) · [Code Clicker — itch.io](https://landrydev.itch.io/code-clicker/devlog/979344/004)
- [Developing Your Incremental Game — kastark](https://kastark.co.uk/articles/incrementals-part-2.html)
- [break_infinity.js](https://patashu.github.io/break_infinity.js/index.html)
- [Game loop pour idle game — gist](https://gist.github.com/HipHopHuman/3e9b4a94b30ac9387d9a99ef2d29eb1a)
