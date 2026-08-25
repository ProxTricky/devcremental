<script lang="ts">
  import { detteDivisor } from "../engine/formulas";
  import { gameStore } from "./gameStore.svelte";
  import { settings } from "./settings.svelte";
  import { UI_STRINGS } from "./uiStrings";

  // dette-technique-grand-rewrite.md §1.3 : le joueur doit RESSENTIR l'effet de
  // la dette, pas juste voir un nombre monter. `ratioPerdu` est dérivé de la
  // vraie formule de pénalité du moteur (`detteDivisor`), jamais d'un seuil
  // arbitraire choisi côté UI. divisor >= 1 toujours (dette >= 0, §1.4 : jamais
  // de plancher, le ratio tend vers 1 sans jamais l'atteindre).
  const dette = $derived(gameStore.state.dette);
  const ratioPerdu = $derived(1 - detteDivisor(dette).pow(-1).toNumber());
  const pctPerdu = $derived(Math.round(ratioPerdu * 100));

  /**
   * 3 paliers discrets (visual-identity.md §3.8) — p < 0.20 INFO, 0.20 ≤ p <
   * 0.50 WARN, p ≥ 0.50 ERROR. Calibré sur dette-technique-grand-rewrite.md
   * §1.3/§7 (le passage en ERROR coïncide avec le moment où le premier Grand
   * Rewrite est attendu).
   */
  type Tier = "info" | "warn" | "error";
  const tier = $derived<Tier>(
    ratioPerdu >= 0.5 ? "error" : ratioPerdu >= 0.2 ? "warn" : "info",
  );
  const MARKER: Record<Tier, string> = { info: "~", warn: "!", error: "−" };
  const ariaLabel = $derived(UI_STRINGS[settings.locale].debtIndicator.ariaLabel);
</script>

<div class="debt-row">
  <div
    class="bar-track debt-track"
    role="progressbar"
    aria-valuenow={pctPerdu}
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label={ariaLabel}
  >
    <div class="bar-fill debt" aria-hidden="true" style="width: {pctPerdu}%"></div>
  </div>
  <span class="debt-value mono tier-{tier}">
    <span aria-hidden="true">{MARKER[tier]}</span> −{pctPerdu}%
  </span>
</div>

<style>
  .debt-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .debt-track {
    flex: 1;
    height: 6px;
  }

  .debt-value {
    flex: 0 0 auto;
    font-weight: 500;
    font-size: 11.5px;
    color: var(--fg-2);
    transition: color 180ms linear;
  }

  .debt-value.tier-warn {
    color: var(--warn);
  }

  .debt-value.tier-error {
    color: var(--del);
  }
</style>
