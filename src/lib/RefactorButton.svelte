<script lang="ts">
  import { gameStore } from "./gameStore.svelte";
  import { REFACTOR_FLAVOR, REFACTOR_FLAVOR_NAME } from "./flavorText";

  // dette-technique-grand-rewrite.md §2.1 : action à MAINTENIR, pas un clic
  // instantané. `pressed` est un état purement local (feedback immédiat) ; la
  // vraie source de vérité (`state.refactorActif`, la dette qui redescend) vient
  // du worker via gameStore, déjà synchronisé à 10/s — binding réactif simple.
  let pressed = $state(false);

  function start() {
    if (pressed) return;
    pressed = true;
    gameStore.startRefactor();
  }

  function stop() {
    if (!pressed) return;
    pressed = false;
    gameStore.stopRefactor();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.repeat) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault(); // évite le scroll de page sur Espace
    start();
  }

  function onKeyup(e: KeyboardEvent) {
    if (e.key !== "Enter" && e.key !== " ") return;
    stop();
  }
</script>

<div class="refactor-wrapper">
  <button
    id="refactor-hold-button"
    type="button"
    class="refactor-button"
    class:active={pressed}
    aria-pressed={pressed}
    title={REFACTOR_FLAVOR.tooltip}
    onmousedown={start}
    onmouseup={stop}
    onmouseleave={stop}
    ontouchstart={start}
    ontouchend={stop}
    ontouchcancel={stop}
    onkeydown={onKeydown}
    onkeyup={onKeyup}
    onblur={stop}
  >
    <!-- §3.8 : gutter ~ au repos, ! en cours — double la couleur du bouton,
         jamais seule porteuse d'info (§8.7). Pas de barre de progression : la
         barre de dette juste au-dessus en tient déjà lieu. -->
    <span class="refactor-glyph mono" aria-hidden="true">{pressed ? "!" : "~"}</span>
    <span class="refactor-label mono"
      >{REFACTOR_FLAVOR_NAME}{pressed ? " — en cours…" : ""}</span
    >
  </button>
  <p class="refactor-flavor">{REFACTOR_FLAVOR.description}</p>
</div>

<style>
  .refactor-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .refactor-flavor {
    margin: 0;
    font-family: var(--sans);
    font-size: 12px;
    line-height: 1.45;
    color: var(--fg-3);
  }

  .refactor-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    padding: 10px 16px;
    border-radius: var(--r-md);
    border: 1px solid var(--info-line-hi);
    background: transparent;
    color: var(--info);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    /* Un maintien tactile ne doit jamais déclencher le scroll de page (§3.8). */
    touch-action: none;
    transition: background-color 100ms linear;
  }

  .refactor-button.active {
    background: rgba(88, 166, 255, 0.18);
    transition: background-color 100ms linear;
  }
</style>
