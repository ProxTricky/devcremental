import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "../engine/state";
import { OFFLINE_TIMESTAMP_KEY } from "../save/localStorage";
import { encodeSave, SAVE_KEY } from "../save/save";
import type { InboundMessage } from "../worker/protocol";

/**
 * Réf. docs/design/progression-offline.md §10 (critères d'acceptation), numéros
 * cités dans chaque `it`/`describe` (ex. "§10.13" = critère 13).
 *
 * `src/lib/gameStore.svelte.ts` instancie un singleton (`export const gameStore
 * = new GameStore()`) dès son import, qui construit un `Worker` réel et lit
 * `localStorage` — deux globals absents de l'environnement de test Node de ce
 * projet (pas de jsdom, cf. package.json/aucun vitest.config.ts). On les
 * stub donc minimalement (Worker : classe qui capture les messages postés sans
 * exécuter réellement gameWorker.ts ; localStorage/window : implémentations
 * en mémoire) puis on importe le module dynamiquement (`await import`, jamais un
 * import statique : les imports statiques sont hoistés par le moteur ES avant
 * toute affectation de `globalThis`, cf. investigation) pour obtenir une
 * instance fraîche à chaque scénario via `vi.resetModules()`.
 */

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  posted: InboundMessage[] = [];
  constructor(_url: URL, _opts?: unknown) {}
  postMessage(msg: InboundMessage): void {
    this.posted.push(msg);
  }
  terminate(): void {}
}

class FakeStorage {
  #map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.#map.has(key) ? this.#map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.#map.set(key, value);
  }
  removeItem(key: string): void {
    this.#map.delete(key);
  }
}

let lastWorkerInstance: FakeWorker | null = null;

/** Prépare un environnement isolé puis importe gameStore.svelte.ts fraîchement. */
async function freshGameStore(opts: {
  save?: string;
  lastActiveAt?: string;
  withWindow?: boolean;
}) {
  vi.resetModules();

  class CapturingFakeWorker extends FakeWorker {
    constructor(url: URL, o?: unknown) {
      super(url, o);
      lastWorkerInstance = this;
    }
  }
  (globalThis as { Worker?: unknown }).Worker = CapturingFakeWorker;

  const storage = new FakeStorage();
  if (opts.save !== undefined) storage.setItem(SAVE_KEY, opts.save);
  if (opts.lastActiveAt !== undefined) {
    storage.setItem(OFFLINE_TIMESTAMP_KEY, opts.lastActiveAt);
  }
  (globalThis as { localStorage?: unknown }).localStorage = storage;

  if (opts.withWindow) {
    const target = new EventTarget() as EventTarget & {
      localStorage: FakeStorage;
      matchMedia: (query: string) => { matches: boolean };
    };
    target.localStorage = storage;
    // settings.svelte.ts (import transitif de gameStore.svelte.ts depuis la
    // passe i18n du 2026-08-25) lit `window.matchMedia` dès l'instanciation du
    // singleton `settings` — absent de ce mock minimal jusqu'ici, jamais
    // exercé avant que gameStore importe settings.
    target.matchMedia = () => ({ matches: false });
    (globalThis as { window?: unknown }).window = target;
  } else {
    delete (globalThis as { window?: unknown }).window;
  }

  const mod = await import("./gameStore.svelte");
  const worker = lastWorkerInstance!;
  return { mod, worker, storage };
}

beforeEach(() => {
  lastWorkerInstance = null;
});

afterEach(() => {
  delete (globalThis as { Worker?: unknown }).Worker;
  delete (globalThis as { localStorage?: unknown }).localStorage;
  delete (globalThis as { window?: unknown }).window;
  vi.useRealTimers();
});

describe("critère §10.1 — pas de save existante", () => {
  it("aucun message loadSave n'est posté, aucune lecture d'OFFLINE_TIMESTAMP_KEY", async () => {
    const { worker, storage } = await freshGameStore({});
    const loadSaveMsgs = worker.posted.filter((m) => m.type === "loadSave");
    expect(loadSaveMsgs).toHaveLength(0);
    // La clé n'a jamais été lue : dans ce mock il n'y a pas d'historique d'accès,
    // mais elle n'a été ni écrite ni consommée par construction (aucune save).
    expect(storage.getItem(OFFLINE_TIMESTAMP_KEY)).toBeNull();
  });
});

