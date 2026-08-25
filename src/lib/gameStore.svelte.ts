import type Decimal from "break_eternity.js";
import {
  GENERATOR_IDS,
  type GeneratorId,
  type LangueId,
  type UpgradeId,
} from "../engine/constants";
import {
  generatorCost,
  generatorRate,
  isUnlocked,
  isUpgradeUnlocked,
  unlockThreshold,
  upgradeCost,
} from "../engine/formulas";
import { createInitialState } from "../engine/state";
import type { GameState } from "../engine/types";
import {
  computeOfflineDeltaSeconds,
  loadFromLocalStorage,
  loadLastActiveAt,
  saveLastActiveAt,
  saveToLocalStorage,
} from "../save/localStorage";
import { decodeSave, encodeSave, SAVE_KEY } from "../save/save";
import type { InboundMessage, OutboundMessage } from "../worker/protocol";

export const AUTOSAVE_INTERVAL_MS = 30_000;
/** Fréquence de rafraîchissement de `clockNow` (§3.9 : compte à rebours
 * autosave, temps de run) — horloge UI, indépendante du tick worker 10/s. */
const CLOCK_INTERVAL_MS = 1_000;

/** OUTPUT du panneau bas (visual-identity.md §3.7d) : uniquement des événements
 * réellement observés (autosave effective, transition d'acte, Grand Rewrite,
 * erreur de chargement) — jamais un événement fictif (pas de "gains hors
 * ligne"/"migration de save" tant que le moteur ne les expose pas). */
export interface LogEntry {
  id: number;
  text: string;
  level: "info" | "warn" | "error";
}

/** Vue affichable d'un générateur — calculée à partir des fonctions pures de
 * src/engine (jamais réimplémentées ici, cf. CLAUDE.md "tu ne dupliques jamais
 * une formule de coût/production côté composant"). Les composants ne consomment
 * que cette vue, jamais les formules directement. */
export interface GeneratorView {
  id: GeneratorId;
  possedes: number;
  cost: Decimal;
  production: Decimal;
  unlocked: boolean;
  affordable: boolean;
}

/** Vue affichable d'une upgrade U1-U3 (achat unique, booléen possédé/non-possédé
 * — pas de `possedes`/`production` comme un générateur, cf.
 * upgrades-acte-1-2.md §2). Même rôle que `GeneratorView` : calculée depuis les
 * fonctions pures de src/engine, jamais réimplémentée dans un composant. */
export interface UpgradeView {
  id: UpgradeId;
  cost: Decimal;
  unlocked: boolean;
  affordable: boolean;
  owned: boolean;
}

/**
 * Pont unique entre le thread principal (Svelte, runes) et le Worker qui possède
 * l'état canonique du jeu (CLAUDE.md "Boucle de jeu"). Instancié une seule fois
 * (singleton exporté en bas de fichier) : jamais un Worker par composant.
 *
 * Le Worker reste la seule source de vérité pour `state` ; ce store ne fait que
 * décoder les messages `OutboundMessage` et les refléter dans des champs `$state`
 * finement mis à jour (propriété par propriété, pas de remplacement d'objet en
 * bloc) pour que chaque binding de composant ne se ré-exécute que si la valeur
 * qu'il lit a réellement changé.
 */
class GameStore {
  state = $state<GameState>(createInitialState());

  /** Compteur UI-only incrémenté à chaque clic "Écrire du code", indépendant du
   * tick worker (~100ms) : c'est ce que Terminal.svelte observe pour faire
   * défiler exactement une ligne par clic, sans attendre l'aller-retour worker. */
  codeClickCount = $state(0);

  /** Horodatages UI-only (pas de donnée de jeu, jamais sauvegardés) exposés pour
   * StatusBar/ActivityBar (visual-identity.md §3.5/§3.9) : dernier message
   * "state" reçu (liveness du worker, tick 10/s), dernière sauvegarde effective
   * (compte à rebours autosave), dernier Grand Rewrite déclenché depuis cette
   * session (temps de run affiché — n'est pas persisté par le moteur : approxime
   * "depuis le chargement de la page ou le dernier Rewrite de cette session"). */
  lastTickAt = $state(Date.now());
  lastAutosaveAt = $state(Date.now());
  runStartAt = $state(Date.now());
  /** Horloge UI 1 Hz, lue par StatusBar/ActivityBar pour recalculer des
   * countdowns/liveness dérivés des horodatages ci-dessus sans que chaque
   * composant maintienne son propre `setInterval`. */
  clockNow = $state(Date.now());

