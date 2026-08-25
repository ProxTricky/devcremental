import type { UpgradeId } from "../engine/constants";
import {
  AUTO_COMPLETE_TAUX,
  TESTS_AUTO_MULT_COEF_DETTE,
  WORKS_ON_MY_MACHINE_MULT_IMPACT_BUG,
} from "../engine/constants";

/**
 * Libellés fonctionnels neutres des 4 upgrades intra-run
 * (docs/design/upgrades-acte-1-2.md §4/§5). PAS du flavor text : les noms
 * définitifs et les blagues sont une tâche en attente pour content-writer
 * (même statut que langueLabels.ts, kanban du projet). Ici, uniquement les
 * noms de travail donnés par la spec §5 et un effet mécanique chiffré par
 * upgrade, repris tel quel de §3/§4 — jamais recalculé côté composant.
 */
export const UPGRADE_LABELS: Record<UpgradeId, string> = {
  autoComplete: "Auto-complétion",
  worksOnMyMachine: "Ça marche sur ma machine",
  testsAutomatises: "Tests automatisés",
};

export const UPGRADE_EFFECT: Record<UpgradeId, string> = {
  autoComplete: `+${AUTO_COMPLETE_TAUX} LoC/s passif, sans clic ni générateur.`,
  worksOnMyMachine: `Pénalité de production par bug réduite de moitié (×${WORKS_ON_MY_MACHINE_MULT_IMPACT_BUG}) — le plancher passe de 40 à 80 bugs actifs.`,
  testsAutomatises: `Accumulation de dette technique ralentie de 30 % (×${TESTS_AUTO_MULT_COEF_DETTE}).`,
};

/**
 * U4 "npm install" — hors `UPGRADE_IDS`/`UPGRADES` (constants.ts) : réclamation
 * gratuite, pas un achat en LoC (§4.4). Nom de travail spec §5. Description
 * neutre du trade-off ; les deux chiffres exacts (`NPM_INSTALL_BURST_LOC` en
 * gain, `NPM_INSTALL_BURST_DETTE` en coût) sont affichés séparément par
 * `NpmInstallClaim.svelte`, chacun dans sa couleur sémantique (§1.4) — jamais
 * réécrits ici pour ne pas dupliquer la source de vérité chiffrée.
 */
export const NPM_INSTALL_LABEL = "Installer une dépendance";
export const NPM_INSTALL_EFFECT =
  "Gain instantané massif, payé en dette immédiate. Une seule fois par run.";
