import type { Locale } from "./i18n";

/**
 * Libellés d'interface en dur dans les composants Svelte (titres de section,
 * hints, aria-label/title, popovers de TitleBar, messages du journal
 * `gameStore.eventLog`...) — PAS du flavor text ni du contenu de jeu, qui
 * vivent dans `flavorText.ts`/`terminalLines.ts`/etc.
 *
 * Choix d'organisation (demande user du 2026-08-25, i18n fr/en) : dictionnaire
 * centralisé plutôt qu'un petit `Record<Locale, {...}>` local par composant.
 * Une vingtaine de composants sont concernés pour un total d'une cinquantaine
 * de chaînes courtes et hétérogènes (labels, aria-label, confirmations) — les
 * disperser aurait multiplié les petits objets locaux pour un gain de
 * lisibilité nul, et aurait rendu la future passe de polish content-writer
 * plus dure à mener (un seul fichier à relire plutôt que 18). Regroupé par
 * composant pour rester navigable, sur le même patron `Record<Locale, T>` que
 * le reste du projet (`NumberNotation`, `LangueId`, `flavorText.ts`...).
 *
 * Exceptions volontaires, jamais traduites (documentées à leur site d'usage) :
 * - TitleBar : "File"/"Edit"/"Run"/"Refactor"/"Prestige" (convention IDE réel,
 *   visual-identity.md) et les noms d'option "Français"/"English" (glottonymes).
 * - BottomPanel : "Problems"/"Output" (même convention IDE, déjà anglais des
 *   deux côtés dans la version d'origine).
 * - StatsHeader : "Lines of code"/"Net/sec"/"⭐ Stars" (déjà anglais/symboles
 *   dans la version d'origine, noms de ressources du jeu).
 * - Noms propres : "Grand Rewrite", "Rust"/"Python"/"JavaScript", "karma".
 */
