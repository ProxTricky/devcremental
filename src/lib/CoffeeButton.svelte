<script lang="ts">
  import { CAFE_MULT_CLIC } from "../engine/constants";
  import { CAFE_FLAVOR } from "./flavorText";
  import { gameStore } from "./gameStore.svelte";

  // §3.7 4c/§3.9 : le stock ☕ N/3 migre dans la barre de statut (StatusBar) —
  // ce bouton ne garde que l'action et le statut de buff actif (role=status).
  const canDrink = $derived(gameStore.state.cafeStock >= 1);
  const buffSecondsLeft = $derived(Math.ceil(gameStore.state.cafeBuffRemaining));
</script>

<div class="coffee">
  <button
    type="button"
    class="btn-secondary"
    disabled={!canDrink}
    title={CAFE_FLAVOR.tooltip}
    onclick={() => gameStore.drinkCoffee()}
  >
    Boire un café
  </button>
  {#if gameStore.cafeBuffActive}
    <div class="coffee-buff mono" role="status">
      Buff actif ×{CAFE_MULT_CLIC} — {buffSecondsLeft}s
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
