<script lang="ts">
  import type { UpgradeId } from "../engine/constants";
  import { UPGRADE_FLAVOR } from "./flavorText";
  import { formatNumber } from "./format";
  import { gameStore } from "./gameStore.svelte";
  import { settings } from "./settings.svelte";
  import { UI_STRINGS } from "./uiStrings";
  import { UPGRADE_EFFECT, UPGRADE_LABELS } from "./upgradeLabels";

  let { id }: { id: UpgradeId } = $props();

  const view = $derived(gameStore.upgradeView(id));
  const flavor = $derived(UPGRADE_FLAVOR[settings.locale][id]);
  const label = $derived(UPGRADE_LABELS[settings.locale][id]);
  const effect = $derived(UPGRADE_EFFECT[settings.locale][id]);
  const t = $derived(UI_STRINGS[settings.locale].upgradeCard);
  /** Message de confirmation d'achat (gameStore.svelte.ts, décision user
   * 2026-08-27) : remplace temporairement `effect` sur CETTE carte après un
   * achat réussi, plutôt que d'apparaître dans le journal Output. */
  const purchaseFlash = $derived(gameStore.purchaseFlash[id]);

  /** Glyphe de pastille par upgrade — même registre géométrique que les
   * icônes de générateurs (GeneratorCard) et d'activity bar, choix
   * ui-engineer (la spec ne fixe pas de glyphe précis). */
  const ICON: Record<UpgradeId, string> = {
    autoComplete: "◧",
    worksOnMyMachine: "◨",
    testsAutomatises: "◩",
  };

  let flashing = $state(false);
  function onBuy() {
    if (!view.affordable || view.owned) return;
    gameStore.buyUpgrade(id);
    flashing = true;
    setTimeout(() => (flashing = false), 140);
  }
</script>

{#if view.unlocked}
  <button
    type="button"
    class="upgrade-card"
    class:affordable={view.affordable && !view.owned}
    class:owned={view.owned}
    class:flash-border={flashing}
    disabled={view.owned || !view.affordable}
    aria-disabled={view.owned || !view.affordable}
    title={flavor.tooltip}
    onclick={onBuy}
  >
    <span class="up-icon mono" aria-hidden="true">{ICON[id]}</span>
    <span class="up-body">
      <span class="up-header">
        <span class="up-name">{label}</span>
        {#if view.owned}
          <span class="up-owned mono"><span aria-hidden="true">✔</span> {t.owned}</span>
        {/if}
      </span>
      <p class="up-flavor">{flavor.description}</p>
      {#if purchaseFlash}
        <p class="up-effect up-flash">{purchaseFlash}</p>
      {:else}
        <p class="up-effect">{effect}</p>
      {/if}
      {#if !view.owned}
        <span class="up-stats mono">
          <span class="up-cost">{formatNumber(view.cost, settings.numberNotation)} LoC</span>
        </span>
      {/if}
    </span>
  </button>
{/if}

<style>
  .upgrade-card {
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

  .upgrade-card.affordable {
    border-color: var(--add-line);
    cursor: pointer;
  }

  .upgrade-card.affordable:hover {
    background: var(--add-bg);
  }

  /* Possédée : jamais signalée par une simple baisse d'opacité — la bordure
     reste marquée (--add-line-hi) et un libellé explicite ("✔ possédée")
     remplace le prix (visual-identity.md §1.7.5/§8.6). */
  .upgrade-card.owned {
    border-color: var(--add-line-hi);
    cursor: not-allowed;
  }

  .up-icon {
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

  .up-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .up-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .up-name {
    font-family: var(--sans);
    font-weight: 600;
    font-size: 13px;
    line-height: 1.3;
    color: var(--fg);
  }

  .up-owned {
    flex: 0 0 auto;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--add);
  }

  .up-flavor {
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

  .up-effect {
    margin: 0;
    font-family: var(--sans);
    font-size: 12px;
    line-height: 1.4;
    color: var(--info);
  }

  /* Confirmation d'achat temporaire (gameStore.purchaseFlash) : couleur --add
     pour la distinguer de la description d'effet statique (--info). */
  .up-effect.up-flash {
    color: var(--add);
    font-weight: 500;
  }

  .up-stats {
    display: flex;
    justify-content: flex-end;
    font-size: 11.5px;
  }

  .up-cost {
    font-weight: 500;
    color: var(--warn);
  }

  .upgrade-card.affordable .up-cost {
    color: var(--add);
  }
</style>
