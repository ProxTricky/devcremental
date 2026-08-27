import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generatorRate, rubberDuckFixRate } from "../engine/formulas";

/**
 * Aperçu permanent "avant → après" sur les cartes de générateurs (décision
 * user, 2026-08-27, 2ᵉ révision — remplace le message de confirmation
 * temporaire d'origine, cf. gameStore.purchaseLog.test.ts et
 * GeneratorCard.svelte) : `generatorView(id).nextProduction`/`nextFixRate`
 * doivent refléter l'état APRÈS un achat de plus, en permanence, pas
 * seulement juste après un clic — l'objectif est d'inciter à l'achat en
 * montrant le gain avant de cliquer.
 *
 * Même convention de mock que gameStore.offline.test.ts/purchaseLog.test.ts
 * (Worker/localStorage absents de l'environnement de test Node du projet).
 */

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  constructor(_url: URL, _opts?: unknown) {}
  postMessage(): void {}
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

async function freshGameStore() {
  vi.resetModules();
  (globalThis as { Worker?: unknown }).Worker = FakeWorker;
  (globalThis as { localStorage?: unknown }).localStorage = new FakeStorage();
  delete (globalThis as { window?: unknown }).window;
  return import("./gameStore.svelte");
}

afterEach(() => {
  delete (globalThis as { Worker?: unknown }).Worker;
  delete (globalThis as { localStorage?: unknown }).localStorage;
  delete (globalThis as { window?: unknown }).window;
});

describe("generatorView — aperçu permanent avant/après", () => {
  it("copierColler à 0 possédé : production = 0, nextProduction = generatorRate(id, 1)", async () => {
    const mod = await freshGameStore();
    const view = mod.gameStore.generatorView("copierColler");
    expect(view.production.eq(generatorRate("copierColler", 0))).toBe(true);
    expect(view.nextProduction.eq(generatorRate("copierColler", 1))).toBe(true);
    expect(view.fixRate).toBeNull();
    expect(view.nextFixRate).toBeNull();
  });

  it("stagiaire à 2 possédés : nextProduction = generatorRate(id, 3), pas juste production + prodBase codé en dur", async () => {
    const mod = await freshGameStore();
    mod.gameStore.state.generators.stagiaire = 2;
    const view = mod.gameStore.generatorView("stagiaire");
    expect(view.production.eq(generatorRate("stagiaire", 2))).toBe(true);
    expect(view.nextProduction.eq(generatorRate("stagiaire", 3))).toBe(true);
  });

  it("rubberDuck à 1 possédé : fixRate/nextFixRate dérivés de rubberDuckFixRate, jamais null", async () => {
    const mod = await freshGameStore();
    mod.gameStore.state.generators.rubberDuck = 1;
    const view = mod.gameStore.generatorView("rubberDuck");
    expect(view.fixRate?.eq(rubberDuckFixRate(1))).toBe(true);
    expect(view.nextFixRate?.eq(rubberDuckFixRate(2))).toBe(true);
  });

  it("l'aperçu reste identique avant et après avoir laissé le temps s'écouler (permanent, pas un flash temporisé)", async () => {
    const mod = await freshGameStore();
    mod.gameStore.state.generators.copierColler = 4;
    const before = mod.gameStore.generatorView("copierColler").nextProduction;
    await new Promise((r) => setTimeout(r, 20));
    const after = mod.gameStore.generatorView("copierColler").nextProduction;
    expect(after.eq(before)).toBe(true);
  });
});
