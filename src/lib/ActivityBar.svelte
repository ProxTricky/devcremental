<script lang="ts">
  import { gameStore } from "./gameStore.svelte";

  /**
   * Zone 2 (visual-identity.md §3.5) : 4 entrées d'acte (2 verrouillées), bouton
   * rond Grand Rewrite + point de statut. Devient horizontale < 900px (§3.11).
   */
  let { onOpenRewrite }: { onOpenRewrite: () => void } = $props();

  const acte = $derived(gameStore.state.acte);
  const rewriteAvailable = $derived(acte >= 2);
  const workerLive = $derived(gameStore.clockNow - gameStore.lastTickAt <= 1000);

  interface ActeEntry {
    glyph: string;
    label: string;
    state: "active" | "available" | "locked";
  }

  const entries = $derived.by((): ActeEntry[] => [
    { glyph: "◱", label: "acte i — solo dev", state: acte === 1 ? "active" : "available" },
    {
      glyph: "⑂",
      label: "acte ii — open source",
      state: acte >= 2 ? "active" : acte === 1 ? "locked" : "available",
    },
    { glyph: "◈", label: "actes iii–iv — verrouillés", state: "locked" },
    { glyph: "⌬", label: "acte v — verrouillé", state: "locked" },
  ]);
</script>

<nav class="activitybar" aria-label="Actes">
  {#each entries as entry, i (i)}
    {#if entry.state === "locked"}
      <button
        type="button"
        class="act-btn locked"
        aria-disabled="true"
        tabindex="-1"
        title="verrouillé"
        aria-label={entry.label}
      >
        <span aria-hidden="true">{entry.glyph}</span>
      </button>
    {:else}
      <button
        type="button"
        class="act-btn"
        class:active={entry.state === "active"}
        title={entry.label}
        aria-label={entry.label}
        aria-current={entry.state === "active" ? "true" : undefined}
      >
        <span aria-hidden="true">{entry.glyph}</span>
      </button>
    {/if}
  {/each}

  <div class="spacer"></div>

  <button
    type="button"
    class="rewrite-btn"
    disabled={!rewriteAvailable}
    aria-disabled={!rewriteAvailable}
    title={rewriteAvailable ? "grand rewrite" : "grand rewrite — indisponible"}
    onclick={() => rewriteAvailable && onOpenRewrite()}
  >
    <span aria-hidden="true">⟳</span>
  </button>
  <span
    class="status-dot"
    class:warn={!workerLive}
    aria-hidden="true"
    title={workerLive ? "worker actif" : "worker inactif"}
  ></span>
</nav>

<style>
  .activitybar {
    grid-area: activity;
    width: 52px;
    background: var(--bg-panel);
    border-right: 1px solid var(--rule);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    gap: 2px;
  }

  .act-btn {
    width: 52px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    font-family: var(--mono);
    font-weight: 700;
    font-size: 15px;
    color: var(--fg-3);
    cursor: pointer;
  }

  .act-btn:hover:not(.locked):not(.active) {
    color: var(--fg);
  }

  .act-btn.active {
    background: var(--add-bg);
    box-shadow: inset 2px 0 0 var(--add);
    color: var(--add);
  }

  .act-btn.locked {
    color: var(--fg-4);
    cursor: not-allowed;
  }

  .spacer {
    flex: 1;
  }

  .rewrite-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--r-full);
    background: var(--meta-bg);
    border: 1px solid var(--meta-line);
    color: var(--meta);
    font-family: var(--mono);
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rewrite-btn:disabled {
    color: var(--fg-4);
    border-color: var(--rule);
    background: transparent;
    cursor: not-allowed;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--r-full);
    background: var(--add);
    margin-top: 6px;
  }

  .status-dot.warn {
    background: var(--warn);
  }

  @media (max-width: 899px) {
    .activitybar {
      grid-area: activity;
      width: 100%;
      height: 44px;
      flex-direction: row;
      padding: 0;
      border-right: none;
      border-bottom: 1px solid var(--rule);
    }

    .act-btn {
      width: 44px;
      height: 44px;
    }

    .act-btn.active {
      box-shadow: inset 0 -2px 0 var(--add);
    }

    .spacer {
      flex: 1;
    }

    .rewrite-btn {
      margin-right: 8px;
    }

    .status-dot {
      margin-top: 0;
      margin-right: 8px;
    }
  }
</style>
