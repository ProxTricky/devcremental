<script lang="ts">
  import { ARCHETYPES, JS_CHAOS_MAX, JS_CHAOS_MIN, type LangueId } from "../engine/constants";
  import { karmaGagne } from "../engine/formulas";
  import { formatNumber } from "./format";
  import { LANGUE_FLAVOR } from "./flavorText";
  import { gameStore } from "./gameStore.svelte";
  import { LANGUE_LABELS } from "./langueLabels";
  import { settings } from "./settings.svelte";
  import { UI_STRINGS } from "./uiStrings";

  /**
   * Modale Grand Rewrite (visual-identity.md §5) : le seul plein écran du jeu.
   * Contrôlée depuis l'extérieur via `open` bindable — 3 points d'entrée
   * (ActivityBar, ExplorerPanel, TitleBar "Prestige") partagent une seule
   * instance de la modale, montée une fois dans App.svelte.
   */
  let { open = $bindable(false) }: { open: boolean } = $props();

  const ARCHETYPE_IDS: Exclude<LangueId, "none">[] = ["rust", "python", "javascript"];

  let dialogEl: HTMLDialogElement | undefined = $state();
  let choice = $state<Exclude<LangueId, "none">>("rust");
  let triggerEl: HTMLElement | null = null;

  const karmaPreview = $derived(karmaGagne(gameStore.state.locTotal));
  const t = $derived(UI_STRINGS[settings.locale].grandRewriteModal);
  const langueFlavor = $derived(LANGUE_FLAVOR[settings.locale]);

  $effect(() => {
    if (open) {
      triggerEl = document.activeElement as HTMLElement | null;
      dialogEl?.showModal();
    } else {
      dialogEl?.close();
      triggerEl?.focus();
    }
  });

  function requestClose() {
    open = false;
  }

  function confirm() {
    gameStore.triggerGrandRewrite(choice);
    open = false;
  }

  /**
   * Effets numériques d'un archétype (§5) : lus directement dans `ARCHETYPES` /
   * `JS_CHAOS_MIN` / `JS_CHAOS_MAX` (src/engine/constants.ts), jamais réécrits à
   * la main — seules les lignes dont le multiplicateur diffère de 1 (donc a un
   * effet réel) sont affichées.
   */
  interface EffectLine {
    glyph: "+" | "-" | "~";
    text: string;
  }

  function effectLines(langue: Exclude<LangueId, "none">): EffectLine[] {
    const a = ARCHETYPES[langue];
    const lines: EffectLine[] = [];
    if (a.multProdLocTick === null) {
      lines.push({
        glyph: "~",
        text:
          settings.locale === "en"
            ? `${t.effectProd} ×${JS_CHAOS_MIN.toFixed(2)}…×${JS_CHAOS_MAX.toFixed(2)} per tick`
            : `${t.effectProd} ×${JS_CHAOS_MIN.toFixed(2)}…×${JS_CHAOS_MAX.toFixed(2)} par tick`,
      });
    } else if (a.multProdLocTick !== 1) {
      lines.push({
        glyph: a.multProdLocTick > 1 ? "+" : "-",
        text: `${t.effectProd} ×${a.multProdLocTick.toFixed(2)}`,
      });
    }
    if (a.multTauxBug !== 1) {
      lines.push({
        glyph: a.multTauxBug < 1 ? "+" : "-",
        text: `${t.effectBugs} ×${a.multTauxBug.toFixed(2)}`,
      });
    }
    if (a.multCoefDetteActe !== 1) {
      lines.push({
        glyph: a.multCoefDetteActe < 1 ? "+" : "-",
        text: `${t.effectDebt} ×${a.multCoefDetteActe.toFixed(2)}`,
      });
    }
    return lines;
  }
</script>

<dialog
  bind:this={dialogEl}
  class="rewrite-dialog"
  aria-modal="true"
  aria-labelledby="rewrite-title"
  onclose={requestClose}
  oncancel={requestClose}
