<script lang="ts">
  import { detteDivisor } from "../engine/formulas";
  import { CODE_SAMPLE_SOURCE } from "./codeSamples";
  import CoffeeButton from "./CoffeeButton.svelte";
  import { debtLogFlavor, readmeFlavor } from "./flavorText";
  import { formatNumber } from "./format";
  import { gameStore } from "./gameStore.svelte";
  import { LANGUE_LABELS } from "./langueLabels";
  import { settings } from "./settings.svelte";
  import Terminal from "./Terminal.svelte";
  import { UI_STRINGS } from "./uiStrings";

  /**
   * Zone 4c (visual-identity.md §3.7 4c) : enveloppe Terminal.svelte + rangée
   * d'actions (bouton primaire, Debug, CoffeeButton). Le bouton "combo ×N" du
   * mockup n'existe pas côté moteur (aucun compteur de combo dans GameState) —
   * omis plutôt qu'inventé, cf. instructions "jamais l'approximer côté UI".
   */
  let { activeTab }: { activeTab: "main" | "debt" | "readme" } = $props();

  const refactorActif = $derived(gameStore.state.refactorActif);
  const bugsCount = $derived(Math.round(gameStore.state.bugs));

  const ratioPerdu = $derived(1 - detteDivisor(gameStore.state.dette).pow(-1).toNumber());
  const pctPerdu = $derived(Math.round(ratioPerdu * 100));

  let flashPrimary = $state(false);
  function onWrite() {
    gameStore.clickCode();
    flashPrimary = true;
    setTimeout(() => (flashPrimary = false), 140);
  }

  const t = $derived(UI_STRINGS[settings.locale].editorView);
  const langueLabel = $derived(
    gameStore.state.langueActive === "none"
      ? (settings.locale === "en" ? "none (pre-Rewrite)" : "aucun (pré-Rewrite)")
      : LANGUE_LABELS[gameStore.state.langueActive],
  );

  const debtLog = $derived(
    debtLogFlavor(
      settings.locale,
      formatNumber(gameStore.state.dette, settings.numberNotation),
      String(pctPerdu),
      bugsCount,
    ),
  );
  const readme = $derived(
    readmeFlavor(
      settings.locale,
      gameStore.state.acte,
      langueLabel,
      formatNumber(gameStore.state.karmaRewrite, settings.numberNotation),
    ),
  );
</script>

<div class="editor-view">
  {#if activeTab === "main"}
    <Terminal />

    <div class="actions">
      <button
        type="button"
        class="btn-primary write-btn"
        class:flash-border={flashPrimary}
        disabled={refactorActif}
        onclick={onWrite}
      >
        $ write --code +1
      </button>
      <button
        type="button"
        class="btn-secondary"
        disabled={bugsCount === 0 || refactorActif}
        onclick={() => gameStore.clickDebug()}
      >
        {t.debug}
      </button>
      <CoffeeButton />
    </div>
    <p class="action-hint">{t.hint}</p>
  {:else if activeTab === "debt"}
    <div class="fact-view mono">
      <p>// {debtLog.description}</p>
      {#if debtLog.tooltip}
        <p class="flavor-tooltip">{debtLog.tooltip}</p>
      {/if}
    </div>
  {:else}
    <div class="fact-view mono">
      <p>// {readme.description}</p>
      {#if readme.tooltip}
        <p class="flavor-tooltip">{readme.tooltip}</p>
      {/if}
      <p class="credit">
        // {t.creditPrefix} <a
          href={CODE_SAMPLE_SOURCE[gameStore.state.langueActive].url}
          target="_blank"
          rel="noopener noreferrer">{CODE_SAMPLE_SOURCE[gameStore.state.langueActive].repo}</a
        > {t.creditSuffix}
      </p>
    </div>
  {/if}
</div>

<style>
  .editor-view {
    flex: 1;
    overflow-y: auto;
    padding: 0 0 16px;
    background: var(--bg-app);
    display: flex;
    flex-direction: column;
  }

  .actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin: 24px auto 4px;
    flex-wrap: wrap;
  }

  .action-hint {
    text-align: center;
    margin: 0;
    font-family: var(--sans);
    font-size: 12px;
    color: var(--fg-3);
  }

  .write-btn {
    min-height: 44px;
    padding: 0 24px;
    border-radius: var(--r-md);
    font-family: var(--mono);
    font-weight: 500;
    font-size: 13.5px;
    cursor: pointer;
  }

  .write-btn:active:not(:disabled) {
    transform: translateY(1px);
  }

  .btn-secondary {
    min-height: 44px;
    padding: 0 16px;
    border-radius: var(--r-md);
    border: 1px solid var(--rule-strong);
    color: var(--fg-2);
    background: transparent;
    font-family: var(--sans);
    font-weight: 600;
    font-size: 12.5px;
    cursor: pointer;
    transition: background-color 100ms linear;
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.04);
  }

  .btn-secondary:disabled,
  .write-btn:disabled {
    cursor: not-allowed;
    color: var(--fg-3);
  }

  .fact-view {
    padding: 24px;
    color: var(--fg-2);
    font-size: 12.5px;
  }

  .flavor-tooltip {
    margin: 10px 0 0;
    font-family: var(--sans);
    font-size: 12px;
    line-height: 1.55;
    color: var(--fg-2);
  }

  .credit {
    margin-top: 8px;
    color: var(--fg-3);
    font-size: 11.5px;
  }
</style>