  eventLog = $state<LogEntry[]>([]);
  #logId = 0;
  #initialized = false;

  #worker: Worker;

  constructor() {
    this.#worker = new Worker(
      new URL("../worker/gameWorker.ts", import.meta.url),
      { type: "module" },
    );
    this.#worker.onmessage = (event: MessageEvent<OutboundMessage>) => {
      this.#handleMessage(event.data);
    };

    const saved = loadFromLocalStorage();
    if (saved) {
      this.#applyDecoded(saved);
      // Progression-offline.md §2 : delta clampé calculé ici (thread principal,
      // seule source de vérité du plafond) avant tout envoi au Worker.
      const offlineSeconds = computeOfflineDeltaSeconds(Date.now(), loadLastActiveAt());
      this.#post({ type: "loadSave", encoded: encodeSave(saved), offlineSeconds });
    }
    this.#initialized = true;

    if (typeof window !== "undefined") {
      setInterval(() => this.#post({ type: "requestSave" }), AUTOSAVE_INTERVAL_MS);
      setInterval(() => (this.clockNow = Date.now()), CLOCK_INTERVAL_MS);
      window.addEventListener("beforeunload", () => {
        // Progression-offline.md §1.2 point 1 : synchrone, sans attendre le
        // round-trip requestSave -> saveData (rien ne garantit qu'il se termine
        // avant le déchargement de la page).
        saveLastActiveAt();
        this.#post({ type: "requestSave" });
      });
    }
  }

  #post(msg: InboundMessage): void {
    this.#worker.postMessage(msg);
  }

  #pushLog(text: string, level: LogEntry["level"] = "info"): void {
    this.eventLog.push({ id: this.#logId++, text, level });
    if (this.eventLog.length > 30) this.eventLog.shift();
  }

  #applyDecoded(decoded: GameState): void {
    const previousActe = this.state.acte;
    this.state.loc = decoded.loc;
    this.state.locTotal = decoded.locTotal;
    this.state.bugs = decoded.bugs;
    this.state.cafeStock = decoded.cafeStock;
    this.state.cafeBuffRemaining = decoded.cafeBuffRemaining;
    for (const id of GENERATOR_IDS) {
      this.state.generators[id] = decoded.generators[id];
    }
    this.state.acte = decoded.acte;
    this.state.stars = decoded.stars;
    this.state.dette = decoded.dette;
    this.state.refactorActif = decoded.refactorActif;
    this.state.karmaRewrite = decoded.karmaRewrite;
    this.state.langueActive = decoded.langueActive;
    this.state.rngSeed = decoded.rngSeed;
    this.state.upgrades = { ...decoded.upgrades };

    // Transition Acte I -> II (acte-2-open-source.md §1-2) : événement réel,
    // journalisé une seule fois. Ignoré au tout premier `#applyDecoded` (chargement
    // d'une save déjà en Acte II) — ce n'est pas une transition qui vient de se
    // produire, juste l'état initial.
    if (this.#initialized && previousActe === 1 && decoded.acte === 2) {
      this.#pushLog("transition — Acte II : open source. Le repo est public.");
    }
  }

  #handleMessage(msg: OutboundMessage): void {
    switch (msg.type) {
      case "state":
        this.#applyDecoded(decodeSave(msg.save));
        this.lastTickAt = Date.now();
        break;
      case "saveData":
        saveToLocalStorage(decodeSave(msg.encoded));
        // Progression-offline.md §1.2 point 2 : filet de sécurité si
        // `beforeunload` ne se déclenche jamais.
        saveLastActiveAt();
        this.lastAutosaveAt = Date.now();
        this.#pushLog("sauvegarde effectuée");
        break;
      case "loadError":
        // Sauvegarde locale corrompue/illisible : on continue sur l'état courant
        // plutôt que de bloquer le joueur, cf. localStorage.ts (pas de retry ici,
        // c'est un event isolé sur un import explicite).
        console.error("[devcremental] échec de chargement de sauvegarde:", msg.message);
        this.#pushLog(`échec de chargement de sauvegarde : ${msg.message}`, "error");
        break;
    }
  }

  clickCode(): void {
    this.codeClickCount += 1;
    this.#post({ type: "clickCode" });
  }

  clickDebug(): void {
    this.#post({ type: "clickDebug" });
  }

  drinkCoffee(): void {
    this.#post({ type: "drinkCoffee" });
  }

  buyGenerator(id: GeneratorId): void {
    this.#post({ type: "buyGenerator", id });
  }

  /** Dette-technique-grand-rewrite.md §2.1 : action à maintenir (start/stop),
   * pas un clic instantané. Câblage worker/store uniquement — pas d'UI ici
   * (passe ui-engineer séparée). */
  startRefactor(): void {
    this.#post({ type: "refactorStart" });
  }

  stopRefactor(): void {
    this.#post({ type: "refactorStop" });
  }

  /** §3 : déclenche le Grand Rewrite avec l'archétype choisi pour la nouvelle run. */
  triggerGrandRewrite(langue: LangueId): void {
    this.#post({ type: "grandRewrite", langue });
    this.runStartAt = Date.now();
    this.#pushLog(`grand rewrite — nouvelle run en ${langue}`);
  }

  /** Upgrades-acte-1-2.md §2 : achat en LoC d'une des 3 upgrades U1-U3.
   * Câblage worker/store uniquement — pas d'UI ici (passe ui-engineer séparée). */
  buyUpgrade(id: UpgradeId): void {
    this.#post({ type: "buyUpgrade", id });
  }

  /** §4.4 : réclamation gratuite de l'upgrade U4 "npm install". */
  claimNpmInstall(): void {
    this.#post({ type: "claimNpmInstall" });
  }

  /** TitleBar "File" (visual-identity.md §3.4) : export base64 réel de la save
   * courante — réutilise `encodeSave` (src/save/save.ts), jamais réimplémenté. */
  exportSave(): string {
    return encodeSave(this.state);
  }

  /** TitleBar "File" : import d'un export base64, applique immédiatement au
   * state affiché et au worker. Propage toute erreur de décodage à l'appelant
   * (UI) plutôt que de l'avaler silencieusement. */
  importSave(encoded: string): void {
    const decoded = decodeSave(encoded);
    this.#applyDecoded(decoded);
    this.#post({ type: "loadSave", encoded });
  }

  /** TitleBar "Edit" : réinitialise une nouvelle partie (repart de
   * `createInitialState`, efface la save locale). Réutilise le message
   * `loadSave` existant plutôt que d'étendre le protocole worker pour ça. */
  resetGame(): void {
    const initial = createInitialState();
    const encoded = encodeSave(initial);
    this.#applyDecoded(initial);
    this.#post({ type: "loadSave", encoded });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SAVE_KEY);
    }
    this.#pushLog("partie réinitialisée");
  }

  /** Vue d'un générateur pour l'affichage — cf. GeneratorView ci-dessus. */
  generatorView(id: GeneratorId): GeneratorView {
    const possedes = this.state.generators[id];
    const cost = generatorCost(id, possedes);
    return {
      id,
      possedes,
      cost,
      production: generatorRate(id, possedes),
      unlocked: isUnlocked(id, this.state.locTotal),
      affordable: this.state.loc.gte(cost),
    };
  }

  unlockThresholdOf(id: GeneratorId): Decimal {
    return unlockThreshold(id);
  }

  /** Vue d'une upgrade U1-U3 pour l'affichage — cf. UpgradeView ci-dessus. */
  upgradeView(id: UpgradeId): UpgradeView {
    const cost = upgradeCost(id);
    return {
      id,
      cost,
      unlocked: isUpgradeUnlocked(id, this.state.locTotal),
      affordable: this.state.loc.gte(cost),
      owned: this.state.upgrades[id],
    };
  }

  get cafeBuffActive(): boolean {
    return this.state.cafeBuffRemaining > 0;
  }
}

export const gameStore = new GameStore();
