<script lang="ts">
  import Decimal from "break_eternity.js";
  import { NPM_INSTALL_BURST_DETTE, NPM_INSTALL_BURST_LOC } from "../engine/constants";
  import { NPM_INSTALL_FLAVOR } from "./flavorText";
  import { formatNumber } from "./format";
  import { gameStore } from "./gameStore.svelte";
  import { settings } from "./settings.svelte";
  import { UI_STRINGS } from "./uiStrings";
  import { NPM_INSTALL_EFFECT, NPM_INSTALL_LABEL } from "./upgradeLabels";

  const gainLoc = $derived(formatNumber(new Decimal(NPM_INSTALL_BURST_LOC), settings.numberNotation));
  const costDette = $derived(
    formatNumber(new Decimal(NPM_INSTALL_BURST_DETTE), settings.numberNotation),
  );

  // U4 "npm install" (upgrades-acte-1-2.md §4.4) : réclamation gratuite, pas un
  // achat en LoC — distincte des upgrades U1-U3 (gameStore.upgradeView). Gatée
  // sur `state.acte >= 2` uniquement (aucun seuil de LoC séparé, §4.4), claim
  // unique par run tant qu'aucun Grand Rewrite n'a eu lieu.
  const available = $derived(gameStore.state.acte >= 2);
  const claimed = $derived(gameStore.state.upgrades.npmInstallClaimed);

  const flavor = $derived(NPM_INSTALL_FLAVOR[settings.locale]);
  const label = $derived(NPM_INSTALL_LABEL[settings.locale]);
  const effect = $derived(NPM_INSTALL_EFFECT[settings.locale]);
  const t = $derived(UI_STRINGS[settings.locale].npmInstallClaim);

  let flashing = $state(false);
  function onClaim() {
    if (!available || claimed) return;
    gameStore.claimNpmInstall();
    flashing = true;
    setTimeout(() => (flashing = false), 140);
  }
</script>

{#if available}
  <button
    type="button"
    class="npm-card"
    class:claimable={!claimed}
    class:owned={claimed}
    class:flash-border={flashing}
    disabled={claimed}
    aria-disabled={claimed}
    title={flavor.tooltip}
    onclick={onClaim}
  >
    <span class="npm-icon mono" aria-hidden="true">◪</span>
    <span class="npm-body">
      <span class="npm-header">
        <span class="npm-name">{label}</span>
        {#if claimed}
          <span class="npm-owned mono"><span aria-hidden="true">✔</span> {t.claimed}</span>
        {/if}
      </span>
      <p class="npm-flavor">{flavor.description}</p>
      <p class="npm-effect">{effect}</p>
      <span class="npm-stats mono">
        <span class="npm-gain">+{gainLoc} LoC</span>
        <span class="npm-cost">+{costDette} dette</span>
      </span>
    </span>
  </button>
{/if}

<style>
  .npm-card {
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

  /* Toujours abordable dès disponible (pas de coût en LoC, §4.4) : la carte
     reste cliquable tant qu'elle n'est pas déjà réclamée. */
  .npm-card.claimable {
    border-color: var(--add-line);
    cursor: pointer;
  }

  .npm-card.claimable:hover {
    background: var(--add-bg);
  }

  .npm-card.owned {
    border-color: var(--add-line-hi);
    cursor: not-allowed;
  }

  .npm-icon {
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

  .npm-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .npm-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .npm-name {
    font-family: var(--sans);
    font-weight: 600;
    font-size: 13px;
    line-height: 1.3;
    color: var(--fg);
  }

  .npm-owned {
    flex: 0 0 auto;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--add);
  }

  .npm-flavor {
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

  .npm-effect {
    margin: 0;
    font-family: var(--sans);
    font-size: 12px;
    line-height: 1.4;
    color: var(--info);
  }

  /* Gain (+LoC) en --add, coût (+dette) en --del : les deux moitiés du choix
     stratégique doivent être lisibles ensemble, jamais seulement le gain
     (upgrades-acte-1-2.md §4.4, "un vrai choix stratégique"). */
  .npm-stats {
    display: flex;
    gap: 12px;
    font-size: 11.5px;
    font-weight: 500;
  }

  .npm-gain {
    color: var(--add);
  }

  .npm-cost {
    color: var(--del);
  }
</style>
