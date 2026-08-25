<script lang="ts">
  import { untrack } from "svelte";
  import { gameStore } from "./gameStore.svelte";
  import { settings } from "./settings.svelte";
  import { initialTerminalCursor, nextTerminalLine } from "./terminalLines";

  /** Faux terminal Acte I : chaque clic "Écrire du code" fait défiler une ligne
   * de code plausible (contenu placeholder, cf. terminalLines.ts). Premier
   * feedback du jeu (CLAUDE.md) — purement décoratif/textuel, pas un vrai éditeur.
   *
   * Signature visuelle du jeu (visual-identity.md §4.1) : le numéro de gutter de
   * chaque ligne n'est PAS un index de tableau, c'est `locTotal` figé au moment
   * où la ligne est écrite. Entre deux clics, les générateurs produisent en idle
   * -> le numéro saute (12 477 puis 12 480). C'est le seul indicateur du débit
   * d'automatisation du joueur.
   */
  const MAX_LINES = 40;

  let lines = $state<{ id: number; text: string; loc: number }[]>([]);
  let nextId = 0;
  let containerEl: HTMLDivElement | undefined = $state();
  // État de la machine à 2 états de terminalLines.ts (fonction en cours de
  // révélation / prochaine ligne = une blague) — un curseur par instance de
  // terminal, jamais partagé, jamais réinitialisé en cours de run (une
  // fonction commencée dans l'ancien langage finit de se révéler telle
  // quelle si un Grand Rewrite change `langueActive` entre-temps ; la
  // prochaine fonction tirée respectera le nouveau langage).
  let cursor = initialTerminalCursor();

  $effect(() => {
    const count = gameStore.codeClickCount;
    if (count === 0) return; // pas de ligne au montage, seulement sur un vrai clic
    // untrack : push/shift lisent lines.length en interne, ce qui sinon rend cet
    // effet dépendant de sa propre écriture -> boucle infinie (Svelte 5, cf.
    // effect_update_depth_exceeded observé en test manuel).
    untrack(() => {
      const result = nextTerminalLine(cursor, gameStore.state.langueActive, settings.locale);
      cursor = result.cursor;
      lines.push({
        id: nextId++,
        text: result.text,
        // §4.1 : la valeur de locTotal AU MOMENT du push, jamais recalculée après.
        loc: gameStore.state.locTotal.round().toNumber(),
      });
      if (lines.length > MAX_LINES) {
        lines.shift();
      }
    });
  });

  $effect(() => {
    void lines.length; // dépendance explicite : re-scroll à chaque nouvelle ligne
    if (containerEl) {
      containerEl.scrollTop = containerEl.scrollHeight;
    }
  });

  /** §4.1 : séparateur de milliers = espace fine insécable (U+202F), pas de
   * virgule (locale française du reste du jeu). Au-delà de 99 999 la spec bascule
   * sur la notation compacte (formatNumber) pour tenir dans 5ch ; cette dernière
   * n'est pas encore implémentée en Phase 1 (cf. lib/format.ts) et retombe donc
   * proprement sur l'entier groupé, sans erreur. */
  function formatGutter(n: number): string {
    // Groupement manuel (pas de toLocaleString) : deterministe, U+202F garanti.
    return Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  /** §4.4 : coloration syntaxique minimale et fermée — 3 règles, regex triviales,
   * classification par LIGNE ENTIÈRE (pas de moteur de highlighting par token). */
  const COMMENT_RE = /^\s*(\/\/|#|--)/;
  const KEYWORD_RE =
    /\b(try|catch|except|pass|return|const|let|fn|def|import|git|commit|push|pub|struct|impl|match|use|class|from|self|None|Some|Ok|Err)\b/;

  function classify(text: string): "comment" | "keyword" | "plain" {
    if (COMMENT_RE.test(text)) return "comment";
    if (KEYWORD_RE.test(text)) return "keyword";
    return "plain";
  }
</script>

<!-- Décoratif : redondant avec le compteur de LoC (seule source d'information
     accessible), donc masqué aux lecteurs d'écran plutôt que de les spammer à
     ~2 annonces/seconde en jeu actif. -->
<div
  class="terminal mono"
  class:reduce-motion={settings.reduceMotion}
  bind:this={containerEl}
  aria-hidden="true"
>
  {#if lines.length === 0}
    <!-- §4.3 : avant le premier clic, le caret attend seul sur la ligne 1. -->
    <div class="terminal-row">
      <span class="terminal-gutter">1</span>
      <span class="terminal-content"
        ><span class="caret">▌</span></span
      >
    </div>
  {:else}
    {#each lines as line, i (line.id)}
      <div class="terminal-row">
        <span class="terminal-gutter">{formatGutter(line.loc)}</span>
        <span
          class="terminal-content {classify(line.text)}"
          class:current={i === lines.length - 1}
          >{line.text}{#if i === lines.length - 1}<span class="caret">▌</span
            >{/if}</span
        >
      </div>
    {/each}
  {/if}
</div>

<style>
  .terminal {
    background: var(--bg-app);
    padding: 10px 0;
    height: clamp(240px, 44svh, 420px);
    overflow-y: auto;
    overflow-x: hidden;
    font-size: 12.5px;
    line-height: 20px;
    text-align: left;
    scroll-behavior: auto; /* un terminal ne scrolle jamais en douceur (§7) */

    /* Scrollbar 8px, thumb --rule-strong (§10.3), pas de flèches. */
    scrollbar-width: thin;
    scrollbar-color: var(--rule-strong) transparent;
  }

  .terminal::-webkit-scrollbar {
    width: 8px;
  }

  .terminal::-webkit-scrollbar-track {
    background: transparent;
  }

  .terminal::-webkit-scrollbar-thumb {
    background: var(--rule-strong);
    border-radius: var(--r-0);
  }

  @media (max-width: 899px) {
    .terminal {
      height: clamp(200px, 34svh, 300px);
    }
  }

  .terminal-row {
    display: flex;
  }

  .terminal-gutter {
    flex: 0 0 5ch;
    min-width: 44px;
    position: sticky;
    left: 0;
    padding-right: 8px;
    text-align: right;
    color: var(--fg-2);
    background: var(--bg-app);
    border-right: 1px solid var(--rule);
    font-size: 11.5px;
    line-height: 20px;
  }

  @media (max-width: 899px) {
    .terminal-gutter {
      flex-basis: 4ch;
      min-width: 0;
    }
  }

  .terminal-content {
    flex: 1;
    padding-left: 8px;
    white-space: pre;
    color: var(--fg-2);
  }

  /* §4.4 : classification par ligne — le commentaire reste --fg-3 même actif. */
  .terminal-content.comment {
    color: var(--fg-3);
  }

  .terminal-content.keyword {
    color: var(--del);
  }

  .terminal-content.plain.current {
    color: var(--fg);
  }

  .caret {
    color: var(--add);
    animation: caret-blink 1100ms steps(1) infinite;
  }

  /* §4.3/§7 : seule boucle animée du jeu. En reduce-motion, le caret reste
     allumé fixe — il porte l'information "c'est ici que ça s'écrit", il n'est
     jamais supprimé. */
  .terminal.reduce-motion .caret {
    animation: none;
    opacity: 1;
  }

  @keyframes caret-blink {
    0%,
    50% {
      opacity: 1;
    }
    50.001%,
    100% {
      opacity: 0;
    }
  }
</style>
