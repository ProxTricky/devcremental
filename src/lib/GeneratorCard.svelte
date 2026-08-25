<script lang="ts">
  import type { GeneratorId } from "../engine/constants";
  import { formatNumber } from "./format";
  import { GENERATOR_EFFECT, GENERATOR_LABELS } from "./generatorLabels";
  import { GENERATOR_FLAVOR } from "./flavorText";
  import { gameStore } from "./gameStore.svelte";
  import { settings } from "./settings.svelte";

  let { id }: { id: GeneratorId } = $props();

  const view = $derived(gameStore.generatorView(id));
  const flavor = $derived(GENERATOR_FLAVOR[settings.locale][id]);
  const label = $derived(GENERATOR_LABELS[settings.locale][id]);
  const effect = $derived(GENERATOR_EFFECT[settings.locale][id]);

  /** Glyphe de pastille par générateur — choix d'iconographie ui-engineer
   * (§3.8 ne fixe pas les 3 glyphes réels), cohérent avec le registre
   * géométrique/box-drawing déjà utilisé en ActivityBar. */
  const ICON: Record<GeneratorId, string> = {
    copierColler: "▣",
    stagiaire: "▤",
    rubberDuck: "◍",
  };

  let flashing = $state(false);
  function onBuy() {
    if (!view.affordable) return;
    gameStore.buyGenerator(id);
    flashing = true;
    setTimeout(() => (flashing = false), 140);
  }
</script>

{#if view.unlocked}
  <button
    type="button"
    class="generator-card"
    class:affordable={view.affordable}
    class:flash-border={flashing}
    disabled={!view.affordable}
    title={flavor.tooltip}
    onclick={onBuy}
  >
    <span class="gen-icon mono" aria-hidden="true">{ICON[id]}</span>
    <span class="gen-body">
      <span class="gen-header">
        <span class="gen-name">{label}</span>
        <span class="gen-owned mono">×{view.possedes}</span>
      </span>
      <p class="gen-flavor">{flavor.description}</p>
      {#if effect}
        <p class="gen-effect">{effect}</p>
      {/if}
      <span class="gen-stats mono">
        <span class="gen-rate">+{formatNumber(view.production, settings.numberNotation)} LoC/s</span>
        <span class="gen-cost">{formatNumber(view.cost, settings.numberNotation)} LoC</span>
      </span>
    </span>
  </button>
{/if}

<style>
  .generator-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    padding: 12px;
    border-radius: var(--r-md);
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--rule);
    text-align: left;
    cursor: not-allowed;
    font: inherit;
    color: inherit;
  }

  .generator-card.affordable {
    border-color: var(--add-line);
    cursor: pointer;
  }

  .generator-card.affordable:hover {
    background: var(--add-bg);
  }

  .gen-icon {
    flex: 0 0 26px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-sm);
    background: linear-gradient(140deg, var(--add-bg), transparent);
    font-weight: 700;
    font-size: 13px;
    color: var(--add);
  }

  .gen-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .gen-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .gen-name {
    font-family: var(--sans);
    font-weight: 600;
    font-size: 13px;
    line-height: 1.3;
    color: var(--fg);
  }

  .gen-owned {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--fg);
  }

  .gen-flavor {
    margin: 0;
    font-family: var(--sans);
    font-size: 12px;
    line-height: 1.5;
    color: var(--fg-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .gen-effect {
    margin: 0;
    font-family: var(--sans);
    font-size: 12px;
    line-height: 1.4;
    color: var(--info);
  }

  .gen-stats {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 11.5px;
  }

  .gen-rate {
    color: var(--add);
    font-weight: 400;
  }

  .gen-cost {
    font-weight: 500;
    color: var(--warn);
  }

  .generator-card.affordable .gen-cost {
    color: var(--add);
  }
</style>
