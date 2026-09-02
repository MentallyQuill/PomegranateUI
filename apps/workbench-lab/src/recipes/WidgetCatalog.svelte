<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import type { WidgetManifest, WidgetShape } from '@pomegranate-ui/contracts';
  import type { CatalogController, CatalogState, CatalogUtility } from '@pomegranate-ui/core';
  import type { WidgetRendererRegistry } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../mockup/host-context.js';
  import {
    catalogPreviewLabel,
    createCatalogGridController,
    type CatalogGridController,
    type CatalogScrollAnchor
  } from './CatalogGridController.js';
  import CatalogWidgetPreview from './CatalogWidgetPreview.svelte';

  type CatalogSnapshotPreflightController = CatalogController & {
    registerCatalogSnapshotPreflight?: (preflight: (next: CatalogState) => boolean) => () => void;
  };

  let {
    catalog,
    rendererRegistry,
    hostContext,
    instanceCounts = {},
    oncreate,
    onplace,
    onCatalogInvariantError,
    class: className = ''
  }: {
    catalog: CatalogController;
    rendererRegistry: WidgetRendererRegistry<LabHostContext>;
    hostContext: LabHostContext;
    instanceCounts?: Readonly<Record<string, number>>;
    oncreate: (manifest: WidgetManifest) => void;
    onplace?: (manifest: WidgetManifest, result: HTMLElement) => void;
    onCatalogInvariantError?: (error: Error) => void;
    class?: string;
  } = $props();

  const categories = [
    ['story', 'Story'],
    ['library', 'Library'],
    ['systems', 'Systems'],
    ['settings', 'Settings'],
    ['extensions', 'Extensions']
  ] as const;
  const utilities: readonly [CatalogUtility, string][] = [
    ['favorites', 'Favorites'],
    ['recent', 'Recent'],
    ['on-panel', 'On this Panel'],
    ['fits-layout', 'Fits this layout']
  ];
  const catalogContexts: Readonly<Record<string, string>> = Object.freeze({
    'story.transcript': 'active-story',
    'story.composer': 'active-story',
    'story.context': 'active-story',
    'story.turn-progress': 'active-story',
    'story.live-technical-detail': 'active-story',
    'story.turn-versions': 'selected-turn',
    'story.turn-inspector': 'selected-turn',
    'story.player-condition': 'active-story',
    'story.cast-condition': 'active-story',
    'story.room-ambience': 'active-story',
    'story.scene-backdrop': 'active-story',
    'runtime.background-work': 'global-runtime',
    'library.workspace': 'global-filtered',
    'library.stories': 'global',
    'library.characters': 'global-filtered',
    'story.characters': 'active-story',
    'library.personas': 'global-filtered',
    'story.personas': 'active-story',
    'library.lore': 'global-filtered',
    'story.lorebooks': 'active-story',
    'library.new-story': 'global-workflow',
    'library.character-card': 'selected-character',
    'story.character-card': 'selected-story-character',
    'library.persona-card': 'selected-persona',
    'library.greetings-quick-start': 'selected-character',
    'library.lore-entries': 'selected-lorebook',
    'library.lore-entry-editor': 'selected-lore-entry',
    'library.lorebook-details': 'selected-lorebook',
    'library.lore-relationships': 'selected-lore-entry',
    'library.lore-generator': 'selected-lorebook',
    'library.lived-location-builder': 'captured-host',
    'systems.cast': 'active-story-present-frame',
    'systems.background-presences': 'active-story-evidence',
    'systems.world-state': 'active-story-present-frame',
    'systems.attire': 'active-story-present-frame',
    'systems.genre-style': 'active-story-four-owner',
    'systems.dialogue-agency': 'active-story-dialogue-config',
    'systems.offscreen-life': 'active-story-dialogue-config',
    'systems.living-world': 'active-story-living-world',
    'systems.institutions-charter': 'active-story-present-frame',
    'systems.institution-diagnostics': 'selected-institution-body',
    'systems.background-life': 'active-story',
    'systems.character-relationships': 'selected-active-story-character-frame',
    'systems.memory-browser': 'selected-character',
    'systems.character-private-history': 'selected-character',
    'systems.persona-private-history': 'primary-persona',
    'systems.dramatic-irony': 'host-only',
    'systems.promise-ledger': 'host-only',
    'systems.multiplayer-invites': 'host-only',
    'systems.frames': 'active-story',
    'systems.whos-where': 'active-story',
    'systems.paradox-fixed-points': 'active-story',
    'settings.group.account-access': 'global',
    'settings.group.ai-models': 'global',
    'settings.group.appearance-accessibility': 'global-device',
    'settings.group.story-content': 'global',
    'settings.group.data-extensions-maintenance': 'global',
    'settings.group.advanced': 'global-with-story',
    'settings.provider-credentials': 'global-host',
    'settings.model-assignments': 'global-host',
    'settings.theme': 'global-device',
    'settings.reading-layout': 'global-device',
    'settings.sound-motion': 'global-device',
    'settings.accessibility': 'global-device',
    'settings.content': 'global-with-story',
    'settings.add-ons': 'global-host',
    'settings.maintenance': 'global-host',
    'settings.prompt-editor': 'global-host',
    'settings.raw-story-data': 'active-story-present-frame',
    'settings.connections': 'global-host',
    'settings.default-model': 'global-host',
    'settings.memory-search-model': 'global-host',
    'settings.response-limit': 'global-host',
    'settings.openrouter-routing': 'global-host',
    'settings.scene-backdrops': 'global-host',
    'settings.room-ambience': 'global-host',
    'settings.custom-theme': 'global-device',
    'settings.story-reading-layout': 'global-device',
    'settings.story-sound': 'global-device',
    'settings.accessibility-controls': 'global-device',
    'settings.content-preferences': 'global-host',
    'settings.narrator-voice': 'global-host',
    'settings.living-world-controls': 'active-story',
    'settings.installed-extensions': 'global-host',
    'settings.install-extension': 'global-host',
    'settings.host-updates': 'global-host',
    'settings.checkpoint-storage': 'global-host',
    'settings.memory-search-repair': 'global-host',
    'settings.diagnostics': 'global-host',
    'settings.prompt-preset-editor': 'global-host',
    'settings.raw-clothing-data': 'active-story-present-frame',
    'ext:atlas:campaign-clock': 'active-story',
    'ext:trail:location-notes': 'library',
    'ext:mythic:settings': 'settings'
  });
  const catalogIconSymbols: Readonly<Record<string, string>> = Object.freeze({
    'category.story': 'mi-512482',
    'category.library': 'mi-511528',
    'category.systems': 'mi-511777',
    'category.settings': 'mi-512616',
    'category.extensions': 'mi-511722',
    'cast.profile': 'mi-512690',
    'model.routing': 'mi-511724',
    'theme.contrast': 'mi-511741',
    'provider.connection': 'mi-511728',
    'status.sound': 'mi-513035',
    'backdrop.image': 'mi-512362',
    'background.queue': 'mi-512524',
    'status.info': 'mi-511836'
  });

  function catalogIconSymbol(iconKey: string | undefined): string {
    const symbol = iconKey ? catalogIconSymbols[iconKey] : undefined;
    if (!symbol) throw new Error(`Missing authoritative catalog icon for ${iconKey ?? '<missing>'}.`);
    return symbol;
  }

  function assertCatalogIcons(state: CatalogState) {
    for (const manifest of state.results) catalogIconSymbol(manifest.catalog?.iconKey);
  }

  function getInitialCatalogState(): CatalogState {
    const state = catalog.getState();
    assertCatalogIcons(state);
    return state;
  }

  function acceptsCatalogSnapshot(next: CatalogState): boolean {
    try {
      assertCatalogIcons(next);
      return true;
    } catch (error) {
      const invariant = error instanceof Error ? error : new Error(String(error));
      try {
        onCatalogInvariantError?.(invariant);
      } catch {
        // An error boundary cannot disrupt an external catalog dispatch.
      }
      return false;
    }
  }

  let catalogSnapshot: CatalogState | undefined = $state(getInitialCatalogState());
  let dialog: HTMLDialogElement;
  let searchInput: HTMLInputElement | undefined = $state();
  let resultsElement: HTMLElement | undefined = $state();
  let gridController: CatalogGridController | undefined;
  let returnFocus: HTMLElement | null = null;
  let restackRevision = 0;
  let pendingAnchor: CatalogScrollAnchor | null = null;
  let pendingRestoreFrame: number | null = null;
  let destroyed = false;

  const getResults = () => resultsElement
    ? [...resultsElement.querySelectorAll<HTMLElement>(':scope > [data-catalog-result]')]
    : [];

  $effect(() => {
    const current = catalog as CatalogSnapshotPreflightController;
    const updateSnapshot = (next: CatalogState) => {
      if (!acceptsCatalogSnapshot(next)) return;
      catalogSnapshot = next;
    };
    const unregisterPreflight = current.registerCatalogSnapshotPreflight?.(acceptsCatalogSnapshot);
    updateSnapshot(current.getState());
    const unsubscribe = current.subscribe(updateSnapshot);
    return () => {
      unregisterPreflight?.();
      unsubscribe();
    };
  });

  $effect(() => {
    if (!dialog || !catalogSnapshot) return;
    if (catalogSnapshot.open && !dialog.open) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      void tick().then(() => {
        searchInput?.focus({ preventScroll: true });
      });
    }
    if (!catalogSnapshot.open && dialog.open) {
      dialog.close();
      const target = returnFocus;
      returnFocus = null;
      void tick().then(() => target?.focus({ preventScroll: true }));
    }
  });

  $effect(() => {
    if (!catalogSnapshot?.open) return;
    catalogSnapshot.results;
    catalogSnapshot.resultMode;
    catalogSnapshot.previewWidth;
    const revision = restackRevision;
    const anchor = pendingAnchor;
    pendingAnchor = null;
    void tick().then(() => {
      if (destroyed || revision !== restackRevision) return;
      gridController?.sync();
      if (pendingRestoreFrame !== null) cancelAnimationFrame(pendingRestoreFrame);
      const frame = requestAnimationFrame(() => {
        if (!destroyed && revision === restackRevision) gridController?.restoreAnchor(anchor);
        if (pendingRestoreFrame === frame) pendingRestoreFrame = null;
      });
      pendingRestoreFrame = frame;
    });
  });

  onMount(() => {
    gridController = createCatalogGridController({
      getScrollElement: () => resultsElement ?? null,
      getResults,
      getPreviewWidth: () => catalogSnapshot?.resultMode === 'compact' ? 420 : catalogSnapshot?.previewWidth ?? 286,
      getResultKey: (result) => result.dataset.widgetType ?? '',
      getResultShape: (result) => (result.dataset.previewShape ?? 'medium') as WidgetShape,
      getResultMeasureElement: (result) => result.querySelector('[data-catalog-result-content]') ?? result
    });
  });
  onDestroy(() => {
    destroyed = true;
    restackRevision += 1;
    pendingAnchor = null;
    if (pendingRestoreFrame !== null) cancelAnimationFrame(pendingRestoreFrame);
    pendingRestoreFrame = null;
    gridController?.destroy();
  });

  function restack(update: () => void) {
    pendingAnchor = gridController?.captureAnchor() ?? null;
    restackRevision += 1;
    if (pendingRestoreFrame !== null) {
      cancelAnimationFrame(pendingRestoreFrame);
      pendingRestoreFrame = null;
    }
    update();
  }

  function catalogContextLabel(manifest: WidgetManifest): string {
    const context = catalogContexts[String(manifest.type)];
    if (!context) throw new Error(`Missing authoritative catalog context for ${manifest.type}.`);
    return context.replaceAll('-', ' ');
  }

  function closeCatalog() {
    restackRevision += 1;
    if (pendingRestoreFrame !== null) {
      cancelAnimationFrame(pendingRestoreFrame);
      pendingRestoreFrame = null;
    }
    catalog.close();
  }

  function toggleUtility(utility: CatalogUtility) {
    const current = catalogSnapshot?.utility;
    void restack(() => catalog.setUtility(current === utility ? null : utility));
  }

  function cancel(event: Event) {
    event.preventDefault();
    closeCatalog();
  }

  function handleDialogKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closeCatalog();
  }

  function activateResult(event: MouseEvent | KeyboardEvent, manifest: WidgetManifest, unavailable: boolean) {
    if (event instanceof KeyboardEvent) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.key === ' ') event.preventDefault();
    }
    if (unavailable) return;
    const result = event.currentTarget as HTMLElement;
    if (onplace) onplace(manifest, result);
    else oncreate(manifest);
  }
