import type { UpgradeId } from "../engine/constants";
import {
  AUTO_COMPLETE_TAUX,
  TESTS_AUTO_MULT_COEF_DETTE,
  WORKS_ON_MY_MACHINE_MULT_IMPACT_BUG,
} from "../engine/constants";
import type { Locale } from "./i18n";

/**
 * Libellés fonctionnels neutres des 4 upgrades intra-run
 * (docs/design/upgrades-acte-1-2.md §4/§5). PAS du flavor text : les noms
 * définitifs et les blagues sont une tâche en attente pour content-writer
 * (même statut que langueLabels.ts, kanban du projet). Ici, uniquement les
 * noms de travail donnés par la spec §5 et un effet mécanique chiffré par
 * upgrade, repris tel quel de §3/§4 — jamais recalculé côté composant.
 *
 * Locale-aware depuis la demande user du 2026-08-25 (i18n fr/en) — `fr`
 * copié tel quel. `en` relu par content-writer le 2026-08-25 : « Works on my
 * machine » est la formule consacrée en anglais (PLAN.md §6 la cite), elle est
 * gardée mot pour mot ; U4 garde son clin d'œil `npm install` explicite.
 */
export const UPGRADE_LABELS: Record<Locale, Record<UpgradeId, string>> = {
  fr: {
    autoComplete: "Auto-complétion",
    worksOnMyMachine: "Ça marche sur ma machine",
    testsAutomatises: "Tests automatisés",
  },
  en: {
    autoComplete: "Autocomplete",
    worksOnMyMachine: "Works on my machine",
    testsAutomatises: "Automated tests",
  },
};

export const UPGRADE_EFFECT: Record<Locale, Record<UpgradeId, string>> = {
  fr: {
    autoComplete: `+${AUTO_COMPLETE_TAUX} LoC/s passif, sans clic ni générateur.`,
    worksOnMyMachine: `Pénalité de production par bug réduite de moitié (×${WORKS_ON_MY_MACHINE_MULT_IMPACT_BUG}) — le plancher passe de 40 à 80 bugs actifs.`,
    testsAutomatises: `Accumulation de dette technique ralentie de 30 % (×${TESTS_AUTO_MULT_COEF_DETTE}).`,
  },
  en: {
    autoComplete: `+${AUTO_COMPLETE_TAUX} passive LoC/s, no click and no generator needed.`,
    worksOnMyMachine: `Production penalty per bug cut in half (×${WORKS_ON_MY_MACHINE_MULT_IMPACT_BUG}) — the floor moves from 40 to 80 active bugs.`,
    testsAutomatises: `Technical debt accumulates 30% slower (×${TESTS_AUTO_MULT_COEF_DETTE}).`,
  },
};

/**
 * U4 "npm install" — hors `UPGRADE_IDS`/`UPGRADES` (constants.ts) : réclamation
 * gratuite, pas un achat en LoC (§4.4). Nom de travail spec §5. Description
 * neutre du trade-off ; les deux chiffres exacts (`NPM_INSTALL_BURST_LOC` en
 * gain, `NPM_INSTALL_BURST_DETTE` en coût) sont affichés séparément par
 * `NpmInstallClaim.svelte`, chacun dans sa couleur sémantique (§1.4) — jamais
 * réécrits ici pour ne pas dupliquer la source de vérité chiffrée.
 */
export const NPM_INSTALL_LABEL: Record<Locale, string> = {
  fr: "Installer une dépendance",
  en: "Just npm install it",
};

export const NPM_INSTALL_EFFECT: Record<Locale, string> = {
  fr: "Gain instantané massif, payé en dette immédiate. Une seule fois par run.",
  en: "Huge instant gain, paid for in immediate debt. Once per run.",
};
