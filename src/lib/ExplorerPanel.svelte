<script lang="ts">
  import { GENERATOR_IDS, SEUIL_FIN_ACTE_1 } from "../engine/constants";
  import { publicationOpenSourceFlavor } from "./flavorText";
  import { formatNumber } from "./format";
  import { gameStore } from "./gameStore.svelte";
  import { GENERATOR_LABELS } from "./generatorLabels";
  import { settings } from "./settings.svelte";
  import { LANGUE_FILE_NAME } from "./langueLabels";

  /**
   * Zone 3 (visual-identity.md §3.6) : arbre de fichiers dérivé du state réel +
   * carte OBJECTIFS + carte GRAND REWRITE. Pas de sous-composant FileTree tant
   * qu'il n'est pas réutilisé ailleurs (checklist §10.2).
   */
  let { onOpenRewrite }: { onOpenRewrite: () => void } = $props();

  const acte2 = $derived(gameStore.state.acte >= 2);
  const bugsCount = $derived(Math.round(gameStore.state.bugs));
  const fileName = $derived(LANGUE_FILE_NAME[gameStore.state.langueActive]);
  const rootFolder = $derived(acte2 ? "acte-2-open-source/" : "acte-1-solo-dev/");

  const nextLockedGenerator = $derived(
    GENERATOR_IDS.find((id) => !gameStore.generatorView(id).unlocked),
  );

  const nextUnlockProgress = $derived.by(() => {
    const id = nextLockedGenerator;
    if (!id) return 100;
    const threshold = gameStore.unlockThresholdOf(id).toNumber();
    const current = gameStore.state.locTotal.toNumber();
    return Math.min(100, (current / threshold) * 100);
  });

  const actProgress = $derived(
    Math.min(100, (gameStore.state.locTotal.toNumber() / SEUIL_FIN_ACTE_1) * 100),
  );

  const openSourceFlavor = $derived(
    publicationOpenSourceFlavor(formatNumber(gameStore.state.stars, settings.numberNotation)),
  );

  // Grand Rewrite disponible dès acte >= 2, sans autre seuil (engine/actions.ts
  // `grandRewrite`) : avant l'Acte II, la seule "progression vers le seuil"
  // réelle est celle de la fin de l'Acte I, déjà calculée ci-dessus.
  const rewriteAvailable = $derived(acte2);
  const rewriteProgress = $derived(rewriteAvailable ? 100 : actProgress);
</script>

<aside class="explorer" aria-label="Explorateur de fichiers">
  <h2 class="section-title panel-title">Explorer</h2>

  <div class="tree mono">
    <div class="tree-row root">{rootFolder}</div>
    <div class="tree-row lvl1"><span class="connector" aria-hidden="true">├─▾</span> src/</div>
    <div class="tree-row lvl2">
      <span class="connector" aria-hidden="true">{acte2 ? "├──" : "└──"}</span> {fileName}
    </div>
    {#if acte2}
      <div class="tree-row lvl2">
        <span class="connector" aria-hidden="true">└──</span> debt.log
        <span class="badge del">{bugsCount}</span>
      </div>
    {/if}
    <div class="tree-row lvl1">
      <span class="connector" aria-hidden="true">├──</span> tests/
      <span class="badge del">0</span>
    </div>
    <div class="tree-row lvl1"><span class="connector" aria-hidden="true">└──</span> README.md</div>
  </div>

  <div class="card objectives-card">
    <h3 class="section-title">Objectifs</h3>
    {#if nextLockedGenerator}
      <p class="card-label">Prochain déblocage : {GENERATOR_LABELS[nextLockedGenerator]}</p>
      <div
        class="bar-track objectives-track"
        role="progressbar"
        aria-valuenow={Math.round(nextUnlockProgress)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Progression vers {GENERATOR_LABELS[nextLockedGenerator]}"
      >
        <div class="bar-fill add" aria-hidden="true" style="width: {nextUnlockProgress}%"></div>
      </div>
      <p class="card-pct mono">{Math.round(nextUnlockProgress)} %</p>
    {:else if gameStore.state.acte === 1}
      <p class="card-label">
        Fin de l'Acte I : {formatNumber(gameStore.state.locTotal, settings.numberNotation)} / {SEUIL_FIN_ACTE_1}
        LoC
      </p>
      <div
        class="bar-track objectives-track"
        role="progressbar"
        aria-valuenow={Math.round(actProgress)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Progression vers la fin de l'Acte I"
      >
        <div class="bar-fill add" aria-hidden="true" style="width: {actProgress}%"></div>
      </div>
      <p class="card-pct mono">{Math.round(actProgress)} %</p>
    {:else}
      <p class="card-label" title={openSourceFlavor.tooltip}>{openSourceFlavor.description}</p>
    {/if}
  </div>

  {#if rewriteAvailable}
    <button type="button" class="card rewrite-card" onclick={onOpenRewrite}>
      <h3 class="section-title">Grand Rewrite</h3>
      <div
        class="bar-track rewrite-track"
        role="progressbar"
        aria-valuenow="100"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Grand Rewrite disponible"
      >
        <div class="bar-fill meta" aria-hidden="true" style="width: 100%"></div>
      </div>
      <p class="card-hint">disponible — cliquer pour ouvrir</p>
    </button>
  {:else}
    <div class="card rewrite-card readonly">
      <h3 class="section-title">Grand Rewrite</h3>
      <div
        class="bar-track rewrite-track"
        role="progressbar"
        aria-valuenow={Math.round(rewriteProgress)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Progression vers le Grand Rewrite"
      >
        <div class="bar-fill meta" aria-hidden="true" style="width: {rewriteProgress}%"></div>
      </div>
      <p class="card-hint">disponible dès l'Acte II</p>
    </div>
  {/if}
</aside>

<style>
  .explorer {
    grid-area: explorer;
    background: var(--bg-panel);
    border-right: 1px solid var(--rule);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .panel-title {
    padding: 12px 12px 8px;
  }

  .tree {
    font-family: var(--mono);
    font-size: 11.5px;
  }

  .tree-row {
    height: 22px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 12px;
    color: var(--fg-2);
    white-space: nowrap;
  }

  .tree-row.root {
    color: var(--fg);
  }

  .tree-row.lvl1 {
    padding-left: 12px;
  }

  .tree-row.lvl2 {
    padding-left: 24px;
  }

  .connector {
    color: var(--fg-3);
  }

  .badge {
    margin-left: auto;
    font-family: var(--mono);
    font-weight: 700;
    font-size: 9.5px;
    padding: 1px 5px;
    border-radius: var(--r-sm);
  }

  .badge.del {
    background: var(--del-bg);
    color: var(--del);
  }

  .card {
    margin: 12px 8px 0;
    padding: 12px;
    border-radius: var(--r-md);
    background: var(--info-bg);
    border: 1px solid var(--info-line);
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: left;
  }

  .rewrite-card {
    background: var(--meta-bg);
    border-color: var(--meta-line);
    cursor: pointer;
    font: inherit;
    width: calc(100% - 16px);
  }

  .rewrite-card.readonly {
    cursor: default;
  }

  .card-label {
    margin: 0;
    font-family: var(--sans);
    font-size: 12px;
    color: var(--fg-2);
  }

  .card-pct {
    margin: 0;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--fg);
  }

  .card-hint {
    margin: 0;
    font-family: var(--sans);
    font-size: 12px;
    color: var(--fg-3);
  }

  .objectives-track {
    height: 5px;
  }

  .rewrite-track {
    height: 5px;
  }

  @media (max-width: 1179px) {
    .explorer {
      display: none;
    }
  }
</style>
