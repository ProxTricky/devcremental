import type { GeneratorId, LangueId, UpgradeId } from "../engine/constants";

/**
 * Flavor text d'Acte I (générateurs, Café) et du système transverse
 * Dette / Refactoring / Grand Rewrite — écrit par content-writer (2026-08-04),
 * PLAN.md §6 (l'humour est le différenciateur du jeu : jamais de description
 * neutre).
 *
 * Complète `generatorLabels.ts` et `langueLabels.ts` (noms bruts + effets
 * mécaniques chiffrés, repris tels quels des specs normatives de game-designer) :
 * ici, uniquement du contenu éditorial. Aucune valeur numérique n'est écrite dans
 * ces textes — les chiffres (coûts, ×3, 20 s, ×0.80, ×1.30, nombre de Stars…)
 * viennent de `engine/constants.ts` / `langueLabels.ts` et sont composés par
 * l'UI, pour qu'un rééquilibrage ne rende jamais un texte menteur.
 *
 * Câblage prévu (passe ui-engineer, pas faite ici) :
 * GeneratorCard.svelte → GENERATOR_FLAVOR[id], CoffeeButton.svelte → CAFE_FLAVOR,
 * RefactorButton.svelte → REFACTOR_FLAVOR (+ REFACTOR_FLAVOR_NAME),
 * GrandRewriteModal.svelte → LANGUE_FLAVOR[id],
 * App.svelte → publicationOpenSourceFlavor(starsAffichees).
 */
export interface FlavorEntry {
  /** 1–2 phrases, affichées sous le nom du générateur / du bouton. */
  description: string;
  /** Variante longue pour tooltip ou journal — optionnelle. */
  tooltip?: string;
}

export const GENERATOR_FLAVOR: Record<GeneratorId, FlavorEntry> = {
  copierColler: {
    description:
      "Ctrl+C sur la première réponse, Ctrl+V dans ton fichier. Tu n'as lu ni la question, ni les commentaires qui disent que c'est dangereux.",
    tooltip:
      "Le réflexe fondateur du métier. Produit peu, mais produit tout de suite et sans réfléchir — c'est exactement pour ça que tu l'achètes en premier. Le code vient de quelqu'un qui avait beaucoup de réputation, donc il ne peut rien arriver.",
  },
  stagiaire: {
    description:
      "Trois jours pour installer son environnement, puis il push. Il ne demande jamais pourquoi, ce qui va poser problème plus tard.",
    tooltip:
      "Ton premier vrai palier de délégation : tu arrêtes de tout taper toi-même. En échange, tu découvres que relire du code est un métier à part entière, et que tu ne l'as pas appris non plus.",
  },
  rubberDuck: {
    description:
      "Tu lui expliques ton bug à voix haute. À la troisième phrase tu as trouvé la réponse tout seul, et lui n'a même pas cligné des yeux.",
    tooltip:
      "Le seul générateur d'Acte I qui fait deux boulots : il écrit du code et il corrige des bugs passivement — plus qu'il n'en crée lui-même. C'est le membre de l'équipe au meilleur ratio, et c'est un canard en plastique. Ne creuse pas.",
  },
};

export const CAFE_FLAVOR: FlavorEntry = {
  description:
    "Ta seule dépendance sans alternative. Multiplie ce que rapporte chaque clic, le temps que ça dure.",
  tooltip:
    "N'accélère que toi : les générateurs ne boivent pas. En reboire pendant qu'un café fait déjà effet relance le chrono sans cumuler l'effet — ton foie a une limite, ta réserve aussi, et elle se remplit à son rythme, pas au tien.",
};

/**
 * Nom éditorial de l'action de refactoring
 * (`dette-technique-grand-rewrite.md` §2.1, action à maintenir).
 * Alternative proposée au libellé mécanique neutre `REFACTOR_LABEL`
 * (`langueLabels.ts`, propriété game-designer/ui-engineer) — c'est à ui-engineer
 * de choisir lequel des deux il affiche sur le bouton ; les deux désignent
 * exactement la même action.
 */
export const REFACTOR_FLAVOR_NAME = "Refactorer pour de vrai";

export const REFACTOR_FLAVOR: FlavorEntry = {
  description:
    "Tant que tu tiens le bouton, la dette recule et tu n'écris pas une ligne. C'est précisément pour ça que ça n'arrive jamais dans un vrai projet.",
  tooltip:
    "Le seul travail dont le résultat se mesure à ce qui n'arrive pas. Pendant que tu refactores, tu ne peux ni écrire de code ni corriger un bug — il n'y a rien à montrer en fin de journée. Les générateurs, eux, continuent d'empiler du neuf par-dessus ce que tu es en train de ranger : personne ne leur a dit qu'on faisait le ménage.",
};

/**
 * Archétypes de langage du Grand Rewrite (`dette-technique-grand-rewrite.md` §4).
 * Complément éditorial de `LANGUE_EFFECT` (`langueLabels.ts`), qui porte déjà les
 * multiplicateurs chiffrés — ces textes disent le trade-off vécu, jamais les
 * valeurs, pour ne pas mentir après un recalibrage.
 */
