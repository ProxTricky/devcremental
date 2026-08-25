import Decimal from "break_eternity.js";
import { DEFAULT_RNG_SEED, type GeneratorId, type LangueId } from "../engine/constants";
import type { GameState } from "../engine/types";

export const SAVE_KEY = "devcremental-save";

/**
 * Format de sauvegarde v1 (Acte I). Champ `version` explicite dès le début
 * (CLAUDE.md "Sauvegarde") pour permettre des migrations futures, même si aucune
 * n'existe encore — v1 est le tout premier format jamais publié.
 * Les Decimal sont sérialisés en string (round-trip exact via Decimal.toString /
 * `new Decimal(string)`), pas en number : au-delà d'~1e15 un number JS perdrait
 * de la précision silencieusement.
 */
export interface SaveDataV1 {
  version: 1;
  loc: string;
  locTotal: string;
  bugs: number;
  cafeStock: number;
  cafeBuffRemaining: number;
  generators: Record<GeneratorId, number>;
  /** Acte-2 open-source §3 : ajoutés au format v1 dès maintenant (pas encore de
   * joueurs réels en Acte I/II) pour éviter une migration de schéma au moment où
   * l'Acte II sera codé. */
  acte: number;
  stars: string;
  /** Dette-technique-grand-rewrite.md §1/§2/§3/§4 : ajoutés au format v1 dès
   * maintenant, même raison que ci-dessus — aucun format v1 publié n'existe
   * encore sans eux, `deserializeState` reste tolérant pour les vieilles saves
   * de dev locales (défauts ci-dessous). */
  dette: string;
  refactorActif: boolean;
  karmaRewrite: string;
  langueActive: LangueId;
  rngSeed: number;
  /** Upgrades-acte-1-2.md §2 : ajoutés au format v1 dès maintenant, même raison
   * que les champs dette/rewrite ci-dessus (aucun format v1 publié n'existe
   * encore sans eux) — `deserializeState` reste tolérant pour les vieilles saves
   * de dev locales (fallback `false` ci-dessous, identique à createInitialState()). */
  upgrades: {
    autoComplete: boolean;
    worksOnMyMachine: boolean;
    testsAutomatises: boolean;
    npmInstallClaimed: boolean;
  };
}

export function serializeState(state: GameState): SaveDataV1 {
  return {
    version: 1,
    loc: state.loc.toString(),
    locTotal: state.locTotal.toString(),
    bugs: state.bugs,
    cafeStock: state.cafeStock,
    cafeBuffRemaining: state.cafeBuffRemaining,
    generators: { ...state.generators },
    acte: state.acte,
    stars: state.stars.toString(),
    dette: state.dette.toString(),
    refactorActif: state.refactorActif,
    karmaRewrite: state.karmaRewrite.toString(),
    langueActive: state.langueActive,
    rngSeed: state.rngSeed,
    upgrades: { ...state.upgrades },
  };
}

export function deserializeState(data: SaveDataV1): GameState {
  return {
    version: 1,
    loc: new Decimal(data.loc),
    locTotal: new Decimal(data.locTotal),
    bugs: data.bugs,
    cafeStock: data.cafeStock,
    cafeBuffRemaining: data.cafeBuffRemaining,
    generators: { ...data.generators },
    // Tolérant aux saves locales de dev antérieures à ces champs (aucun format
    // publié n'existait encore sans eux) : défaut Acte I / 0 étoile plutôt qu'un
    // crash au chargement.
    acte: data.acte ?? 1,
    stars: new Decimal(data.stars ?? "0"),
    // Même tolérance pour les champs Dette Technique / Grand Rewrite : défauts
    // identiques à createInitialState() (dette 0, pas de refactor en cours,
    // aucun Karma, archétype 'none', seed par défaut).
    dette: new Decimal(data.dette ?? "0"),
    refactorActif: data.refactorActif ?? false,
    karmaRewrite: new Decimal(data.karmaRewrite ?? "0"),
    langueActive: data.langueActive ?? "none",
    rngSeed: data.rngSeed ?? DEFAULT_RNG_SEED,
    // Même tolérance pour les 4 upgrades (upgrades-acte-1-2.md §2) : défauts
    // `false`, identiques à createInitialState().
    upgrades: {
      autoComplete: data.upgrades?.autoComplete ?? false,
      worksOnMyMachine: data.upgrades?.worksOnMyMachine ?? false,
      testsAutomatises: data.upgrades?.testsAutomatises ?? false,
      npmInstallClaimed: data.upgrades?.npmInstallClaimed ?? false,
    },
  };
}

/**
 * Point d'entrée unique des migrations. v1 est le premier format qui ait jamais
 * existé : il n'y a donc rien à migrer aujourd'hui, seulement un rejet explicite
 * des versions inconnues (frontière de confiance : un export base64 peut avoir
 * été corrompu ou venir d'une version future). Quand un format v2 apparaîtra,
 * ajouter un `case 1: return migrateV1ToV2(raw)` ici plutôt que de réécrire cette
 * fonction — c'est le point d'extension prévu.
 */
function migrate(raw: unknown): GameState {
  if (typeof raw !== "object" || raw === null || !("version" in raw)) {
    throw new Error("Sauvegarde invalide : format non reconnaissable.");
  }
  const version = (raw as { version: unknown }).version;
  if (version === 1) {
    return deserializeState(raw as SaveDataV1);
  }
  throw new Error(
    `Sauvegarde invalide : version ${String(version)} inconnue (aucune migration disponible).`,
  );
}

/**
 * Export/import base64 (CLAUDE.md "Sauvegarde") : le localStorage se fait
 * purger, l'export manuel est le seul filet de sécurité fiable.
 */
export function encodeSave(state: GameState): string {
  return btoa(JSON.stringify(serializeState(state)));
}

export function decodeSave(encoded: string): GameState {
  let raw: unknown;
  try {
    raw = JSON.parse(atob(encoded));
  } catch {
    throw new Error("Sauvegarde invalide : impossible de décoder le base64/JSON.");
  }
  return migrate(raw);
}

// Les helpers localStorage vivent dans ./localStorage.ts, pas ici : `localStorage`
// n'existe que sur `Window` (spec WHATWG Web Storage), pas dans un DedicatedWorker
// — ce module doit rester importable tel quel depuis src/worker/gameWorker.ts.