</script>

<svg class="catalog-icon-sprite" aria-hidden="true">
  <defs>
    <symbol id="mi-512482" viewBox="0 0 20 20"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-140 -999)" fill="currentColor"><g transform="translate(56 160)"><path d="M97.1784026,840.884344 C92.8882915,837.134592 86.2359857,839.256228 84.7592414,844.817545 C84.139128,847.151543 84.7373784,848.235292 84.7373784,849.987037 C84.7373784,851.787636 84,854.395812 84,854.395812 C84,854.714855 84.2832249,855.025921 84.6320386,854.935194 C85.8792217,854.609172 87.8627895,853.964107 90.2349218,854.608175 C98.2119249,856.770688 103.330841,846.261214 97.1784026,840.884344 M103.447113,859 C103.395437,859 103.341773,858.993021 103.287115,858.979063 C96.9806421,857.395812 97.4039887,859.174477 93.8999507,858.237288 C92.8395967,857.954137 91.8746446,857.443669 91.0418642,856.781655 C97.4059763,857.561316 102.710728,852.016948 101.771614,845.487535 C102.732591,846.487535 103.438169,847.72582 103.7363,849.11266 C104.584981,853.048852 102.430484,852.38285 103.983749,858.364905 C104.075176,858.714855 103.765119,859 103.447113,859"></path></g></g></g></symbol>
    <symbol id="mi-511528" viewBox="0 -0.5 20 20"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-300 -2759)" fill="currentColor"><g transform="translate(56 160)"><path d="M262,2613.30565 L255,2615.6592 L255,2604.30627 L255,2604.13172 L262,2601.77817 L262,2613.30565 Z M253,2604.30627 L253,2615.6592 L246,2613.30565 L246,2601.77817 L253,2604.13172 L253,2604.30627 Z M254,2602.44305 L244,2599 L244,2614.69032 L254,2618 L264,2614.69032 L264,2599 L254,2602.44305 Z"></path></g></g></g></symbol>
    <symbol id="mi-511777" viewBox="-0.5 0 21 21"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-220 -1119)" fill="currentColor"><g transform="translate(56 160)"><path d="M168,971.0005 L168,967.0005 L170,967.0005 L170,969.0005 L178,969.0005 L178,967.0005 L180,967.0005 L180,971.0005 L168,971.0005 Z M166,961.0005 L182,961.0005 L182,959.0005 L166,959.0005 L166,961.0005 Z M166,977.0005 L182,977.0005 L182,965.0005 L166,965.0005 L166,977.0005 Z M164,979.0005 L184,979.0005 L184,963.0005 L164,963.0005 L164,979.0005 Z"></path></g></g></g></symbol>
    <symbol id="mi-512616" viewBox="0 -0.5 21 21"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-99 -720)" fill="currentColor"><g transform="translate(56 160)"><path d="M61.9,564 L61.9,560 L59.8,560 L59.8,564 L57.7,564 L57.7,566 L59.8,566 L59.8,580 L61.9,580 L61.9,566 L64,566 L64,564 L61.9,564 Z M54.55,560 L52.45,560 L52.45,569 L50.35,569 L50.35,571 L52.45,571 L52.45,580 L54.55,580 L54.55,571 L56.65,571 L56.65,569 L54.55,569 L54.55,560 Z M47.2,574 L49.3,574 L49.3,576 L47.2,576 L47.2,580 L45.1,580 L45.1,576 L43,576 L43,574 L45.1,574 L45.1,560 L47.2,560 L47.2,574 Z"></path></g></g></g></symbol>
    <symbol id="mi-511722" viewBox="0 -3 19 19"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-180 -3283)" fill="currentColor"><g transform="translate(56 160)"><path d="M129.204085,3126.419 C129.587463,3126.032 129.587463,3125.405 129.204085,3125.018 L129.191207,3125.005 C128.807829,3124.618 128.186697,3124.618 127.803319,3125.005 L124.287534,3128.553 C123.904155,3128.94 123.904155,3129.568 124.287534,3129.955 L127.803319,3133.503 C128.186697,3133.89 128.807829,3133.89 129.191207,3133.503 L129.204085,3133.49 C129.587463,3133.103 129.587463,3132.476 129.204085,3132.089 L127.090057,3129.955 C126.706679,3129.568 126.706679,3128.94 127.090057,3128.553 L129.204085,3126.419 Z M142.712466,3128.553 L139.196681,3125.005 C138.814294,3124.618 138.192171,3124.618 137.808793,3125.005 L137.795915,3125.018 C137.412537,3125.405 137.412537,3126.032 137.795915,3126.419 L139.910934,3128.553 C140.294312,3128.94 140.294312,3129.568 139.910934,3129.955 L137.795915,3132.089 C137.412537,3132.476 137.412537,3133.103 137.795915,3133.49 L137.808793,3133.503 C138.192171,3133.89 138.814294,3133.89 139.196681,3133.503 L142.712466,3129.955 C143.095845,3129.568 143.095845,3128.94 142.712466,3128.553 Z M136.809359,3124.40817 L131.74698,3135.23866 C131.582981,3135.57915 131.295245,3136 130.924037,3136 L130.904396,3136 C130.182602,3136 129.712209,3135.0197 130.031369,3134.3588 L135.064287,3123.63077 C135.228287,3123.29128 135.836165,3123.02511 135.836165,3123.02511 L135.836165,3123 C136.818198,3123 137.127538,3123.74728 136.809359,3124.40817 Z"></path></g></g></g></symbol>
    <symbol id="mi-512690" viewBox="0 0 20 20"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-420 -2159)" fill="currentColor"><g transform="translate(56 160)"><path d="M374,2009 C371.794,2009 370,2007.206 370,2005 C370,2002.794 371.794,2001 374,2001 C376.206,2001 378,2002.794 378,2005 C378,2007.206 376.206,2009 374,2009 M377.758,2009.673 C379.124,2008.574 380,2006.89 380,2005 C380,2001.686 377.314,1999 374,1999 C370.686,1999 368,2001.686 368,2005 C368,2006.89 368.876,2008.574 370.242,2009.673 C366.583,2011.048 364,2014.445 364,2019 L366,2019 C366,2014 369.589,2011 374,2011 C378.411,2011 382,2014 382,2019 L384,2019 C384,2014.445 381.417,2011.048 377.758,2009.673"></path></g></g></g></symbol>
    <symbol id="mi-511724" viewBox="0 0 20 20"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-260 -3319)" fill="currentColor"><g transform="translate(56 160)"><path d="M221,3170 C220.449,3170 220,3169.551 220,3169 C220,3168.449 220.449,3168 221,3168 C221.551,3168 222,3168.449 222,3169 C222,3169.551 221.551,3170 221,3170 M214,3170 C213.449,3170 213,3169.551 213,3169 C213,3168.449 213.449,3168 214,3168 C214.551,3168 215,3168.449 215,3169 C215,3169.551 214.551,3170 214,3170 M214,3177 C213.449,3177 213,3176.551 213,3176 C213,3175.449 213.449,3175 214,3175 C214.551,3175 215,3175.449 215,3176 C215,3176.551 214.551,3177 214,3177 M214,3161 C214.551,3161 215,3161.449 215,3162 C215,3162.551 214.551,3163 214,3163 C213.449,3163 213,3162.551 213,3162 C213,3161.449 213.449,3161 214,3161 M207,3170 C206.449,3170 206,3169.551 206,3169 C206,3168.449 206.449,3168 207,3168 C207.551,3168 208,3168.449 208,3169 C208,3169.551 207.551,3170 207,3170 M221,3166 C219.696,3166 218.597,3167 218.184,3168 L216.816,3168 C216.515,3167 215.848,3166.485 215,3166.184 L215,3164.816 C216.163,3164.403 217,3163.304 217,3162 C217,3160.343 215.657,3159 214,3159 C212.343,3159 211,3160.343 211,3162 C211,3163.304 211.837,3164.403 213,3164.816 L213,3166.184 C212.152,3166.485 211.485,3167 211.184,3168 L209.816,3168 C209.403,3167 208.304,3166 207,3166 C205.343,3166 204,3167.343 204,3169 C204,3170.657 205.343,3172 207,3172 C208.304,3172 209.403,3171 209.816,3170 L211.184,3170 C211.485,3171 212.152,3171.515 213,3171.816 L213,3173.184 C211.837,3173.597 211,3174.696 211,3176 C211,3177.657 212.343,3179 214,3179 C215.657,3179 217,3177.657 217,3176 C217,3174.696 216.163,3173.597 215,3173.184 L215,3171.816 C215.848,3171.515 216.515,3171 216.816,3170 L218.184,3170 C218.597,3171 219.696,3172 221,3172 C222.657,3172 224,3170.657 224,3169 C224,3167.343 222.657,3166 221,3166"></path></g></g></g></symbol>
    <symbol id="mi-511741" viewBox="0 -0.5 21 21"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-139 -600)" fill="currentColor"><g transform="translate(56 160)"><path d="M99.4396071,444.343125 C96.1562532,441.216125 90.8432468,441.216125 87.5598929,444.343125 C84.284939,447.462125 84.284939,452.538125 87.5598929,455.657125 C90.8432468,458.784125 96.1562532,458.783125 99.4396071,455.657125 C102.722961,452.530125 102.722961,447.470125 99.4396071,444.343125 M100.924309,457.071125 C96.824054,460.976125 90.175446,460.976125 86.0751912,457.071125 C81.9749363,453.166125 81.9749363,446.834125 86.0751912,442.929125 C90.175446,439.023125 96.824054,439.024125 100.924309,442.929125 C105.024564,446.834125 105.024564,453.166125 100.924309,457.071125 M97.9549053,454.242125 L89.0456447,445.757125 C91.5057976,443.414125 95.4947524,443.414125 97.9549053,445.757125 C100.415058,448.100125 100.415058,451.899125 97.9549053,454.242125"></path></g></g></g></symbol>
    <symbol id="mi-511728" viewBox="0 -6 20 20"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-140 -3325)" fill="currentColor"><g transform="translate(56 160)"><path d="M100,3171 C98.897,3171 98,3170.103 98,3169 C98,3167.897 98.897,3167 100,3167 C101.103,3167 102,3167.897 102,3169 C102,3170.103 101.103,3171 100,3171 M94,3171 C92.897,3171 92,3170.103 92,3169 C92,3167.897 92.897,3167 94,3167 C95.103,3167 96,3167.897 96,3169 C96,3170.103 95.103,3171 94,3171 M88,3171 C86.897,3171 86,3170.103 86,3169 C86,3167.897 86.897,3167 88,3167 C89.103,3167 90,3167.897 90,3169 C90,3170.103 89.103,3171 88,3171 M100,3165 C98.798,3165 97.733,3165.541 97,3166.38 C96.267,3165.541 95.202,3165 94,3165 C92.798,3165 91.733,3165.541 91,3166.38 C90.267,3165.541 89.202,3165 88,3165 C85.791,3165 84,3166.791 84,3169 C84,3171.209 85.791,3173 88,3173 C89.202,3173 90.267,3172.459 91,3171.62 C91.733,3172.459 92.798,3173 94,3173 C95.202,3173 96.267,3172.459 97,3171.62 C97.733,3172.459 98.798,3173 100,3173 C102.209,3173 104,3171.209 104,3169 C104,3166.791 102.209,3165 100,3165"></path></g></g></g></symbol>
    <symbol id="mi-513035" viewBox="0 -5 28 28"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-420 -4040)" fill="currentColor"><g transform="translate(56 160)"><path d="M391,3881.21396 C391.552,3881.21396 392,3881.67193 392,3882.23621 L392,3896.54768 C392,3897.11196 391.552,3897.56993 391,3897.56993 C390.448,3897.56993 390,3897.11196 390,3896.54768 L390,3882.23621 C390,3881.67193 390.448,3881.21396 391,3881.21396 Z M386,3894.50319 L386,3884.28071 C386,3883.71643 386.448,3883.25846 387,3883.25846 C387.552,3883.25846 388,3883.71643 388,3884.28071 L388,3894.50319 C388,3895.06747 387.552,3895.52543 387,3895.52543 C386.448,3895.52543 386,3895.06747 386,3894.50319 Z M382,3892.45869 L382,3886.3252 C382,3885.76092 382.448,3885.30295 383,3885.30295 C383.552,3885.30295 384,3885.76092 384,3886.3252 L384,3892.45869 C384,3893.02297 383.552,3893.48094 383,3893.48094 C382.448,3893.48094 382,3893.02297 382,3892.45869 Z M368,3891.43644 L367,3891.43644 C366.448,3891.43644 366,3890.97847 366,3890.41419 L366,3888.3697 C366,3887.80542 366.448,3887.34745 367,3887.34745 L368,3887.34745 Z M370,3886.05533 C372.667,3884.69165 374.768,3883.61829 377.271,3882.33843 C377.604,3882.16874 378,3882.41306 378,3882.79334 L378,3894.96831 C378,3895.34858 377.604,3895.5929 377.271,3895.42321 C374.769,3894.14335 372.667,3893.06897 370,3891.70632 Z M364,3887.34745 L364,3891.43644 C364,3892.56603 364.895,3893.48094 366,3893.48094 L367.667,3893.48094 L377.185,3897.82038 C378.508,3898.42351 380,3897.43397 380,3895.95273 L380,3882.04709 C380,3880.50759 378.399,3879.52112 377.068,3880.23874 L367.667,3885.30295 L366,3885.30295 C364.895,3885.30295 364,3886.21787 364,3887.34745 Z"></path></g></g></g></symbol>
    <symbol id="mi-512362" viewBox="0 0 20 20"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-60 -3919)" fill="currentColor"><g transform="translate(56 160)"><path d="M16.083,3767.667 C16.083,3766.562 16.979,3765.667 18.083,3765.667 C19.188,3765.667 20.083,3766.562 20.083,3767.667 C20.083,3768.772 19.188,3769.667 18.083,3769.667 C16.979,3769.667 16.083,3768.772 16.083,3767.667 L16.083,3767.667 Z M22,3775.086 L17.987,3771.074 L17.971,3771.089 L17.956,3771.074 L16.525,3772.504 L11.896,3767.876 L11.881,3767.892 L11.865,3767.876 L6,3773.741 L6,3763 L22,3763 L22,3775.086 Z M15.357,3777 L17.971,3774.386 L20.586,3777 L15.357,3777 Z M12.529,3777 L6.069,3777 L11.881,3770.938 L15.111,3774.293 L12.529,3777 Z M22,3759 L22,3761 L18,3761 L18,3759 L16,3759 L16,3761 L12,3761 L12,3759 L10,3759 L10,3761 L6,3761 L6,3759 L4,3759 L4,3779 L24,3779 L24,3759 L22,3759 Z"></path></g></g></g></symbol>
    <symbol id="mi-512524" viewBox="0 -0.5 21 21"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-59 -560)" fill="currentColor"><g transform="translate(56 160)"><path d="M21.9,412.917 C21.9,413.469 21.4275,414 20.8479,414 L19.8,414 L19.8,405.92 C19.8,404.814 18.85605,404 17.69475,404 L9.3,404 L9.3,402.917 C9.3,402.365 9.7683,402 10.3479,402 L20.8479,402 C21.4275,402 21.9,402.365 21.9,402.917 L21.9,412.917 Z M17.7,417 C17.7,417.552 17.2296,418 16.65,418 L6.15,418 C5.5704,418 5.1,417.552 5.1,417 L5.1,407 C5.1,406.447 5.5704,406 6.15,406 L16.65,406 C17.2296,406 17.7,406.447 17.7,407 L17.7,417 Z M21.89475,400 L9.3021,400 C8.13975,400 7.2,400.814 7.2,401.92 L7.2,404 L5.1021,404 C3.93975,404 3,404.814 3,405.92 L3,417.914 C3,419.02 3.93975,420 5.1021,420 L17.69475,420 C18.85605,420 19.8,419.02 19.8,417.914 L19.8,416 L21.89475,416 C23.05605,416 24,415.02 24,413.914 L24,401.92 C24,400.814 23.05605,400 21.89475,400 L21.89475,400 Z"></path></g></g></g></symbol>
    <symbol id="mi-511836" viewBox="0 0 20 20"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-100 -1719)" fill="currentColor"><g transform="translate(56 160)"><path d="M62,1565.0005 L53.374,1565.0005 L51.416,1561.0005 L46,1561.0005 L46,1577.0005 L53,1577.0005 L53,1571.0005 L55,1571.0005 L55,1577.0005 L62,1577.0005 Z M64,1563.0005 L64,1579.0005 L44,1579.0005 L44,1559.0005 L52.437,1559.0005 L54.437,1563.0005 Z M53.022,1568.9795 L55.022,1568.9795 L55.022,1566.9795 L53.022,1566.9795 Z"></path></g></g></g></symbol>
  </defs>