export const UI_STRINGS = {
  fr: {
    skipLink: "aller au jeu",
    activityBar: {
      ariaActes: "Actes",
      acte1: "acte i — solo dev",
      acte2: "acte ii — open source",
      actesIIIIV: "actes iii–iv — verrouillés",
      acteV: "acte v — verrouillé",
      locked: "verrouillé",
      grandRewrite: "grand rewrite",
      grandRewriteUnavailable: "grand rewrite — indisponible",
      workerActive: "worker actif",
      workerInactive: "worker inactif",
    },
    bottomPanel: {
      bugsActive: (bugsCount: number, pct: number) =>
        `${bugsCount} bugs actifs · −${pct} % production`,
      refactorInProgress: "refactor en cours — écriture et debug bloqués",
      noProblems: "aucun problème",
    },
    coffeeButton: {
      drink: "Boire un café",
      buffActive: (mult: number, seconds: number) => `Buff actif ×${mult} — ${seconds}s`,
    },
    debtIndicator: {
      ariaLabel: "Production perdue à cause de la dette technique",
    },
    editorView: {
      hint: "espace ou clic",
      debug: "Debug",
      creditPrefix: "extraits de code inspirés de",
      creditSuffix: "— voir THIRD_PARTY_NOTICES.md",
    },
    explorerPanel: {
      ariaExplorer: "Explorateur de fichiers",
      objectives: "Objectifs",
      nextUnlock: (label: string) => `Prochain déblocage : ${label}`,
      progressTowards: (label: string) => `Progression vers ${label}`,
      endOfAct1: (loc: string, seuil: number) => `Fin de l'Acte I : ${loc} / ${seuil} LoC`,
      progressEndAct1: "Progression vers la fin de l'Acte I",
      grandRewriteAvailableAria: "Grand Rewrite disponible",
      grandRewriteClickHint: "disponible — cliquer pour ouvrir",
      progressTowardsRewrite: "Progression vers le Grand Rewrite",
      availableFromAct2: "disponible dès l'Acte II",
    },
    grandRewriteModal: {
      overtitle: "Prestige 1 · Grand Rewrite",
      title: "grand rewrite",
      paragraph:
        "Choisis l'archétype de langage de la prochaine run. Tes LoC totales sont converties en Karma, puis les compteurs de cette run repartent à zéro.",
      legend: "Langage de la prochaine run",
      chosenTag: "choisi",
      cancel: "annuler",
      confirm: "confirmer le rewrite",
      effectProd: "prod",
      effectBugs: "bugs",
      effectDebt: "dette",
    },
    npmInstallClaim: {
      claimed: "récupérée",
    },
    projectPanel: {
      ariaLabel: "Générateurs et dette technique",
      generators: "Générateurs",
      upgrades: "Améliorations",
      technicalDebt: "Dette technique",
    },
    refactorButton: {
      inProgressSuffix: " — en cours…",
    },
    statsHeader: {
      openBugs: "Bugs ouverts",
      raw: "brut",
      debt: "dette",
    },
    statusBar: {
      debt: "dette",
      act: "acte",
    },
    titleBar: {
      exportSave: "exporter la sauvegarde",
      importFile: "importer un fichier…",
      orPasteExport: "ou coller l'export :",
      importBtn: "importer",
      reduceMotion: "réduire les animations",
      numberNotation: "notation des nombres :",
      notationInteger: "Entier",
      notationCompact: "Compact",
      notationScientific: "Scientifique",
      notationHex: "Hexadécimal",
      languageLabel: "langue :",
      resetGame: "réinitialiser la partie",
      resetConfirm: "Réinitialiser la partie ? Cette action efface la progression actuelle.",
      act: "acte",
      branch1: "acte-1/solo-dev",
      branch2: "acte-2/open-source",
    },
    upgradeCard: {
      owned: "possédée",
    },
    gameStore: {
      actTwoTransition: "transition — Acte II : open source. Le repo est public.",
      saveDone: "sauvegarde effectuée",
      loadErrorPrefix: "échec de chargement de sauvegarde : ",
      grandRewriteLog: (langue: string) => `grand rewrite — nouvelle run en ${langue}`,
      gameReset: "partie réinitialisée",
    },
  },
  en: {
    skipLink: "skip to game",
    activityBar: {
      ariaActes: "Acts",
      acte1: "act i — solo dev",
      acte2: "act ii — open source",
      actesIIIIV: "acts iii–iv — locked",
      acteV: "act v — locked",
      locked: "locked",
      grandRewrite: "grand rewrite",
      grandRewriteUnavailable: "grand rewrite — unavailable",
      workerActive: "worker active",
      workerInactive: "worker inactive",
    },
    bottomPanel: {
      bugsActive: (bugsCount: number, pct: number) =>
        `${bugsCount} active bugs · −${pct}% production`,
      refactorInProgress: "refactor in progress — writing and debugging blocked",
      noProblems: "no problems",
    },
    coffeeButton: {
      drink: "Drink a coffee",
      buffActive: (mult: number, seconds: number) => `Buff active ×${mult} — ${seconds}s`,
    },
    debtIndicator: {
      ariaLabel: "Production lost to technical debt",
    },
    editorView: {
      hint: "space or click",
      debug: "Debug",
      creditPrefix: "code excerpts inspired by",
      creditSuffix: "— see THIRD_PARTY_NOTICES.md",
    },
    explorerPanel: {
      ariaExplorer: "File explorer",
      objectives: "Objectives",
      nextUnlock: (label: string) => `Next unlock: ${label}`,
      progressTowards: (label: string) => `Progress towards ${label}`,
      endOfAct1: (loc: string, seuil: number) => `End of Act I: ${loc} / ${seuil} LoC`,
      progressEndAct1: "Progress towards the end of Act I",
      grandRewriteAvailableAria: "Grand Rewrite available",
      grandRewriteClickHint: "available — click to open",
      progressTowardsRewrite: "Progress towards the Grand Rewrite",
      availableFromAct2: "available from Act II",
    },
    grandRewriteModal: {
      overtitle: "Prestige 1 · Grand Rewrite",
      title: "grand rewrite",
      paragraph:
        "Choose the language archetype for the next run. Your total LoC is converted into Karma, then this run's counters go back to zero.",
      legend: "Language for the next run",
      chosenTag: "chosen",
      cancel: "cancel",
      confirm: "confirm the rewrite",
      effectProd: "prod",
      effectBugs: "bugs",
      effectDebt: "debt",
    },
    npmInstallClaim: {
      claimed: "claimed",
    },
    projectPanel: {
      ariaLabel: "Generators and technical debt",
      generators: "Generators",
      upgrades: "Upgrades",
      technicalDebt: "Technical debt",
    },
    refactorButton: {
      inProgressSuffix: " — in progress…",
    },
    statsHeader: {
      openBugs: "Open bugs",
      raw: "raw",
      debt: "debt",
    },
    statusBar: {
      debt: "debt",
      act: "act",
    },
    titleBar: {
      exportSave: "export save",
      importFile: "import a file…",
      orPasteExport: "or paste the export:",
      importBtn: "import",
      reduceMotion: "reduce animations",
      numberNotation: "number notation:",
      notationInteger: "Integer",
      notationCompact: "Compact",
      notationScientific: "Scientific",
      notationHex: "Hexadecimal",
      languageLabel: "language:",
      resetGame: "reset game",
      resetConfirm: "Reset the game? This action erases your current progress.",
      act: "act",
      branch1: "act-1/solo-dev",
      branch2: "act-2/open-source",
    },
    upgradeCard: {
      owned: "owned",
    },
    gameStore: {
      actTwoTransition: "transition — Act II: open source. The repo is public.",
      saveDone: "save completed",
      loadErrorPrefix: "failed to load save: ",
      grandRewriteLog: (langue: string) => `grand rewrite — new run in ${langue}`,
      gameReset: "game reset",
    },
  },
} as const satisfies Record<Locale, unknown>;
