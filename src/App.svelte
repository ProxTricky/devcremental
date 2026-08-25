<script lang="ts">
  import ActivityBar from "./lib/ActivityBar.svelte";
  import BottomPanel from "./lib/BottomPanel.svelte";
  import EditorView from "./lib/EditorView.svelte";
  import ExplorerPanel from "./lib/ExplorerPanel.svelte";
  import GrandRewriteModal from "./lib/GrandRewriteModal.svelte";
  import ProjectPanel from "./lib/ProjectPanel.svelte";
  import { settings } from "./lib/settings.svelte";
  import StatsHeader from "./lib/StatsHeader.svelte";
  import StatusBar from "./lib/StatusBar.svelte";
  import TabBar from "./lib/TabBar.svelte";
  import TitleBar from "./lib/TitleBar.svelte";
  import { UI_STRINGS } from "./lib/uiStrings";

  /**
   * Workbench d'éditeur plein écran (visual-identity.md §3) : châssis
   * (TitleBar/StatusBar) en haut et en bas, ActivityBar + ExplorerPanel à
   * gauche, ProjectPanel à droite, colonne centrale (onglets → stats → vue
   * d'acte → panneau bas) au milieu. Une seule instance de GrandRewriteModal,
   * ouverte depuis 3 points d'entrée (§3.5/§3.6/§3.4).
   */
  let activeTab = $state<"main" | "debt" | "readme">("main");
  let rewriteOpen = $state(false);

  function openRewrite() {
    rewriteOpen = true;
  }

  // i18n.ts (demande user du 2026-08-25) : synchronise l'attribut `lang` du
  // document avec la langue choisie/détectée — figé à "fr" dans index.html
  // jusqu'ici, faux dès que le joueur bascule en anglais.
  $effect(() => {
    document.documentElement.lang = settings.locale;
  });
</script>

<a href="#main-content" class="skip-link">{UI_STRINGS[settings.locale].skipLink}</a>

<div class="app-shell" class:reduce-motion={settings.reduceMotion}>
  <TitleBar onOpenRewrite={openRewrite} />
  <ActivityBar onOpenRewrite={openRewrite} />
  <ExplorerPanel onOpenRewrite={openRewrite} />

  <div class="center" role="main" id="main-content">
    <TabBar bind:activeTab />
    <StatsHeader />
    <EditorView {activeTab} />
    <BottomPanel />
  </div>

  <ProjectPanel />
  <StatusBar />
</div>

<GrandRewriteModal bind:open={rewriteOpen} />

<style>
  .app-shell {
    height: 100svh;
    display: grid;
    grid-template-rows: 38px 1fr 26px;
    grid-template-columns: 52px clamp(158px, 17vw, 196px) 1fr clamp(232px, 25vw, 302px);
    grid-template-areas:
      "title title title title"
      "activity explorer center project"
      "status status status status";
    overflow: hidden;
  }

  .center {
    grid-area: center;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }

  @media (max-width: 1179px) {
    .app-shell {
      grid-template-columns: 52px 1fr clamp(232px, 25vw, 302px);
      grid-template-areas:
        "title title title"
        "activity center project";
    }
  }

  @media (max-width: 899px) {
    .app-shell {
      grid-template-columns: 1fr;
      grid-template-rows: 38px auto 1fr auto 26px;
      grid-template-areas:
        "title"
        "activity"
        "center"
        "project"
        "status";
    }
  }
</style>
