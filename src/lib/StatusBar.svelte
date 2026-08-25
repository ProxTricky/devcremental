<script lang="ts">
  import { CAFE_MAX_STOCK } from "../engine/constants";
  import { detteDivisor } from "../engine/formulas";
  import { formatNumber } from "./format";
  import { AUTOSAVE_INTERVAL_MS, gameStore } from "./gameStore.svelte";
  import { settings } from "./settings.svelte";

  /** Zone 6 (visual-identity.md §3.9) : 8 segments, tous dérivés du state réel
   * ou des horodatages UI-only du store (§gameStore.svelte.ts). */
  const ACTE_ROMAN: Record<number, string> = { 1: "i", 2: "ii" };

  const acte2 = $derived(gameStore.state.acte >= 2);
  const acteRoman = $derived(ACTE_ROMAN[gameStore.state.acte] ?? String(gameStore.state.acte));
  const bugsCount = $derived(Math.round(gameStore.state.bugs));
  const karma = $derived(gameStore.state.karmaRewrite);
  const hasKarma = $derived(karma.gt(0));

  const ratioPerdu = $derived(1 - detteDivisor(gameStore.state.dette).pow(-1).toNumber());
  const pctPerdu = $derived(Math.round(ratioPerdu * 100));
  type Tier = "info" | "warn" | "error";
  const tier = $derived<Tier>(ratioPerdu >= 0.5 ? "error" : ratioPerdu >= 0.2 ? "warn" : "info");

  const stockAvailable = $derived(Math.floor(gameStore.state.cafeStock));
  const buffActive = $derived(gameStore.cafeBuffActive);
  const buffSecondsLeft = $derived(Math.ceil(gameStore.state.cafeBuffRemaining));

  const autosaveSecondsLeft = $derived(
    Math.max(
      0,
      Math.ceil((AUTOSAVE_INTERVAL_MS - (gameStore.clockNow - gameStore.lastAutosaveAt)) / 1000),
    ),
  );

  function formatRunTime(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  const runTime = $derived(formatRunTime(gameStore.clockNow - gameStore.runStartAt));
</script>

<footer class="statusbar mono">
  <span class="segment">
    <span class="dot" aria-hidden="true"></span> tick 10/s
  </span>
  <span class="segment fg3">autosave {autosaveSecondsLeft}s</span>
  {#if acte2}
    <span class="segment" class:warn={tier === "warn"} class:error={tier === "error"}>
      dette −{pctPerdu} %
    </span>
  {/if}
  {#if bugsCount >= 1}
    <span class="segment del">bugs {bugsCount}</span>
  {/if}
  <span class="segment fg2">acte {acteRoman}</span>
  <span class="segment" class:warn={buffActive}>
    ☕ {stockAvailable}/{CAFE_MAX_STOCK}{#if buffActive}
      · {buffSecondsLeft}s{/if}
  </span>
  {#if hasKarma}
    <span class="segment meta">karma {formatNumber(karma, settings.numberNotation)}</span>
  {/if}
  <span class="segment fg3 runtime">{runTime}</span>
</footer>

<style>
  .statusbar {
    grid-area: status;
    height: 26px;
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 0 12px;
    background: var(--bg-frame);
    border-top: 1px solid var(--rule);
    font-size: 10.5px;
    color: var(--fg-2);
    overflow: hidden;
  }

  .segment {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .segment.fg2 {
    color: var(--fg-2);
  }

  .segment.fg3 {
    color: var(--fg-3);
  }

  .segment.del {
    color: var(--del);
  }

  .segment.warn {
    color: var(--warn);
  }

  .segment.error {
    color: var(--del);
  }

  .segment.meta {
    color: var(--meta);
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: var(--r-full);
    background: var(--add);
  }

  .runtime {
    margin-left: auto;
  }

  @media (max-width: 379px) {
    .statusbar {
      height: auto;
      flex-wrap: wrap;
      row-gap: 2px;
      padding: 4px 12px;
    }

    .segment.meta,
    .runtime {
      display: none;
    }
  }
</style>