export const LANGUE_FLAVOR: Record<Exclude<LangueId, "none">, FlavorEntry> = {
  rust: {
    description:
      "Le compilateur refuse ton code jusqu'à ce qu'il soit correct. Tu vas le détester pendant des heures, puis découvrir qu'il avait raison à chaque fois.",
    tooltip:
      "Tu passes plus de temps à convaincre le compilateur qu'à produire, et en échange tu arrêtes de debugger : ce qui compile marche, et la dette met bien plus longtemps à devenir ton problème. Le prix, c'est le prototypage — l'idée bête que tu voulais tester en cinq minutes te prend l'après-midi. En contrepartie, tu ne réécriras pas ce module dans six mois.",
  },
  python: {
    description:
      "Tu écris la fonction en trois lignes, tu es fier, tu passes à autre chose. Elle plantera plus tard, sur un type auquel tu n'avais pas pensé.",
    tooltip:
      "Le langage qui te laisse tout faire, y compris ce que tu ne voulais pas faire. Tu produis nettement plus vite que partout ailleurs, et tu découvres tes erreurs à l'endroit le plus cher : à l'exécution, pendant que quelqu'un s'en sert. Ça marchait sur le jeu de données de test, qui contenait trois lignes et aucune valeur nulle.",
  },
  javascript: {
    description:
      "Un tick tout sort tout seul, le suivant plus rien ne bouge — même code, même machine, même toi. Le seul archétype où le hasard fait ouvertement partie du contrat.",
    tooltip:
      "Ni plus buggé, ni plus endetté que les autres : juste imprévisible. Ta production change d'un tick à l'autre sans que tu aies touché à quoi que ce soit, exactement comme l'écosystème dans lequel elle vit. En moyenne tu t'en sors mieux qu'ailleurs — et une moyenne n'a jamais rassuré personne un vendredi soir.",
  },
};

/**
 * Événement one-shot `publication_open_source` (`acte-2-open-source.md` §2) :
 * message de bascule Acte I → Acte II, affiché dans le panneau d'objectifs tant
 * que `state.acte >= 2`.
 *
 * @param starsAffichees Nombre de Stars déjà formaté par l'UI (`formatNumber`) —
 *   le texte ne fige aucun chiffre et ne formate rien lui-même.
 */
export function publicationOpenSourceFlavor(starsAffichees: string): FlavorEntry {
  return {
    description: `Repo public. Le README dit encore « TODO », le dernier commit s'appelle « wip », et personne ne lira jamais la moitié de ces fichiers. Des inconnus ont quand même cliqué sur l'étoile : ${starsAffichees} ⭐ Stars.`,
    tooltip:
      "Publier, ce n'est pas finir : c'est accepter que du code écrit à deux heures du matin soit lisible par des gens qui ne demanderont jamais pourquoi tu as fait ça — mais qui ouvriront une issue le jour où ça casse chez eux. À partir de maintenant, tout ce que tu empiles a un public. Et une dette.",
  };
}

/**
 * Contenu éditorial des onglets secondaires de l'éditeur (`EditorView.svelte`,
 * `activeTab === "debt"` / `"readme"`), qui n'affichaient jusqu'ici qu'une ligne
 * de constat brut. Même patron que `publicationOpenSourceFlavor` : tous les
 * paramètres sont des valeurs **déjà formatées par l'UI** (`formatNumber`,
 * arrondis) — ce module ne lit aucun état, ne recalcule rien et ne fige aucun
 * chiffre, pour qu'un rééquilibrage ne rende jamais ces textes menteurs.
 *
 * Câblage prévu (passe ui-engineer, pas faite ici) :
 * EditorView.svelte onglet debt.log → debtLogFlavor(...),
 * EditorView.svelte onglet README.md → readmeFlavor(...).
 */

/**
 * Onglet `debt.log`. Voix : un journal auto-généré qui note, sans commentaire,
 * ce que son propre auteur a laissé passer — jamais un narrateur omniscient.
 *
 * @param dettePct Dette courante déjà formatée par l'UI (`formatNumber`).
 * @param pctPerdu Part de production perdue, déjà arrondie et formatée par l'UI
 *   (le signe % est ajouté ici, la valeur ne l'est jamais).
 * @param bugsCount Nombre de bugs actifs déjà arrondi par l'UI.
 */
export function debtLogFlavor(
  dettePct: string,
  pctPerdu: string,
  bugsCount: number,
): FlavorEntry {
  return {
    description: `[WARN] dette ${dettePct} — dernière baisse enregistrée : jamais. ${pctPerdu} % de ta production sert à faire tenir des décisions prises un soir, vite, par toi. ${bugsCount} entrées toujours ouvertes, toutes annotées « connu ».`,
    tooltip:
      "Ce fichier n'a jamais été lu en entier, et il le sait. Il ne signale pas les pannes : il enregistre patiemment tout ce qui a marché quand même, en attendant. Il tourne que tu l'ouvres ou non — c'est la seule partie du projet qui n'a jamais pris de retard.",
  };
}