describe("critère §10.2 — timestamp absent avec save existante", () => {
  it("le message loadSave est envoyé avec offlineSeconds à 0 (absent de clé)", async () => {
    const save = encodeSave(createInitialState());
    const { worker } = await freshGameStore({ save });
    const loadSaveMsgs = worker.posted.filter(
      (m): m is Extract<InboundMessage, { type: "loadSave" }> => m.type === "loadSave",
    );
    expect(loadSaveMsgs).toHaveLength(1);
    expect(loadSaveMsgs[0].offlineSeconds ?? 0).toBe(0);
  });
});

describe("critère §10.13 — importSave()/resetGame() ne transmettent jamais offlineSeconds", () => {
  it("importSave() : le loadSave posté n'a pas de champ offlineSeconds, même avec un timestamp offline présent", async () => {
    const save = encodeSave(createInitialState());
    const oldTimestamp = String(Date.now() - 20 * 3600 * 1000); // 20h dans le passé
    const { mod, worker } = await freshGameStore({ save, lastActiveAt: oldTimestamp });

    worker.posted.length = 0; // ignore le loadSave du constructeur
    mod.gameStore.importSave(encodeSave(createInitialState()));

    const loadSaveMsgs = worker.posted.filter((m) => m.type === "loadSave");
    expect(loadSaveMsgs).toHaveLength(1);
    expect("offlineSeconds" in loadSaveMsgs[0]).toBe(false);
  });

  it("resetGame() : le loadSave posté n'a pas de champ offlineSeconds, même avec un timestamp offline présent", async () => {
    const save = encodeSave(createInitialState());
    const oldTimestamp = String(Date.now() - 20 * 3600 * 1000);
    const { mod, worker } = await freshGameStore({ save, lastActiveAt: oldTimestamp });

    worker.posted.length = 0;
    mod.gameStore.resetGame();

    const loadSaveMsgs = worker.posted.filter((m) => m.type === "loadSave");
    expect(loadSaveMsgs).toHaveLength(1);
    expect("offlineSeconds" in loadSaveMsgs[0]).toBe(false);
  });
});

describe("critère §10.14 — écriture au beforeunload", () => {
  it("déclencher beforeunload met à jour OFFLINE_TIMESTAMP_KEY de manière synchrone, sans round-trip Worker", async () => {
    const { storage } = await freshGameStore({ withWindow: true });
    expect(storage.getItem(OFFLINE_TIMESTAMP_KEY)).toBeNull();

    const before = Date.now();
    (window as unknown as EventTarget).dispatchEvent(new Event("beforeunload"));
    const after = Date.now();

    const raw = storage.getItem(OFFLINE_TIMESTAMP_KEY);
    expect(raw).not.toBeNull();
    const value = Number(raw);
    expect(value).toBeGreaterThanOrEqual(before);
    expect(value).toBeLessThanOrEqual(after);
  });
});

describe("critère §10.15 — écriture à l'autosave", () => {
  it("un message 'saveData' traité par GameStore met à jour OFFLINE_TIMESTAMP_KEY en plus de la save", async () => {
    const { worker, storage } = await freshGameStore({});
    expect(storage.getItem(OFFLINE_TIMESTAMP_KEY)).toBeNull();

    const encoded = encodeSave(createInitialState());
    const before = Date.now();
    worker.onmessage!({ data: { type: "saveData", encoded } } as MessageEvent);
    const after = Date.now();

    expect(storage.getItem(SAVE_KEY)).toBe(encoded);
    const raw = storage.getItem(OFFLINE_TIMESTAMP_KEY);
    expect(raw).not.toBeNull();
    const value = Number(raw);
    expect(value).toBeGreaterThanOrEqual(before);
    expect(value).toBeLessThanOrEqual(after);
  });
});
