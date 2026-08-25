<script lang="ts">
  import { bugMultiplier } from "../engine/formulas";
  import { gameStore, type LogEntry } from "./gameStore.svelte";
  import { settings } from "./settings.svelte";
  import { UI_STRINGS } from "./uiStrings";

  /**
   * Zone 4d (visual-identity.md §3.7 4d) : onglets PROBLEMS / OUTPUT. PROBLEMS
   * liste ce qui ne va pas (bugs actifs et leur pénalité, blocage de refactor) ;
   * OUTPUT liste `gameStore.eventLog`, des événements réellement observés
   * (autosave, transition d'acte, Grand Rewrite, erreur de save) — jamais un
   * onglet TERMINAL (tranché §3.7 4d, redondant avec le buffer central).
   */
  let activeBottomTab = $state<"problems" | "output">("problems");

  const bugsCount = $derived(Math.round(gameStore.state.bugs));
  const bugPenaltyPct = $derived(Math.round((1 - bugMultiplier(gameStore.state.bugs)) * 100));
  const refactorActif = $derived(gameStore.state.refactorActif);

  interface ProblemLine {
    text: string;
    level: LogEntry["level"];
  }

  const t = $derived(UI_STRINGS[settings.locale].bottomPanel);

  const problems = $derived.by((): ProblemLine[] => {
    const lines: ProblemLine[] = [];
    if (bugsCount > 0) {
      lines.push({ text: t.bugsActive(bugsCount, bugPenaltyPct), level: "error" });
    }
    if (refactorActif) {
      lines.push({
        text: t.refactorInProgress,
        level: "warn",
      });
    }
    if (lines.length === 0) {
      lines.push({ text: t.noProblems, level: "info" });
    }
    return lines;
  });

  const outputEntries = $derived([...gameStore.eventLog].reverse());

  const GLYPH: Record<LogEntry["level"], string> = { info: "›", warn: "⚠", error: "✖" };
</script>

<div class="bottom-panel">
  <div class="tabs mono">
    <button
      type="button"
      class="bp-tab"
      class:active={activeBottomTab === "problems"}
      onclick={() => (activeBottomTab = "problems")}
    >
      Problems
      {#if bugsCount > 0}<span class="badge">{bugsCount}</span>{/if}
    </button>
    <button
      type="button"
      class="bp-tab"
      class:active={activeBottomTab === "output"}
      onclick={() => (activeBottomTab = "output")}
    >
      Output
    </button>
  </div>

  <div class="log mono">
    {#if activeBottomTab === "problems"}
      {#each problems as line, i (i)}
        <p class="log-line" class:warn={line.level === "warn"} class:error={line.level === "error"}>
          <span aria-hidden="true">{GLYPH[line.level]}</span>
          {line.text}
        </p>
      {/each}
    {:else}
      {#each outputEntries as entry (entry.id)}
        <p class="log-line" class:warn={entry.level === "warn"} class:error={entry.level === "error"}>
          <span aria-hidden="true">{GLYPH[entry.level]}</span>
          {entry.text}
        </p>
      {/each}
    {/if}
  </div>
</div>

<style>
  .bottom-panel {
    flex: 0 0 clamp(78px, 18vh, 150px);
    display: flex;
    flex-direction: column;
    background: var(--bg-panel);
    border-top: 1px solid var(--rule);
    min-height: 0;
  }

  .tabs {
    flex: 0 0 28px;
    display: flex;
  }

  .bp-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 12px;
    font-weight: 700;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--fg-3);
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .bp-tab.active {
    color: var(--fg);
    box-shadow: inset 0 -2px 0 var(--fg-3);
  }

  .badge {
    font-weight: 700;
    font-size: 9.5px;
    color: var(--del);
    background: var(--del-bg);
    border-radius: var(--r-sm);
    padding: 1px 5px;
  }

  .log {
    flex: 1;
    overflow-y: auto;
    padding: 8px 16px;
    display: flex;
    flex-direction: column-reverse;
    font-size: 11.5px;
  }

  .log-line {
    margin: 0;
    line-height: 18px;
    color: var(--fg-2);
  }

  .log-line span {
    color: var(--add);
  }

  .log-line.warn span {
    color: var(--warn);
  }

  .log-line.error span {
    color: var(--del);
  }
</style>
