import { beforeEach, describe, expect, it } from "vitest";
import { OFFLINE_CAP_SECONDS } from "../engine/constants";
import { createInitialState } from "../engine/state";
import { encodeSave } from "./save";
import {
  computeOfflineDeltaSeconds,
  loadLastActiveAt,
  OFFLINE_TIMESTAMP_KEY,
  saveLastActiveAt,
} from "./localStorage";

// Réf. docs/design/progression-offline.md §10 (critères d'acceptation), numéros
// cités dans chaque `it` (ex. "§10.3" = critère 3). Pas d'environnement DOM/jsdom
// dans ce projet (cf. src/save/save.test.ts, aucun test n'en dépend) : `localStorage`
// est un mock minimal posé sur `globalThis` avant chaque test, exactement comme le
// contrat Storage (getItem/setItem/removeItem) que le code de production consomme.

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

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new FakeStorage();
});

describe("saveLastActiveAt / loadLastActiveAt", () => {
  it("saveLastActiveAt écrit l'epoch ms courant sous OFFLINE_TIMESTAMP_KEY", () => {
    const before = Date.now();
    saveLastActiveAt();
    const after = Date.now();
    const loaded = loadLastActiveAt();
    expect(loaded).not.toBeNull();
    expect(loaded as number).toBeGreaterThanOrEqual(before);
    expect(loaded as number).toBeLessThanOrEqual(after);
  });

  it("critère §10.2 — clé absente : loadLastActiveAt renvoie null, jamais d'exception", () => {
    expect(localStorage.getItem(OFFLINE_TIMESTAMP_KEY)).toBeNull();
    expect(() => loadLastActiveAt()).not.toThrow();
    expect(loadLastActiveAt()).toBeNull();
  });

  it("critère §10.3 — valeur non numérique sous la clé : dégrade vers null sans lever", () => {
    localStorage.setItem(OFFLINE_TIMESTAMP_KEY, "pas-un-nombre");
    expect(() => loadLastActiveAt()).not.toThrow();
    expect(loadLastActiveAt()).toBeNull();
  });

  it("critère §10.3 — valeur négative sous la clé : dégrade vers null", () => {
    localStorage.setItem(OFFLINE_TIMESTAMP_KEY, "-5");
    expect(loadLastActiveAt()).toBeNull();
  });
});

describe("computeOfflineDeltaSeconds — critères §10.4/§10.5/§10.6", () => {
  it("critère §10.4 — delta nul : now === lastActive ⇒ 0", () => {
    const now = 1_000_000;
    expect(computeOfflineDeltaSeconds(now, now)).toBe(0);
  });

  it("critère §10.2/§10.3 — lastActiveMs null (absent/corrompu) ⇒ delta 0", () => {
    expect(computeOfflineDeltaSeconds(Date.now(), null)).toBe(0);
  });

  it("critère §10.5 — horloge reculée (now < lastActive) ⇒ clampé à exactement 0, jamais négatif", () => {
    const lastActive = 1_000_000;
    const now = lastActive - 60_000; // 60s "dans le passé"
    expect(computeOfflineDeltaSeconds(now, lastActive)).toBe(0);
  });

  it("critère §10.6 — plafonnement exact : un delta brut très supérieur à 8h est ramené à OFFLINE_CAP_SECONDS", () => {
    const lastActive = 0;
    const now = 20 * 3600 * 1000; // 20h en ms, très supérieur au plafond de 8h
    expect(computeOfflineDeltaSeconds(now, lastActive)).toBe(OFFLINE_CAP_SECONDS);
  });

  it("un delta intermédiaire (sous le plafond) n'est pas altéré", () => {
    const lastActive = 0;
    const now = 3600 * 1000; // 1h, bien sous le plafond de 8h
    expect(computeOfflineDeltaSeconds(now, lastActive)).toBe(3600);
  });
});

describe("critère §10.12 — SaveDataV1 inchangé par cette spec", () => {
  it("un export base64 ne contient aucun champ lié à la progression offline", () => {
    const encoded = encodeSave(createInitialState());
    const parsed = JSON.parse(atob(encoded));
    expect(Object.keys(parsed)).not.toContain("offlineSeconds");
    expect(Object.keys(parsed)).not.toContain("lastActiveAt");
    expect(Object.keys(parsed)).not.toContain("offlineTimestamp");
  });
});
