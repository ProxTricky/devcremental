<script lang="ts">
  import { CAFE_MULT_CLIC } from "../engine/constants";
  import { CAFE_FLAVOR } from "./flavorText";
  import { gameStore } from "./gameStore.svelte";
  import { settings } from "./settings.svelte";
  import { UI_STRINGS } from "./uiStrings";

  // §3.7 4c/§3.9 : le stock ☕ N/3 migre dans la barre de statut (StatusBar) —
  // ce bouton ne garde que l'action et le statut de buff actif (role=status).
  const canDrink = $derived(gameStore.state.cafeStock >= 1);
  const buffSecondsLeft = $derived(Math.ceil(gameStore.state.cafeBuffRemaining));
  const flavor = $derived(CAFE_FLAVOR[settings.locale]);
  const t = $derived(UI_STRINGS[settings.locale].coffeeButton);
</script>

<div class="coffee">
  <button
    type="button"
    class="btn-secondary"
    disabled={!canDrink}
    title={flavor.tooltip}
    onclick={() => gameStore.drinkCoffee()}
  >
    {t.drink}
  </button>
  {#if gameStore.cafeBuffActive}
    <div class="coffee-buff mono" role="status">
      {t.buffActive(CAFE_MULT_CLIC, buffSecondsLeft)}
    </div>
  {/if}
</div>

<style>
  .coffee {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn-secondary {
    min-height: 44px;
    padding: 0 16px;
    border-radius: var(--r-md);
    border: 1px solid var(--rule-strong);
    background: transparent;
    color: var(--fg-2);
    font-family: var(--sans);
    font-weight: 600;
    font-size: 12.5px;
    cursor: pointer;
    transition: background-color 100ms linear;
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.04);
  }

  .btn-secondary:disabled {
    cursor: not-allowed;
    color: var(--fg-3);
  }

  .coffee-buff {
    font-size: 12px;
    font-weight: 500;
    color: var(--warn);
  }
</style>
