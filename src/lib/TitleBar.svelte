<script lang="ts">
  import { gameStore } from "./gameStore.svelte";
  import { settings } from "./settings.svelte";
  import type { NumberNotation } from "./format";

  /**
   * Zone 1 (visual-identity.md §3.4) : châssis --bg-frame, 38px. Chaque entrée
   * de menu a une action réelle ; celles qui n'en ont pas sont retirées, pas
   * grisées (§3.4) — exception explicite pour "Prestige", désactivé tant que
   * le Rewrite est indisponible plutôt que retiré (mapping MVP tranché §3.4).
   */
  let { onOpenRewrite }: { onOpenRewrite: () => void } = $props();

  const rewriteAvailable = $derived(gameStore.state.acte >= 2);
  const acte2 = $derived(gameStore.state.acte >= 2);

  const ACTE_INFO: Record<number, { roman: string; branch: string }> = {
    1: { roman: "i", branch: "acte-1/solo-dev" },
    2: { roman: "ii", branch: "acte-2/open-source" },
  };
  const acteInfo = $derived(ACTE_INFO[gameStore.state.acte] ?? ACTE_INFO[1]);

  let filePopoverOpen = $state(false);
  let editPopoverOpen = $state(false);
  let importText = $state("");
  let importError = $state("");
  let fileInputEl: HTMLInputElement | undefined = $state();

  function closePopovers() {
    filePopoverOpen = false;
    editPopoverOpen = false;
  }

  function toggleFile() {
    editPopoverOpen = false;
    filePopoverOpen = !filePopoverOpen;
  }

  function toggleEdit() {
    filePopoverOpen = false;
    editPopoverOpen = !editPopoverOpen;
  }

  function runAction() {
    closePopovers();
    gameStore.clickCode();
  }

  function refactorAction() {
    closePopovers();
    document.getElementById("refactor-hold-button")?.focus();
  }

  function prestigeAction() {
    closePopovers();
    if (rewriteAvailable) onOpenRewrite();
  }

  function exportAction() {
    const encoded = gameStore.exportSave();
    const blob = new Blob([encoded], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devcremental-save.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importAction() {
    importError = "";
    try {
      gameStore.importSave(importText.trim());
      importText = "";
      filePopoverOpen = false;
    } catch (err) {
      importError = err instanceof Error ? err.message : String(err);
    }
  }

  function importFromFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    file.text().then((text) => {
      importText = text.trim();
      importAction();
    });
  }

  function resetAction() {
    if (window.confirm("Réinitialiser la partie ? Cette action efface la progression actuelle.")) {
      gameStore.resetGame();
      closePopovers();
    }
  }
</script>

<header class="titlebar">
  <div class="dots" aria-hidden="true">
    <span class="dot del"></span>
    <span class="dot warn"></span>
    <span class="dot add"></span>
  </div>

  <nav class="menu">
    <div class="menu-item">
      <button type="button" class="menu-btn" onclick={toggleFile} aria-expanded={filePopoverOpen}>
        File
      </button>
      {#if filePopoverOpen}
        <div class="popover">
          <button type="button" class="popover-action" onclick={exportAction}
            >exporter la sauvegarde</button
          >
          <button type="button" class="popover-action" onclick={() => fileInputEl?.click()}
            >importer un fichier…</button
          >
          <input
            bind:this={fileInputEl}
            type="file"
            accept="text/plain"
            class="hidden-input"
            onchange={importFromFile}
          />
          <label class="popover-label" for="import-textarea">ou coller l'export :</label>
          <textarea id="import-textarea" bind:value={importText} rows="2"></textarea>
          <button type="button" class="popover-action confirm" onclick={importAction}
            >importer</button
          >
          {#if importError}
            <p class="popover-error">{importError}</p>
          {/if}
        </div>
      {/if}
    </div>

    <div class="menu-item">
      <button type="button" class="menu-btn" onclick={toggleEdit} aria-expanded={editPopoverOpen}>
        Edit
      </button>
      {#if editPopoverOpen}
        <div class="popover">
          <label class="popover-check">
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onchange={() => settings.toggleReduceMotion()}
            />
            réduire les animations
          </label>
          <label class="popover-check">
            notation des nombres :
            <select
              value={settings.numberNotation}
              onchange={(e) =>
                settings.setNumberNotation(e.currentTarget.value as NumberNotation)}
            >
              <option value="integer">Entier</option>
              <option value="compact">Compact</option>
              <option value="scientific">Scientifique</option>
              <option value="hex">Hexadécimal</option>
            </select>
          </label>
          <button type="button" class="popover-action danger" onclick={resetAction}
            >réinitialiser la partie</button
          >
        </div>
      {/if}
    </div>

    <button type="button" class="menu-btn" onclick={runAction}>Run</button>
    {#if acte2}
      <button type="button" class="menu-btn" onclick={refactorAction}>Refactor</button>
    {/if}
    <button
      type="button"
      class="menu-btn"
      disabled={!rewriteAvailable}
      aria-disabled={!rewriteAvailable}
      onclick={prestigeAction}
    >
      Prestige
    </button>
  </nav>

  <div class="context mono">
    devcremental — acte {acteInfo.roman} — git:({acteInfo.branch})
  </div>
</header>

<style>
  .titlebar {
    grid-area: title;
    height: 38px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 12px;
    background: var(--bg-frame);
    border-bottom: 1px solid var(--rule);
    position: relative;
  }

  .dots {
    display: flex;
    gap: 8px;
    margin-right: 16px;
  }

  .dot {
    width: 11px;
    height: 11px;
    border-radius: var(--r-full);
  }

  .dot.del {
    background: var(--del);
  }
  .dot.warn {
    background: var(--warn);
  }
  .dot.add {
    background: var(--add);
  }

  @media (max-width: 899px) {
    .dots {
      display: none;
    }
  }

  .menu {
    display: flex;
    gap: 4px;
    position: relative;
  }

  .menu-item {
    position: relative;
  }

  .menu-btn {
    font-family: var(--sans);
    font-size: 12px;
    color: var(--fg-2);
    background: transparent;
    border: none;
    padding: 4px 8px;
    border-radius: var(--r-sm);
    cursor: pointer;
    transition: background-color 100ms linear, color 100ms linear;
  }

  .menu-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: var(--fg);
  }

  .menu-btn:disabled {
    color: var(--fg-4);
    cursor: not-allowed;
  }

  .popover {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 220px;
    padding: 12px;
    background: var(--bg-panel);
    border: 1px solid var(--rule-strong);
    border-radius: var(--r-md);
    box-shadow: none;
  }

  .popover-action {
    text-align: left;
    font-family: var(--sans);
    font-size: 12px;
    color: var(--fg-2);
    background: transparent;
    border: 1px solid var(--rule);
    border-radius: var(--r-sm);
    padding: 6px 8px;
    cursor: pointer;
  }

  .popover-action:hover {
    border-color: var(--rule-strong);
    color: var(--fg);
  }

  .popover-action.confirm {
    border-color: var(--add-line);
    color: var(--add);
  }

  .popover-action.danger {
    border-color: var(--del-line);
    color: var(--del);
  }

  .popover-check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--sans);
    font-size: 12px;
    color: var(--fg-2);
  }

  .popover-check select {
    font-family: var(--sans);
    font-size: 12px;
    color: var(--fg-2);
    background: var(--bg-sunken);
    border: 1px solid var(--rule);
    border-radius: var(--r-sm);
    padding: 2px 4px;
  }

  .popover-label {
    font-family: var(--sans);
    font-size: 11px;
    color: var(--fg-3);
  }

  .popover textarea {
    font-family: var(--mono);
    font-size: 11px;
    background: var(--bg-sunken);
    color: var(--fg-2);
    border: 1px solid var(--rule);
    border-radius: var(--r-sm);
    resize: vertical;
  }

  .popover-error {
    color: var(--del);
    font-family: var(--sans);
    font-size: 11px;
  }

  .hidden-input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }

  .context {
    margin-left: auto;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--fg-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 899px) {
    .context {
      display: none;
    }
  }
</style>