</svg>

{#snippet catalogIcon(iconKey: string | undefined)}
  <svg class="catalog-icon" data-catalog-icon={iconKey} viewBox="0 0 20 20" focusable="false" aria-hidden="true">
    <use href={`#${catalogIconSymbol(iconKey)}`}></use>
  </svg>
{/snippet}

<dialog
  bind:this={dialog}
  class={className}
  aria-label="Widget Catalog"
  aria-describedby="widget-catalog-scroll-status"
  data-pom-part="dialog.surface"
  data-presentation={catalogSnapshot?.presentation}
  data-result-mode={catalogSnapshot?.resultMode}
  oncancel={cancel}
  onkeydown={handleDialogKeydown}
>
  {#if catalogSnapshot?.open}
    <header class="catalog-head" data-pom-part="widget.header">
      <div class="catalog-title">
        <h2>Widget Catalog</h2>
        <span>Build this Panel</span>
      </div>
      <button class="catalog-close" type="button" data-pom-part="button.icon" aria-label="Close Widget Catalog" onclick={closeCatalog}><span aria-hidden="true">×</span></button>
    </header>

    <div class="catalog-search-row">
      <label class="visually-hidden" for="widget-catalog-search">Search Widgets</label>
      <input
        bind:this={searchInput}
        class="catalog-search"
        id="widget-catalog-search"
        type="search"
        data-pom-part="field.surface"
        placeholder="Search widgets…"
        autocomplete="off"
        value={catalogSnapshot.query}
        oninput={(event) => void restack(() => catalog.setQuery(event.currentTarget.value))}
      />
      {#if catalogSnapshot.resultMode === 'visual'}
        <label class="catalog-preview-control">
          <span>Preview size</span>
          <output class="catalog-preview-output" for="widget-catalog-preview-scale">{catalogPreviewLabel(catalogSnapshot.previewWidth)} · {catalogSnapshot.previewWidth} px</output>
          <input
            class="catalog-preview-scale"
            id="widget-catalog-preview-scale"
            type="range"
            min="200"
            max="420"
            step="1"
            value={catalogSnapshot.previewWidth}
            list="widget-catalog-preview-detents"
            aria-label="Preview size"
            aria-valuetext={`${catalogPreviewLabel(catalogSnapshot.previewWidth)} preview, ${catalogSnapshot.previewWidth} pixels`}
            oninput={(event) => void restack(() => catalog.setPreviewWidth(Number(event.currentTarget.value)))}
          />
          <datalist id="widget-catalog-preview-detents">
            <option value="200" label="Small"></option>
            <option value="286" label="Medium"></option>
            <option value="420" label="Large"></option>
          </datalist>
        </label>
      {/if}
      <div class="catalog-view" role="group" aria-label="Catalog view">
        <button type="button" data-pom-part="button.surface" aria-pressed={catalogSnapshot.resultMode === 'visual'} onclick={() => void restack(() => catalog.setResultMode('visual'))}>Visual</button>
        <button type="button" data-pom-part="button.surface" aria-pressed={catalogSnapshot.resultMode === 'compact'} onclick={() => void restack(() => catalog.setResultMode('compact'))}>Compact</button>
      </div>
    </div>

    <div class="catalog-filter-strip">
      <nav class="catalog-filters" aria-label="Widget categories">
        <button type="button" data-pom-part="button.surface" aria-pressed={catalogSnapshot.category === null} onclick={() => void restack(() => catalog.setCategory(null))}>All</button>
        {#each categories as category (category[0])}
          <button type="button" data-pom-part="button.surface" aria-pressed={catalogSnapshot.category === category[0]} onclick={() => void restack(() => catalog.setCategory(category[0]))}>{category[1]}</button>
        {/each}
      </nav>
      <div class="catalog-utilities" role="group" aria-label="Catalog filters">
        {#each utilities as utility (utility[0])}
          <button type="button" data-pom-part="button.surface" aria-pressed={catalogSnapshot.utility === utility[0]} onclick={() => toggleUtility(utility[0])}>{utility[1]}</button>
        {/each}
      </div>
    </div>

    <div class="active-catalog-filter" hidden data-active-catalog-filter></div>

    <div
      bind:this={resultsElement}
      class="catalog-results"
      data-catalog-results
      data-catalog-view={catalogSnapshot.resultMode}
      aria-live="polite"
    >
      {#if catalogSnapshot.results.length === 0}
        <p class="catalog-empty">No Widgets match these filters.</p>
      {:else}
        {#each catalogSnapshot.results as manifest (manifest.type)}
          {@const count = instanceCounts[manifest.type] ?? 0}
          {@const unavailable = count > 0 && manifest.catalog?.multiplicity === 'single'}
          <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role (source-faithful whole-result placement affordance contains an inert real renderer) -->
          <article
            class:catalog-result-compact={catalogSnapshot.resultMode === 'compact'}
            class:is-on-panel={unavailable}
            data-catalog-result
            data-widget-type={manifest.type}
            data-widget-category={manifest.catalog?.category}
            data-preview-shape={manifest.catalog?.shape}
            data-pom-part="row.surface"
            role="button"
            tabindex="0"
            aria-disabled={unavailable}
            aria-label={unavailable ? `${manifest.title}, already on this Panel` : `${manifest.title}, drag to place on this Panel. Press Space for keyboard placement.`}
            onclick={(event) => activateResult(event, manifest, unavailable)}
            onkeydown={(event) => activateResult(event, manifest, unavailable)}
          >
            <div class="catalog-result-content" data-catalog-result-content>
              {#if catalogSnapshot.resultMode === 'compact'}
                <span class="catalog-compact-sample" aria-hidden="true">
                  {@render catalogIcon(manifest.catalog?.iconKey)}
                </span>
                <span class="catalog-compact-copy"><strong>{manifest.title}</strong><span>{manifest.catalog?.category} · {catalogContextLabel(manifest)} · {manifest.catalog?.shape}</span></span>
                <span class="catalog-compact-state">{unavailable ? 'On Panel' : 'Drag'}</span>
              {:else}
                <div class="catalog-widget-identity" data-catalog-widget-identity>
                  <div class="catalog-identity-name">
                    {@render catalogIcon(manifest.catalog?.iconKey)}
                    <strong>{manifest.title}</strong>
                  </div>
                  <span>{manifest.catalog?.purpose}</span>
                </div>
                <CatalogWidgetPreview {manifest} {rendererRegistry} {hostContext} />
                {#if count > 0}<span class="catalog-instance-state">{manifest.catalog?.multiplicity === 'single' ? 'On Panel' : `${count} here`}</span>{/if}
                {#if !unavailable}<span class="catalog-drag-hint">Drag to Panel</span>{/if}
              {/if}
            </div>
          </article>
        {/each}
      {/if}
    </div>

    <footer class="catalog-foot" id="widget-catalog-scroll-status"><span>{catalogSnapshot.results.length} widget{catalogSnapshot.results.length === 1 ? '' : 's'}</span><span>Strictly active story</span></footer>
  {/if}
</dialog>
