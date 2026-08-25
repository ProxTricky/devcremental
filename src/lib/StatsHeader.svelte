<script lang="ts">
  import Decimal from "break_eternity.js";
  import { ARCHETYPES, GENERATOR_IDS } from "../engine/constants";
  import { bugMultiplier, detteDivisor, generatorRate } from "../engine/formulas";
  import { formatNumber } from "./format";
  import { gameStore } from "./gameStore.svelte";
  import { settings } from "./settings.svelte";

  /**
   * Zone 4b (visual-identity.md §3.7 4b) : LOC / NET-SEC / BUGS ou STARS selon
   * l'acte. NET/SEC recompose le débit passif (générateurs) à partir des SEULES
   * fonctions pures du moteur déjà exportées (`generatorRate`, `bugMultiplier`,
   * `detteDivisor`) — jamais une formule réécrite ici.
   *
   * Simplification assumée (archétype JavaScript, §4.2 du moteur) : le
   * multiplicateur de production de l'archétype 'javascript' est tiré
   * aléatoirement PAR TICK côté worker (`archetypeProdMultiplier`) — un débit
   * "propre" affiché ici ne peut pas reproduire ce tirage sans dupliquer l'état
   * RNG du worker. On affiche donc ce débit avant application de l'aléa (mult
   * neutre ×1) le temps qu'un Rewrite JavaScript soit actif ; ×0.80/×1.15 pour
   * rust/python restent, eux, exacts (constantes, pas de tirage).
   */
  const bugsCount = $derived(Math.round(gameStore.state.bugs));
  const acte2 = $derived(gameStore.state.acte >= 2);

  const brutRate = $derived.by(() => {
    const sum = GENERATOR_IDS.reduce(
      (acc, id) => acc.add(generatorRate(id, gameStore.state.generators[id])),
      new Decimal(0),
    );
    const archetype = ARCHETYPES[gameStore.state.langueActive].multProdLocTick ?? 1;
    return sum.mul(bugMultiplier(gameStore.state.bugs)).mul(archetype);
  });

  const debtDivisorValue = $derived(
    acte2 ? detteDivisor(gameStore.state.dette) : new Decimal(1),
  );
  const netRate = $derived(brutRate.div(debtDivisorValue));
  const detteLossPct = $derived(
    Math.round((1 - debtDivisorValue.pow(-1).toNumber()) * 100),
  );
</script>

<div class="stats-header">
  <div class="stat-block">
    <span class="section-title">Lines of code</span>
    <span class="stat-value loc mono">{formatNumber(gameStore.state.loc, settings.numberNotation)}</span>
  </div>

  <div class="stat-block">
    <span class="section-title">Net/sec</span>
    <span class="stat-value mono">+{formatNumber(netRate, settings.numberNotation)}</span>
    {#if acte2 && detteLossPct > 0}
      <span class="stat-subline mono">
        brut {formatNumber(brutRate, settings.numberNotation)} · <span class="del-text"
          >−{detteLossPct} % dette</span
        >
      </span>
    {:else}
      <span class="stat-subline mono">brut {formatNumber(brutRate, settings.numberNotation)}</span>
    {/if}
  </div>

  {#if !acte2}
    <div class="stat-block">
      <span class="section-title">Bugs ouverts</span>
      <span class="stat-value mono" class:del-text={bugsCount >= 1}>{bugsCount}</span>
    </div>
  {:else}
    <div class="stat-block">
      <span class="section-title">⭐ Stars</span>
      <span class="stat-value warn-text mono"
        >{formatNumber(gameStore.state.stars, settings.numberNotation)}</span
      >
    </div>
  {/if}
</div>

<style>
  .stats-header {
    flex: 0 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--rule);
    background: var(--bg-app);
  }

  .stat-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-value {
    font-weight: 500;
    font-size: 18px;
    color: var(--fg);
  }

  .stat-value.loc {
    font-size: 34px;
    line-height: 1;
    color: var(--add);
  }

  .stat-subline {
    font-size: 11px;
    color: var(--fg-3);
  }

  .del-text {
    color: var(--del);
  }

  .warn-text {
    color: var(--warn);
  }

  @media (max-width: 379px) {
    .stat-value.loc {
      font-size: 26px;
    }
  }
</style>
