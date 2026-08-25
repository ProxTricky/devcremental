<script lang="ts">
  import { gameStore } from "./gameStore.svelte";
  import { LANGUE_FILE_NAME } from "./langueLabels";

  /**
   * Zone 4a (visual-identity.md §3.7 4a) : onglets main.<ext> / debt.log /
   * README.md. Le point ambre "non enregistré" et le badge de bugs sont l'état
   * de jeu lui-même (§4.2 signature), pas une décoration.
   */
  let { activeTab = $bindable("main") }: { activeTab: "main" | "debt" | "readme" } = $props();

  const acte2 = $derived(gameStore.state.acte >= 2);
  const fileName = $derived(LANGUE_FILE_NAME[gameStore.state.langueActive]);
  const detteEnCours = $derived(gameStore.state.dette.gt(0));
  const bugsCount = $derived(Math.round(gameStore.state.bugs));
</script>

<div class="tabbar mono">
  <button type="button" class="tab" class:active={activeTab === "main"} onclick={() => (activeTab = "main")}>
    {#if detteEnCours}<span class="dot" aria-hidden="true"></span>{/if}
    {fileName}
  </button>
  {#if acte2}
    <button type="button" class="tab" class:active={activeTab === "debt"} onclick={() => (activeTab = "debt")}>
      debt.log
      {#if bugsCount > 0}<span class="badge">{bugsCount}</span>{/if}
    </button>
  {/if}
  <button type="button" class="tab" class:active={activeTab === "readme"} onclick={() => (activeTab = "readme")}>
    README.md
  </button>
</div>

<style>
  .tabbar {
    flex: 0 0 auto;
    height: 31px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--rule);
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .tabbar::-webkit-scrollbar {
    display: none;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 100%;
    padding: 0 12px;
    font-size: 11.5px;
    color: var(--fg-3);
    background: transparent;
    border: none;
    border-right: 1px solid var(--rule);
    cursor: pointer;
    white-space: nowrap;
    transition: color 100ms linear;
  }

  .tab:hover:not(.active) {
    color: var(--fg-2);
  }

  .tab.active {
    background: var(--bg-app);
    box-shadow: inset 0 2px 0 var(--add);
    color: var(--fg);
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: var(--r-full);
    background: var(--warn);
  }

  .badge {
    font-weight: 700;
    font-size: 9.5px;
    color: var(--del);
    background: var(--del-bg);
    border-radius: var(--r-sm);
    padding: 1px 5px;
  }
</style>
