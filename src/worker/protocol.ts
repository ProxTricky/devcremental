import type { GeneratorId, LangueId, UpgradeId } from "../engine/constants";

/**
 * Contrat postMessage entre le thread principal et le Worker (CLAUDE.md "Boucle de
 * jeu"). Types partagés, non dupliqués : le thread principal comme le worker
 * importent ce fichier plutôt que de redéclarer la forme des messages localement.
 */
export type InboundMessage =
  | { type: "clickCode" }
  | { type: "clickDebug" }
  | { type: "drinkCoffee" }
  | { type: "buyGenerator"; id: GeneratorId }
  // Progression-offline.md §5 point 3 : `offlineSeconds`, quand présent et > 0,
  // porte le delta déjà clampé (§2) — jamais une valeur brute non clampée, le
  // Worker ne re-clamp jamais.
  | { type: "loadSave"; encoded: string; offlineSeconds?: number }
  | { type: "requestSave" }
  // Dette-technique-grand-rewrite.md §2.1 : action "à maintenir" (start/stop),
  // pas un clic instantané comme clickCode/clickDebug ci-dessus.
  | { type: "refactorStart" }
  | { type: "refactorStop" }
  // §3 : déclenchement du Grand Rewrite, avec le choix d'archétype de la
  // nouvelle run (§3.3 point 4).
  | { type: "grandRewrite"; langue: LangueId }
  // Upgrades-acte-1-2.md §2 : achat en LoC (U1-U3, action instantanée comme
  // buyGenerator) et §4.4 : réclamation gratuite (U4, gatée sur state.acte >= 2).
  | { type: "buyUpgrade"; id: UpgradeId }
  | { type: "claimNpmInstall" };

export type OutboundMessage =
  | { type: "state"; save: string }
  | { type: "saveData"; encoded: string }
  | { type: "loadError"; message: string };
