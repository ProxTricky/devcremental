import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTO_COMPLETE_TAUX,
  BUG_PLANCHER,
  IMPACT_BUG,
  NPM_INSTALL_BURST_DETTE,
  NPM_INSTALL_BURST_LOC,
  TESTS_AUTO_MULT_COEF_DETTE,
} from "../engine/constants";
import { impactBugEffectif } from "../engine/formulas";
import type { InboundMessage, OutboundMessage, PurchaseResult } from "../worker/protocol";
import { UI_STRINGS } from "./uiStrings";

/**
 * Réf. acte-1-solo-dev.md §4.19-21 et upgrades-acte-1-2.md §7.5 (critères
 * 15-20) : le message de confirmation d'achat côté gameStore.svelte.ts, en
 * réponse à un `purchaseResult` reçu du Worker (voir gameWorker.ts pour la
 * détection de succès elle-même, testée indirectement via actions.test.ts —
 * le contrat de référence dont elle dépend).
 *
 * Affiché directement sur la carte concernée via `gameStore.purchaseFlash`
 * (clé = UpgradeId, ou littéral "npmInstall"), jamais dans le journal
 * `eventLog` (décision user, 2026-08-27 — cf. gameStore.svelte.ts). Les
 * générateurs ne passent plus par ce mécanisme depuis la 2ᵉ révision du même
 * jour : ils affichent un aperçu "avant → après" permanent sur la carte
 * (`GeneratorView.nextProduction`/`nextFixRate`), testé séparément dans
 * gameStore.generatorPreview.test.ts.
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

describe("critère §7.5.15 — message U1 Auto-complétion", () => {
  it("valeur dérivée d'AUTO_COMPLETE_TAUX, jamais codée en dur dans le test au-delà de la constante elle-même", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "upgrade", id: "autoComplete", acteAtPurchase: 1 });
    const flash = mod.gameStore.purchaseFlash.autoComplete;
    expect(flash).toBe(S.autoComplete("Autocomplete", AUTO_COMPLETE_TAUX.toFixed(0)));
  });
});

describe("critère §7.5.16 — message U2 Ça marche sur ma machine", () => {
  it("cite les seuils 40 et 80 dérivés des constantes, jamais codés en dur dans le gabarit", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "upgrade", id: "worksOnMyMachine", acteAtPurchase: 1 });
    const flash = mod.gameStore.purchaseFlash.worksOnMyMachine;
    // (1 - BUG_PLANCHER) / impact_bug reproduit les valeurs normatives 40/80
    // (acte-1-solo-dev.md §3.3) — voir gameStore.svelte.ts pour la correction
    // de l'énoncé littéral "1 / IMPACT_BUG" d'upgrades-acte-1-2.md §7.2.
    const seuilAvant = Math.round((1 - BUG_PLANCHER) / IMPACT_BUG);
    const seuilApres = Math.round((1 - BUG_PLANCHER) / impactBugEffectif(true));
    expect(seuilAvant).toBe(40);
    expect(seuilApres).toBe(80);
    expect(flash).toBe(S.worksOnMyMachine("Works on my machine", seuilApres, seuilAvant));
  });
});

describe("critère §7.5.17/18 — message U3, variante selon l'acte au moment de l'achat", () => {
  it("acheté en Acte I (acteAtPurchase=1) : variante dormante, jamais la variante active", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "upgrade", id: "testsAutomatises", acteAtPurchase: 1 });
    const flash = mod.gameStore.purchaseFlash.testsAutomatises;
    const pourcentage = Math.round((1 - TESTS_AUTO_MULT_COEF_DETTE) * 100);
    expect(pourcentage).toBe(30);
    expect(flash).toBe(S.testsAutomatisesDormant("Automated tests", pourcentage));
    expect(flash).not.toBe(S.testsAutomatisesActif("Automated tests", pourcentage));
  });

  it("acheté en Acte II+ (acteAtPurchase=2) : variante active, jamais la variante dormante", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "upgrade", id: "testsAutomatises", acteAtPurchase: 2 });
    const flash = mod.gameStore.purchaseFlash.testsAutomatises;
    const pourcentage = Math.round((1 - TESTS_AUTO_MULT_COEF_DETTE) * 100);
    expect(flash).toBe(S.testsAutomatisesActif("Automated tests", pourcentage));
    expect(flash).not.toBe(S.testsAutomatisesDormant("Automated tests", pourcentage));
  });
});

describe("critère §7.5.19 — message U4 npm install, gain et coût toujours ensemble", () => {
  it("cite exactement +8000 et +1500, dérivés des constantes", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "npmInstall" });
    const flash = mod.gameStore.purchaseFlash.npmInstall;
    const gain = NPM_INSTALL_BURST_LOC.toFixed(0);
    const cout = NPM_INSTALL_BURST_DETTE.toFixed(0);
    expect(flash).toBe(S.npmInstall("Just npm install it", gain, cout));
    expect(flash).toContain(gain);
    expect(flash).toContain(cout);
  });
});

describe("critère §4.20/§7.5.20 — silence sur no-op", () => {
  it("aucun message purchaseResult n'est jamais posté par le Worker sur un no-op (garanti par gameWorker.ts, vérifié ici en creux : purchaseFlash reste vide avant tout envoi)", async () => {
    const { mod } = await freshGameStore();
    expect(mod.gameStore.purchaseFlash).toEqual({});
  });
});

describe("carte, pas journal (décision user, 2026-08-27)", () => {
  it("un achat réussi n'ajoute rien à eventLog, uniquement à purchaseFlash", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "upgrade", id: "autoComplete", acteAtPurchase: 1 });
    expect(mod.gameStore.eventLog).toHaveLength(0);
    expect(mod.gameStore.purchaseFlash.autoComplete).toBeDefined();
  });
});

describe("générateur : plus de purchaseFlash (décision user, 2026-08-27, 2ᵉ révision)", () => {
  it("un purchaseResult de type générateur n'écrit ni dans purchaseFlash ni dans eventLog", async () => {
    const { mod, worker } = await freshGameStore();
    send(worker, { kind: "generator", id: "copierColler", possedes: 1 });
    expect(mod.gameStore.eventLog).toHaveLength(0);
    expect(mod.gameStore.purchaseFlash.copierColler).toBeUndefined();
  });
});
