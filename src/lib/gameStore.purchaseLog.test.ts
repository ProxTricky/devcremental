import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTO_COMPLETE_TAUX,
  BUG_PLANCHER,
  IMPACT_BUG,
  NPM_INSTALL_BURST_DETTE,
  NPM_INSTALL_BURST_LOC,
  TESTS_AUTO_MULT_COEF_DETTE,
} from "../engine/constants";
import { generatorRate, impactBugEffectif, rubberDuckFixRate } from "../engine/formulas";
import type { InboundMessage, OutboundMessage, PurchaseResult } from "../worker/protocol";
import { UI_STRINGS } from "./uiStrings";

/**
 * Réf. acte-1-solo-dev.md §4.19-21 et upgrades-acte-1-2.md §7.5 (critères
 * 15-20) : le message de confirmation d'achat côté gameStore.svelte.ts, en
 * réponse à un `purchaseResult` reçu du Worker (voir gameWorker.ts pour la
 * détection de succès elle-même, testée indirectement via actions.test.ts —
 * le contrat de référence dont elle dépend).
 *
 * Même convention de mock que gameStore.offline.test.ts (Worker/localStorage
 * absents de l'environnement de test Node de ce projet) : voir ce fichier pour
 * la justification complète. `withWindow` non nécessaire ici : sans `window`,
 * `settings.locale` vaut "en" et `settings.numberNotation` vaut "integer"
 * (settings.svelte.ts) — déterministe, et suffisant puisque `UI_STRINGS.en`
 * est actuellement un placeholder identique à `UI_STRINGS.fr` (cf. uiStrings.ts).
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

async function freshGameStore() {
  vi.resetModules();

  class CapturingFakeWorker extends FakeWorker {
    constructor(url: URL, o?: unknown) {
      super(url, o);
      lastWorkerInstance = this;
    }
  }
  (globalThis as { Worker?: unknown }).Worker = CapturingFakeWorker;
  (globalThis as { localStorage?: unknown }).localStorage = new FakeStorage();
  delete (globalThis as { window?: unknown }).window;

  const mod = await import("./gameStore.svelte");
  const worker = lastWorkerInstance!;
  return { mod, worker };
}

function send(worker: FakeWorker, result: PurchaseResult): void {
  const msg: OutboundMessage = { type: "purchaseResult", ...result };
  worker.onmessage!({ data: msg } as MessageEvent);
}

beforeEach(() => {
  lastWorkerInstance = null;
});

afterEach(() => {
  delete (globalThis as { Worker?: unknown }).Worker;
  delete (globalThis as { localStorage?: unknown }).localStorage;
  delete (globalThis as { window?: unknown }).window;
});

const S = UI_STRINGS.en.purchaseLog; // placeholder identique à fr, cf. en-tête

describe("critère §4.19 — message générateur générique", () => {
  it("copierColler ×3 : gabarit générique, débit = generatorRate(id, 3)", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "generator", id: "copierColler", possedes: 3 });
    const last = mod.gameStore.eventLog.at(-1)!;
    const debitAvant = generatorRate("copierColler", 2).toFixed(0);
    const debitApres = generatorRate("copierColler", 3).toFixed(0);
    expect(last.text).toBe(S.generator("Stack Overflow Copy-Paste", 3, debitAvant, debitApres));
  });
});

describe("critère §4.19 — message rubberDuck (variante avec correction)", () => {
  it("rubberDuck ×2 : gabarit avec {fix}, jamais le gabarit générique", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "generator", id: "rubberDuck", possedes: 2 });
    const last = mod.gameStore.eventLog.at(-1)!;
    const debitAvant = generatorRate("rubberDuck", 1).toFixed(0);
    const debitApres = generatorRate("rubberDuck", 2).toFixed(0);
    const fix = rubberDuckFixRate(2).toFixed(0);
    expect(last.text).toBe(S.generatorWithFix("Rubber Duck", 2, debitAvant, debitApres, fix));
    expect(last.text).not.toBe(S.generator("Rubber Duck", 2, debitAvant, debitApres));
  });
});

describe("critère §7.5.15 — message U1 Auto-complétion", () => {
  it("valeur dérivée d'AUTO_COMPLETE_TAUX, jamais codée en dur dans le test au-delà de la constante elle-même", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "upgrade", id: "autoComplete", acteAtPurchase: 1 });
    const last = mod.gameStore.eventLog.at(-1)!;
    expect(last.text).toBe(S.autoComplete("Autocomplete", AUTO_COMPLETE_TAUX.toFixed(0)));
  });
});

describe("critère §7.5.16 — message U2 Ça marche sur ma machine", () => {
  it("cite les seuils 40 et 80 dérivés des constantes, jamais codés en dur dans le gabarit", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "upgrade", id: "worksOnMyMachine", acteAtPurchase: 1 });
    const last = mod.gameStore.eventLog.at(-1)!;
    // (1 - BUG_PLANCHER) / impact_bug reproduit les valeurs normatives 40/80
    // (acte-1-solo-dev.md §3.3) — voir gameStore.svelte.ts pour la correction
    // de l'énoncé littéral "1 / IMPACT_BUG" d'upgrades-acte-1-2.md §7.2.
    const seuilAvant = Math.round((1 - BUG_PLANCHER) / IMPACT_BUG);
    const seuilApres = Math.round((1 - BUG_PLANCHER) / impactBugEffectif(true));
    expect(seuilAvant).toBe(40);
    expect(seuilApres).toBe(80);
    expect(last.text).toBe(S.worksOnMyMachine("Works on my machine", seuilApres, seuilAvant));
  });
});

describe("critère §7.5.17/18 — message U3, variante selon l'acte au moment de l'achat", () => {
  it("acheté en Acte I (acteAtPurchase=1) : variante dormante, jamais la variante active", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "upgrade", id: "testsAutomatises", acteAtPurchase: 1 });
    const last = mod.gameStore.eventLog.at(-1)!;
    const pourcentage = Math.round((1 - TESTS_AUTO_MULT_COEF_DETTE) * 100);
    expect(pourcentage).toBe(30);
    expect(last.text).toBe(S.testsAutomatisesDormant("Automated tests", pourcentage));
    expect(last.text).not.toBe(S.testsAutomatisesActif("Automated tests", pourcentage));
  });

  it("acheté en Acte II+ (acteAtPurchase=2) : variante active, jamais la variante dormante", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "upgrade", id: "testsAutomatises", acteAtPurchase: 2 });
    const last = mod.gameStore.eventLog.at(-1)!;
    const pourcentage = Math.round((1 - TESTS_AUTO_MULT_COEF_DETTE) * 100);
    expect(last.text).toBe(S.testsAutomatisesActif("Automated tests", pourcentage));
    expect(last.text).not.toBe(S.testsAutomatisesDormant("Automated tests", pourcentage));
  });
});

describe("critère §7.5.19 — message U4 npm install, gain et coût toujours ensemble", () => {
  it("cite exactement +8000 et +1500, dérivés des constantes", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "npmInstall" });
    const last = mod.gameStore.eventLog.at(-1)!;
    const gain = NPM_INSTALL_BURST_LOC.toFixed(0);
    const cout = NPM_INSTALL_BURST_DETTE.toFixed(0);
    expect(last.text).toBe(S.npmInstall("Just npm install it", gain, cout));
    expect(last.text).toContain(gain);
    expect(last.text).toContain(cout);
  });
});

describe("critère §4.20/§7.5.20 — silence sur no-op", () => {
  it("aucun message purchaseResult n'est jamais posté par le Worker sur un no-op (garanti par gameWorker.ts, vérifié ici en creux : eventLog ne contient rien avant tout envoi)", async () => {
    const { mod } = await freshGameStore();
    expect(mod.gameStore.eventLog).toHaveLength(0);
  });
});
