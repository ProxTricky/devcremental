<script lang="ts">
  import { GENERATOR_IDS, UPGRADE_IDS } from "../engine/constants";
  import { isUpgradeUnlocked } from "../engine/formulas";
  import DebtIndicator from "./DebtIndicator.svelte";
  import { gameStore } from "./gameStore.svelte";
  import GeneratorCard from "./GeneratorCard.svelte";
  import NpmInstallClaim from "./NpmInstallClaim.svelte";
  import RefactorButton from "./RefactorButton.svelte";
  import UpgradeCard from "./UpgradeCard.svelte";

  /**
   * Zone 5 (visual-identity.md §3.8) : en-tête dynamique (GÉNÉRATEURS pour I-II
   * — CONTRIBUTEURS/FRAMEWORKS/SCRIPTS des actes non implémentés sont hors
   * scope, §6), liste de GeneratorCard, bloc fixe DETTE TECHNIQUE en bas.
   */
  const acte2 = $derived(gameStore.state.acte >= 2);

  /**
   * Section AMÉLIORATIONS (upgrades-acte-1-2.md §5) : n'apparaît que si au
   * moins une upgrade U1-U3 est visible (`isUpgradeUnlocked`, même fonction
   * que celle consommée par UpgradeCard — pas de logique de seuil dupliquée)
   * ou si le claim U4 "npm install" est disponible (`acte >= 2`).
   */
  const upgradesVisible = $derived(
    UPGRADE_IDS.some((id) => isUpgradeUnlocked(id, gameStore.state.locTotal)) ||
      acte2,
  );
</script>

<aside class="project-panel" aria-label="Générateurs et dette technique">
  <h2 class="section-title panel-title">Générateurs</h2>

  <div class="generator-list">
    {#each GENERATOR_IDS as id (id)}
      <GeneratorCard {id} />
    {/each}
  </div>

  {#if upgradesVisible}
    <div class="upgrades-block">
      <h2 class="section-title">Améliorations</h2>
      <div class="upgrades-list">
        {#each UPGRADE_IDS as id (id)}
          <UpgradeCard {id} />
        {/each}
        <NpmInstallClaim />
      </div>
    </div>
  {/if}

  {#if acte2}
    <div class="debt-block">
      <h2 class="section-title">Dette technique</h2>
      <DebtIndicator />
      <RefactorButton />
    </div>
  {/if}
</aside>

<style>
  .project-panel {
    grid-area: project;
    background: var(--bg-panel);
    border-left: 1px solid var(--rule);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .panel-title {
    padding: 12px;
  }

  .generator-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .upgrades-block {
    flex: 0 0 auto;
    border-top: 1px solid var(--rule);
    padding: 12px;
    background: var(--bg-panel);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .upgrades-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .debt-block {
    flex: 0 0 auto;
    border-top: 1px solid var(--rule);
    padding: 12px;
    background: var(--bg-panel);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