>
  <div class="overtitle mono">{t.overtitle}</div>
  <h1 id="rewrite-title" class="rewrite-title">{t.title}</h1>
  <p class="rewrite-paragraph">
    {t.paragraph}
  </p>

  <div class="conversion">
    <div class="conversion-block mono">
      {formatNumber(gameStore.state.locTotal, settings.numberNotation)} LoC
    </div>
    <span class="conversion-arrow mono" aria-hidden="true">→</span>
    <div class="conversion-block mono add-text">
      +{formatNumber(karmaPreview, settings.numberNotation)} karma
    </div>
  </div>

  <fieldset class="archetypes">
    <legend class="section-title">{t.legend}</legend>
    <div class="archetype-grid">
      {#each ARCHETYPE_IDS as langue (langue)}
        <label class="archetype-card" class:selected={choice === langue}>
          {#if choice === langue}<span class="chosen-tag mono" aria-hidden="true">{t.chosenTag}</span>{/if}
          <input
            type="radio"
            class="archetype-radio"
            name="langue"
            value={langue}
            checked={choice === langue}
            onchange={() => (choice = langue)}
          />
          <span class="archetype-name mono">{LANGUE_LABELS[langue]}</span>
          <span class="archetype-effects mono">
            {#each effectLines(langue) as line, i (i)}
              <span class="effect-line" class:add-text={line.glyph === "+"} class:del-text={line.glyph === "-"}>
                <span aria-hidden="true">{line.glyph}</span> {line.text}
              </span>
            {/each}
          </span>
          <span class="archetype-flavor" title={langueFlavor[langue].tooltip}>
            {langueFlavor[langue].description}
          </span>
        </label>
      {/each}
    </div>
  </fieldset>

  <div class="rewrite-actions">
    <button type="button" class="btn-cancel" onclick={requestClose}>{t.cancel}</button>
    <button type="button" class="btn-confirm mono" onclick={confirm}>{t.confirm}</button>
  </div>
</dialog>

<style>
  .rewrite-dialog {
    max-width: 820px;
    width: min(820px, calc(100vw - 32px));
    padding: 32px;
    border-radius: var(--r-lg);
    border: 1px solid var(--meta-line-hi);
    background:
      radial-gradient(120% 80% at 50% 0%, rgba(210, 168, 255, 0.07), transparent 60%),
      var(--bg-app);
    color: var(--fg);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
    animation: riseIn 180ms cubic-bezier(0.2, 0.7, 0.3, 1);
  }

  .rewrite-dialog::backdrop {
    background: rgba(3, 5, 8, 0.72);
  }

  :global(.reduce-motion) .rewrite-dialog {
    animation: riseIn-reduced 120ms linear;
  }

  @keyframes riseIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes riseIn-reduced {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .overtitle {
    font-weight: 700;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--meta);
  }

  .rewrite-title {
    margin: 4px 0 12px;
    font-family: var(--sans);
    font-weight: 600;
    font-size: 22px;
    line-height: 1.2;
    text-transform: lowercase;
    color: var(--fg);
  }

  .rewrite-paragraph {
    max-width: 60ch;
    font-family: var(--sans);
    font-size: 12px;
    line-height: 1.5;
    color: var(--fg-2);
    margin: 0 0 20px;
  }

  .conversion {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .conversion-block {
    padding: 12px 16px;
    border-radius: var(--r-md);
    background: var(--bg-sunken);
    font-size: 13.5px;
    color: var(--fg);
  }

  .conversion-arrow {
    color: var(--fg-3);
  }

  .add-text {
    color: var(--add);
  }

  .del-text {
    color: var(--del);
  }

  .archetypes {
    border: none;
    padding: 0;
    margin: 0 0 24px;
  }

  .archetypes legend {
    padding: 0 0 8px;
  }

  .archetype-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  @media (max-width: 899px) {
    .archetype-grid {
      grid-template-columns: 1fr;
    }
  }

  .archetype-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    border-radius: var(--r-md);
    border: 1px solid var(--rule);
    background: rgba(255, 255, 255, 0.02);
    cursor: pointer;
    transition: border-color 100ms linear;
  }

  .archetype-card:hover {
    border-color: var(--rule-strong);
  }

  .archetype-card.selected {
    border-color: var(--meta-line-hi);
    background: var(--meta-bg);
  }

  .archetype-card:has(.archetype-radio:focus-visible) {
    outline: 2px solid var(--info);
    outline-offset: 2px;
  }

  .archetype-radio {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    margin: 0;
  }

  .chosen-tag {
    position: absolute;
    top: 12px;
    right: 12px;
    font-weight: 700;
    font-size: 9.5px;
    color: var(--meta);
  }

  .archetype-name {
    font-weight: 500;
    font-size: 13px;
    color: var(--fg);
  }

  .archetype-effects {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11.5px;
  }

  .effect-line {
    color: var(--fg-2);
  }

  .archetype-flavor {
    font-family: var(--sans);
    font-size: 12px;
    line-height: 1.4;
    color: var(--fg-3);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .rewrite-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .rewrite-actions button {
    min-height: 44px;
    padding: 0 16px;
    border-radius: var(--r-md);
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-cancel {
    border: 1px solid var(--rule-strong);
    background: transparent;
    color: var(--fg-2);
    font-family: var(--sans);
  }

  .btn-confirm {
    border: 1px solid var(--meta-line-hi);
    background: linear-gradient(180deg, rgba(210, 168, 255, 0.16), rgba(210, 168, 255, 0.05));
    color: var(--meta);
  }

  @media (max-width: 899px) {
    .rewrite-dialog {
      max-width: none;
      width: 100%;
      height: 100%;
      max-height: 100%;
      inset: 0;
      margin: 0;
      border-radius: var(--r-0);
      overflow-y: auto;
    }
  }
</style>