/**
 * Onglet `README.md`. Volontairement cohérent avec le flavor déjà écrit dans
 * `publicationOpenSourceFlavor` ("Le README dit encore « TODO »") : le fichier
 * existe, personne ne le lit, et il n'est jamais à jour.
 *
 * @param acte Numéro d'acte courant (`state.acte`), affiché tel quel.
 * @param langueLabel Libellé de langue déjà résolu par l'UI (`LANGUE_LABELS`,
 *   ou la mention pré-Rewrite) — jamais recalculé ici.
 * @param karma Karma de Rewrite déjà formaté par l'UI (`formatNumber`).
 */
export function readmeFlavor(
  acte: number,
  langueLabel: string,
  karma: string,
): FlavorEntry {
  return {
    description: `# projet · acte ${acte} · ${langueLabel}. Installation : TODO. Contribuer : TODO. Karma de Rewrite : ${karma} — la seule ligne du fichier qui soit encore vraie, et personne ne sait ce qu'elle mesure.`,
    tooltip:
      "Un README se met à jour exactement deux fois : le jour où le dépôt est créé, et le jour où quelqu'un ouvre une issue pour dire qu'il ne marche pas. Entre les deux, il décrit fidèlement un projet qui n'existe plus depuis deux réécritures. Tu le rangeras juste avant de tout jeter, comme d'habitude.",
  };
}

/**
 * Upgrades intra-run U1–U3 (`upgrades-acte-1-2.md` §4.1–4.3). Complément
 * éditorial de `UPGRADE_LABELS` / `UPGRADE_EFFECT` (`upgradeLabels.ts`), qui
 * portent déjà les noms de travail définitifs (spec §5, non renommés ici) et les
 * effets chiffrés : ces textes disent l'arbitrage vécu, jamais les valeurs.
 *
 * Câblage prévu (passe ui-engineer, pas faite ici) :
 * UpgradeCard.svelte → UPGRADE_FLAVOR[id].
 */
export const UPGRADE_FLAVOR: Record<UpgradeId, FlavorEntry> = {
  autoComplete: {
    description:
      "Elle propose la fin de ta ligne avant que tu l'aies pensée. Tu appuies sur Tab, ça compile, tu ne relis pas — et ça continue quand tu ne tapes plus.",
    tooltip:
      "Le premier moment où du code apparaît sans que tu aies rien demandé. Ce n'est pas plus rapide que toi tick par tick : c'est juste que ça ne s'arrête jamais, y compris quand tu lèves les mains du clavier. Le jour où tu peux te lever pour aller boire un truc sans perdre ta progression, tu as arrêté de travailler et commencé à jouer.",
  },
  worksOnMyMachine: {
    description:
      "Tu n'as pas réussi à le reproduire en local, donc ce n'est pas un bug, c'est une configuration. Les bugs restent tous là — ils pèsent juste beaucoup moins lourd sur ta production.",
    tooltip:
      "Ne corrige rien, ne ralentit rien, ne nettoie rien : change simplement qui a le problème. Tu peux laisser la liste s'allonger bien plus longtemps avant que ça se voie sur ton débit, et le temps que tu ne passes plus à debugger, tu le passes à produire de quoi debugger plus tard. Le plancher existe toujours : il est juste plus loin.",
  },
  testsAutomatises: {
    description:
      "Tu écris du code dont le seul rôle est de constater que le reste marche encore. Ça n'ajoute aucune fonctionnalité, et c'est exactement pour ça que c'est la première chose qu'on saute quand c'est urgent.",
    tooltip:
      "Ne rembourse rien de ce que tu dois déjà : ralentit seulement la vitesse à laquelle tu t'endettes. Le rendement d'un test, c'est un incident qui n'a pas lieu — donc invisible, donc indéfendable en réunion, donc à acheter avant d'en avoir besoin. Achetable dès l'Acte I, où il ne sert strictement à rien, ce qui est le meilleur moment.",
  },
};

/**
 * U4 "Installer une dépendance" (`upgrades-acte-1-2.md` §4.4) — traité à part de
 * `UPGRADE_FLAVOR` parce que ce n'est pas un achat : réclamation gratuite, une
 * seule fois par run, avec un vrai arbitrage gain immédiat / dette immédiate.
 * Les deux chiffres sont affichés par le composant, jamais par ce texte.
 *
 * Câblage prévu (passe ui-engineer, pas faite ici) :
 * NpmInstallClaim.svelte → NPM_INSTALL_FLAVOR.
 */
export const NPM_INSTALL_FLAVOR: FlavorEntry = {
  description:
    "Une commande, deux secondes, et ton problème est résolu par quelqu'un que tu ne connais pas. Ce que tu gagnes arrive tout de suite ; ce que ça pèse, tu le traînes jusqu'au prochain Rewrite.",
  tooltip:
    "Le dossier qui vient d'apparaître contient plus de lignes que tout ce que tu as écrit depuis le début, et tu n'en utiliseras qu'une fonction. C'est le seul arbitrage franc du jeu : réclame tôt et le bond finance tes prochains achats pendant que la dette a encore le temps d'être absorbée ; réclame tard et tu ajoutes du poids à un projet qui n'en avait pas besoin. Une seule fois par run — après, il faut écrire les lignes toi-même.",
};
