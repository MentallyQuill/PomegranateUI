<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { asPanelId, asSubPanelId, asWidgetInstanceId, asWidgetType, type PanelId, type SubPanelId, type WidgetManifest, type WorkbenchState } from '@pomegranate-ui/contracts';
  import { loadLayout, saveLayout } from '@pomegranate-ui/layout';
  import { setWorkbenchContext, toSvelteCatalogStore } from '@pomegranate-ui/svelte';
  import type { WidgetFrameProjection } from '@pomegranate-ui/core';
  import { FIRST_SLICE_CONTRACT_IDS } from '@pomegranate-ui/testkit';
  import { POM_SEMANTIC_PART_STYLE_SHEET, type ThemeAssetRegistry } from '@pomegranate-ui/theme';

  import ashAmberStage from './assets/ash-amber-stage.webp';
  import bunnyGardenCanvas from './assets/bunny-garden-canvas.webp';
  import atmosphericReservoirStage from './assets/atmospheric-reservoir-stage.jpg';
  import { createLabHostContext, type LabThemeInspector } from './mockup/host-context.js';
  import { resolveLabShowcaseMediaProfile } from './mockup/showcase-media.js';
  import { IMPLEMENTED_SURFACES, IMPLEMENTED_SURFACE_TYPES } from './mockup/implemented-surfaces.js';
  import { LAB_PANEL_IDS } from './mockup/state.js';
  import { getSurfaceFixture, resolveSurfaceState } from './mockup/surface-fixtures.js';
  import { resolveLabWidgetMeta, resolveLabWidgetTitle } from './mockup/presentation.js';
  import { upgradeFlatSettingsPanel } from './mockup/settings-sub-panels.js';
  import { createLabRuntime } from './mockup/widgets.js';
  import PanelTabs from './recipes/PanelTabs.svelte';
  import PanelCreateDialog from './recipes/PanelCreateDialog.svelte';
  import SubPanelBar from './recipes/SubPanelBar.svelte';
  import SubPanelDialog from './recipes/SubPanelDialog.svelte';
  import WidgetShelf from './recipes/WidgetShelf.svelte';
  import LayoutUndo from './recipes/LayoutUndo.svelte';
  import IconAction from './recipes/IconAction.svelte';
  import ThemeCanvas from './recipes/ThemeCanvas.svelte';
  import FocusedWidget from './recipes/FocusedWidget.svelte';
  import WidgetCatalog from './recipes/WidgetCatalog.svelte';
  import type { CatalogPlacementTarget } from './recipes/CatalogPlacementController.js';
  import WidgetFrame from './recipes/WidgetFrame.svelte';
  import WorkbenchSurface from './recipes/WorkbenchSurface.svelte';
  import WorkbenchDeveloperDrawer from './recipes/WorkbenchDeveloperDrawer.svelte';
  import { createLocalLayoutStorage, LAB_LAYOUT_KEY } from './storage.js';
  import { createLabThemeController } from './themes/controller.js';
  import type { LabMaterialControlId } from './themes/material-controls.js';
  import { LAB_THEME_PRESETS } from './themes/presets.js';
  import { createLocalThemePreference } from './themes/theme-storage.js';
  import { createLocalThemeDraftStorage } from './themes/draft-storage.js';

  const runtime = createLabRuntime();
  const storage = createLocalLayoutStorage();
  const { store, catalog, rendererRegistry } = runtime;
  const locationParameters = new URLSearchParams(window.location.search);
  const requestedDeveloperMode = locationParameters.get('dev');
  const developerToolsEnabled = requestedDeveloperMode === '1'
    || (requestedDeveloperMode === null && ['127.0.0.1', 'localhost', '[::1]'].includes(window.location.hostname));
  const requestedSurface = locationParameters.get('surface');
  const requestedSurfaceState = locationParameters.get('surfaceState');
  const requestedType = requestedSurface ? asWidgetType(requestedSurface) : null;
  const requestedDefinition = requestedType ? IMPLEMENTED_SURFACES.find(({ type }) => type === requestedType) : undefined;
  const requestedManifest = requestedType ? catalog.getState().results.find(({ type }) => type === requestedType) : undefined;
  const requestedFixture = requestedType && IMPLEMENTED_SURFACE_TYPES.has(requestedType) ? getSurfaceFixture(requestedType) : undefined;
  const initialSurfaceState = requestedFixture ? resolveSurfaceState(requestedSurfaceState, requestedFixture) : 'ready';
  if (requestedSurface) {
    if (requestedType && IMPLEMENTED_SURFACE_TYPES.has(requestedType)) {
      const panelId = asPanelId('surface-preview');
      store.dispatch({
        type: 'panel.create',
        panel: { id: panelId, name: 'Surface Preview', templateId: 'focus-support.v1', order: 3 }
      });
      store.dispatch({ type: 'panel.activate', panelId });
      store.dispatch({
        type: 'widget.create',
        instance: { id: asWidgetInstanceId('surface-preview-widget'), type: requestedType, manifestVersion: '1.0.0', configuration: { surfacePreview: true } },
        placement: {
          kind: 'docked',
          panelId,
          regionId: requestedDefinition?.family === 'systems'
            && ['narrow', 'medium', 'strip'].includes(requestedManifest?.catalog?.shape ?? '')
            ? 'support'
            : 'focus',
          shelfId: 'primary',
          order: 0
        }
      });
    }
  }
  const catalogState = toSvelteCatalogStore(catalog);
  const themeAssetRegistry: ThemeAssetRegistry = Object.freeze({
    'icons.minimal': { kind: 'icon-pack', source: 'icons.minimal' },
    'image.atmospheric-reservoir': { kind: 'image', source: atmosphericReservoirStage },
    'image.bunny-garden': { kind: 'image', source: bunnyGardenCanvas },
    'image.ash-amber-stage': { kind: 'image', source: ashAmberStage }
  });
  const mediaMatches = (query: string) => typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
  const backdropFilterSupported = typeof CSS === 'undefined' || typeof CSS.supports !== 'function'
    ? true
    : CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  const themeController = createLabThemeController({
    preference: createLocalThemePreference(window.localStorage),
    draftStorage: createLocalThemeDraftStorage(window.localStorage),
    assetRegistry: themeAssetRegistry,
    devicePolicy: {
      reducedTransparency: mediaMatches('(prefers-reduced-transparency: reduce)'),
      coarsePointer: mediaMatches('(pointer: coarse)'),
      backdropFilterSupported
    },
    ambientLimits: { enabled: true, maximumPower: 1, allowMotion: true, allowTransparency: true },
    ambientAccessibility: {
      reducedMotion: mediaMatches('(prefers-reduced-motion: reduce)'),
      reducedTransparency: mediaMatches('(prefers-reduced-transparency: reduce)')
    }
  });
  const initialThemeSnapshot = themeController.getSnapshot();
  let themeSnapshot = $state(initialThemeSnapshot);

  function themeInspector(): LabThemeInspector {
    const theme = themeSnapshot.compiled.theme;
    return {
      colors: theme.colors,
      typography: [
        theme.typography.ui.family,
        theme.typography.prose.family,
        theme.typography.technical.family
      ],
      geometry: `${theme.shapes.pane?.family ?? 'resolved'} · ${theme.shapes.pane?.radiusPx ?? 0}px`,
      density: theme.spacing.density,
      iconPackId: theme.iconPackId
    };
  }

  function activateTheme(id: string) {
    const result = themeController.activate(id);
    if (result.ok) {
      applyThemeSnapshot(result.snapshot);
      status = `${result.snapshot.resolved.theme.label} applied without changing Workbench state.`;
    } else {
      status = result.diagnostics[0]?.message ?? 'Theme activation failed.';
    }
  }

  function applyThemeSnapshot(snapshot: typeof initialThemeSnapshot) {
    themeSnapshot = snapshot;
    hostContext.theme.activeId = snapshot.activeId;
    hostContext.visualMedia = resolveLabShowcaseMediaProfile(snapshot.activeId);
    hostContext.theme.materialControls = snapshot.materialControls;
    hostContext.theme.inspector = themeInspector();
    hostContext.theme.authoring = themeController.getAuthoringSnapshot();
  }

  function setMaterialControl(id: LabMaterialControlId, value: number) {
    const result = themeController.setMaterialControl(id, value);
    if (result.ok) {
      applyThemeSnapshot(result.snapshot);
      status = `${result.snapshot.resolved.theme.label} material settings updated.`;
    } else {
      status = result.diagnostics[0]?.message ?? 'Theme material update failed.';
    }
  }

  function resetMaterialControls() {
    const result = themeController.resetMaterialControls();
    if (result.ok) {
      applyThemeSnapshot(result.snapshot);
      status = `${result.snapshot.resolved.theme.label} material settings reset.`;
    } else {
      status = result.diagnostics[0]?.message ?? 'Theme material reset failed.';
    }
  }

  function editThemeDraft(next: unknown) {
    const result = themeController.editDraft(next);
    hostContext.theme.authoring = result.authoring;
    if (result.ok) {
      applyThemeSnapshot(themeController.getSnapshot());
      status = 'Theme draft applied locally.';
    } else status = result.diagnostics[0]?.message ?? 'Theme draft is invalid.';
    return result;
  }

  function resetThemeDraft() {
    const result = themeController.resetDraft();
    hostContext.theme.authoring = result.authoring;
    if (result.ok) {
      applyThemeSnapshot(themeController.getSnapshot());
      status = 'Theme draft reset to the active target.';
    }
    return result;
  }

  async function saveThemeDraft() {
    const result = await themeController.saveDraft();
    hostContext.theme.authoring = result.authoring;
    status = result.ok ? 'Theme draft saved on this device.' : result.diagnostics[0]?.message ?? 'Theme draft could not be saved.';
    return result;
  }

  let hostContext = $state(createLabHostContext({
    activeId: initialThemeSnapshot.activeId,
    presets: LAB_THEME_PRESETS.map(({ id, target, swatchStyle }) => ({
      id,
      label: target.theme.label,
      description: target.theme.description ?? target.theme.label,
      swatchStyle
    })),
    inspector: themeInspector(),
    materialControls: initialThemeSnapshot.materialControls,
    authoring: themeController.getAuthoringSnapshot(),
    activate: activateTheme,
    setMaterialControl,
    resetMaterialControls,
    openSettings: () => { store.dispatch({ type: 'panel.activate', panelId: LAB_PANEL_IDS.settings }); },
    editDraft: editThemeDraft,
    resetDraft: resetThemeDraft,
    saveDraft: saveThemeDraft
  }, initialSurfaceState, resolveLabShowcaseMediaProfile(initialThemeSnapshot.activeId)));
  setWorkbenchContext({ store, catalog, rendererRegistry, hostContext });

  let workbench: WorkbenchState = $state(store.getState());
  let focusMode = $state(false);
  let focusedFrame = $state<WidgetFrameProjection | null>(null);
  let focusReturnId: string | null = null;
  const compactWorkbenchMedia = typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 1180px)')
    : null;
  let leftCollapsed = $state(false);
  let rightCollapsed = $state(false);
  let panelDialog: { showModal(): void; close(): void };
  let subPanelDialog: {
    open(request: { mode: 'create' | 'rename' | 'layout' | 'move' | 'delete'; panelId: PanelId; subPanelId?: SubPanelId; invokingTab?: HTMLElement }): void;
    duplicate(panelId: PanelId, subPanelId: SubPanelId): void;
  };
  let workbenchElement: HTMLElement;
  let status = $state('Local mockup ready.');
  let contextHintAnnouncedWithoutStorage = false;
  let eventLog: string[] = $state([]);
  let sequence = 0;

  const unsubscribe = store.subscribe((next) => {
    workbench = next;
    sequence += 1;
    eventLog = [`${sequence}. Workbench advanced to revision ${next.revision}.`, ...eventLog].slice(0, 6);
  });
  onDestroy(unsubscribe);

  onMount(() => {
    let current = true;
    const collapseCompactDocks = (event: MediaQueryListEvent) => syncCompactDockDefaults(event.matches);
    compactWorkbenchMedia?.addEventListener('change', collapseCompactDocks);
    void themeController.loadDraft().then((loaded) => {
      if (!current) return;
      hostContext.theme.authoring = loaded.authoring;
      if (loaded.ok) applyThemeSnapshot(themeController.getSnapshot());
    });
    void loadLayout(storage, LAB_LAYOUT_KEY, store.getState()).then((loaded) => {
      if (current && loaded.ok) {
        store.dispatch({ type: 'layout.hydrate', state: upgradeFlatSettingsPanel(loaded.state) });
        status = 'Restored the saved local layout.';
      }
    });
    return () => {
      current = false;
      compactWorkbenchMedia?.removeEventListener('change', collapseCompactDocks);
    };
  });

  const activePanel = $derived(workbench.panels.find((panel) => panel.id === workbench.activePanelId));
  const catalogInstanceCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const [instanceId, instance] of Object.entries(workbench.widgets)) {
      const placement = workbench.placements[instanceId];
      if (!placement || placement.kind === 'shelved' || placement.panelId !== workbench.activePanelId) continue;
      counts[instance.type] = (counts[instance.type] ?? 0) + 1;
    }
    return counts;
  });

  function syncCompactDockDefaults(isCompact = compactWorkbenchMedia?.matches ?? false) {
    const shouldCollapse = isCompact
      && themeSnapshot.compiled.theme.recipes.shellPresentation === 'instrumented'
      && activePanel?.templateId === 'story-stage.v1';
    leftCollapsed = shouldCollapse;
    rightCollapsed = shouldCollapse;
  }

  $effect(() => {
    const shellPresentation = themeSnapshot.compiled.theme.recipes.shellPresentation;
    const templateId = activePanel?.templateId;
    if (compactWorkbenchMedia?.matches) {
      const shouldCollapse = shellPresentation === 'instrumented' && templateId === 'story-stage.v1';
      leftCollapsed = shouldCollapse;
      rightCollapsed = shouldCollapse;
    }
  });

  function floatingStyle(frame: { placement: { kind: string; x?: number; y?: number; width?: number; height?: number; z?: number } }) {
    if (frame.placement.kind !== 'floating') return '';
    return `left:${frame.placement.x}px;top:${frame.placement.y}px;width:${frame.placement.width}px;min-height:${frame.placement.height}px;z-index:${frame.placement.z}`;
  }

  function placeFromCatalog(manifest: WidgetManifest, selectedTarget?: CatalogPlacementTarget | HTMLElement) {
    const target = selectedTarget && 'identity' in selectedTarget ? selectedTarget : undefined;
    const panelId = target ? asPanelId(target.identity.panelId) : workbench.activePanelId;
    if (!panelId) return;
    const panel = workbench.panels.find((candidate) => candidate.id === panelId);
    if (!panel) return;
    const id = asWidgetInstanceId(`catalog-${manifest.type.replace(/[^a-z0-9]+/gi, '-')}-${workbench.revision + 1}`);
    const activeSubPanel = panel.subPanels?.find((candidate) => candidate.id === panel.activeSubPanelId);
    const role = manifest.defaultPlacement.kind === 'docked' ? manifest.defaultPlacement.regionRole : 'stage';
    const template = store.templates.resolve(panel);
    const compatibleRegions = template.ok && manifest.catalog
      && (template.template.family !== 'columns' || manifest.catalog.minColumns <= template.template.regions.length)
      ? template.template.regions.filter((region) => region.acceptedShapes.includes(manifest.catalog!.shape))
      : [];
    const automaticRegionId = compatibleRegions.find((region) => region.role === role)?.id
      ?? compatibleRegions[0]?.id
      ?? (panel.templateId === 'focus-support.v1'
      ? role === 'right-instruments' || role === 'support' ? 'support' : 'focus'
      : panel.templateId === 'columns.v1'
        ? 'column-1'
        : role === 'left-instruments' ? 'left'
          : role === 'right-instruments' ? 'right'
            : role === 'composer' ? 'composer' : 'stage');
    const regionId = target?.identity.regionId ?? automaticRegionId;
    const targetSubPanelId = target
      ? target.identity.subPanelId ? asSubPanelId(target.identity.subPanelId) : undefined
      : activeSubPanel?.id;
    const targetLane = target?.identity.lane ?? (targetSubPanelId ? 0 : undefined);
    const shelfId = target?.identity.shelfId
      ?? (manifest.defaultPlacement.kind === 'docked' ? manifest.defaultPlacement.shelfId : 'primary');
    const result = store.dispatch({
      type: 'widget.create',
      instance: { id, type: manifest.type, manifestVersion: manifest.version, configuration: {} },
      placement: {
        kind: 'docked',
        panelId,
        ...(targetSubPanelId ? { subPanelId: targetSubPanelId, lane: targetLane ?? 0 } : {}),
        regionId,
        shelfId,
        order: Number.MAX_SAFE_INTEGER
      }
    });
    status = result.ok ? `${manifest.title} added to ${panel.name}.` : result.error.message;
  }

  function isCatalogPlacementTargetCompatible(manifest: WidgetManifest, target: HTMLElement): boolean {
    const panel = activePanel;
    const shape = manifest.catalog?.shape;
    if (!panel || !shape) return false;
    if (target.closest<HTMLElement>('[data-pomegranate-panel]')?.dataset.pomegranatePanel !== panel.id) return false;
    const regionId = target.dataset.pomegranateRegionSurface;
    const resolution = store.templates.resolve(panel);
    if (!resolution.ok) return false;
    if (resolution.template.family === 'columns' && manifest.catalog!.minColumns > resolution.template.regions.length) return false;
    const region = resolution.template.regions.find((candidate) => candidate.id === regionId);
    if (!region?.acceptedShapes.includes(shape)) return false;
    const style = getComputedStyle(target);
    if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return false;
    const rect = target.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function createPanel(request: { name: string; templateId: string; columns?: number }) {
    const id = asPanelId(`user-panel-${workbench.revision + 1}`);
    const result = store.dispatch({
      type: 'panel.create',
      panel: {
        id,
        name: request.name,
        templateId: request.templateId,
        order: workbench.panels.length,
        ...(request.columns === undefined ? {} : { configuration: { columns: request.columns } })
      }
    });
    if (result.ok) {
      store.dispatch({ type: 'panel.activate', panelId: id });
      panelDialog.close();
      reportCreatedTab(request.name);
    } else status = result.error.message;
  }

  function reportCreatedTab(name: string) {
    const base = `${name} created.`;
    const key = 'pomegranate.ui.tab-context-hint.v1';
    let alreadyAnnounced = contextHintAnnouncedWithoutStorage;
    try {
      alreadyAnnounced = alreadyAnnounced || window.sessionStorage.getItem(key) === 'shown';
      if (!alreadyAnnounced) window.sessionStorage.setItem(key, 'shown');
    } catch {
      contextHintAnnouncedWithoutStorage = true;
    }
    status = alreadyAnnounced
      ? base
      : `${base} Right-click or press and hold a tab for options.`;
  }

  async function save() {
    const result = await saveLayout(storage, LAB_LAYOUT_KEY, store.getState());
    status = result.ok ? 'Saved pomegranate.ui.layout.v3 locally.' : result.error.message;
  }

  async function reload() {
    const result = await loadLayout(storage, LAB_LAYOUT_KEY, store.getState());
    if (result.ok) store.dispatch({ type: 'layout.hydrate', state: upgradeFlatSettingsPanel(result.state) });
    status = result.ok ? 'Reloaded the saved local layout.' : result.error.message;
  }

  async function clear() {
    await storage.remove?.(LAB_LAYOUT_KEY);
    status = 'Cleared the saved local layout.';
  }

  function openPanelDialog() {
    panelDialog.showModal();
  }

  function openSubPanelDialog(request: {
    mode: 'create' | 'rename' | 'layout' | 'move' | 'delete';
    panelId: PanelId;
    subPanelId?: SubPanelId;
    invokingTab?: HTMLElement;
  }) {
    subPanelDialog.open(request);
  }

  function focusWidget(frame: WidgetFrameProjection) {
    focusReturnId = frame.instanceId;
    focusedFrame = frame;
  }

  async function returnFromFocusedWidget() {
    const returnId = focusReturnId;
    focusedFrame = null;
    focusReturnId = null;
    await tick();
    if (!returnId) return;
    const selector = `[data-focus-widget-for="${CSS.escape(returnId)}"]`;
    const control = document.querySelector<HTMLElement>(selector);
    control?.focus();
  }

  function frameSurfacePart(frame: WidgetFrameProjection) {
    if (frame.placement.kind === 'floating') return 'floating.surface';
    if (frame.placement.kind === 'docked' && frame.placement.group) return null;
    return frame.instance.type === 'story.transcript' || frame.instance.type === 'story.composer'
      ? null
      : 'widget.surface';
  }

  const frameTitle = (frame: WidgetFrameProjection) => resolveLabWidgetTitle(frame.instance.type, frame.title);
  const frameMeta = (frame: WidgetFrameProjection) => resolveLabWidgetMeta(frame.instance.type);
</script>

<svelte:head>
  <title>PomegranateUI Workbench Lab</title>
  {@html `<style data-pom-semantic-parts>${POM_SEMANTIC_PART_STYLE_SHEET}</style>`}
</svelte:head>

<main
  class:focus-mode={focusMode}
  class:left-collapsed={leftCollapsed}
  class:right-collapsed={rightCollapsed}
  data-pom-theme={themeSnapshot.activeId}
  data-pom-theme-root
  data-pom-widget-grouping={themeSnapshot.compiled.theme.recipes.widgetGrouping}
  data-pom-chrome-presentation={themeSnapshot.compiled.theme.recipes.chromePresentation}
  data-pom-shell-presentation={themeSnapshot.compiled.theme.recipes.shellPresentation ?? 'standard'}
  data-pom-action-presentation={themeSnapshot.compiled.theme.recipes.actionPresentation}
  data-pom-action-content={themeSnapshot.presentation.actions.content}
  data-pom-density={themeSnapshot.compiled.theme.spacing.density}
  data-pom-ambient-source={themeSnapshot.resolvedAmbient.source}
  data-surface-preview-family={requestedDefinition?.family}
  data-active-panel={workbench.activePanelId}
  data-workbench-revision={workbench.revision}
  data-workbench-developer-tools={developerToolsEnabled ? 'enabled' : 'disabled'}
  style={themeSnapshot.cssText}
>
  <ThemeCanvas layers={themeSnapshot.compiled.canvas} />
  <header class="top-shelf" data-pom-part="chrome.shelf" data-conformance-region="shelf">
    <a class="wordmark" href="#workbench"><span aria-hidden="true">P</span><strong>PomegranateUI</strong><small>Workbench Lab</small></a>
    <PanelTabs
      {store}
      class="panel-tabs"
      onaddsubpanel={(panelId) => openSubPanelDialog({ mode: 'create', panelId })}
    />
    <div class="panel-create-action" hidden={themeSnapshot.compiled.theme.recipes.shellPresentation !== 'instrumented'}>
      <IconAction label="Create Panel" visualLabel="+" action="create-panel" onclick={openPanelDialog} />
    </div>
    <div class="story-lockup">
      <span>{hostContext.storyId}</span>
      <strong>{hostContext.storyTitle}</strong>
      <small aria-label="Active story identity">{hostContext.storyId} · {hostContext.frameLabel}</small>
    </div>
    <div class="shelf-actions">
      <IconAction label="Open Widget Catalog" visualLabel="Widgets" action="open-catalog" expanded={$catalogState.open} onclick={() => catalog.open('expanded')} />
      <WidgetShelf {store} />
      <LayoutUndo {store} />
      <IconAction label="Focus reading" action="focus-reading" pressed={focusMode} onclick={() => { focusMode = !focusMode; }} />
      <span class="runtime-status" aria-label={hostContext.systemStatus}><i></i><span aria-hidden="true">Ready</span></span>
      {#if developerToolsEnabled}
        <WorkbenchDeveloperDrawer>
          <p class="developer-panel-identity" aria-label="Workbench context"><span>{activePanel?.templateId ?? 'No Panel'}</span><strong>{activePanel?.name ?? 'No active Panel'}</strong></p>
          <div class="theme-targets" role="group" aria-label="Visual target">
            {#each LAB_THEME_PRESETS as preset (preset.id)}
              <button
                type="button"
                data-pom-part="button.surface"
                aria-label={preset.target.theme.label}
                aria-pressed={themeSnapshot.activeId === preset.id}
                onclick={() => activateTheme(preset.id)}
              >{preset.target.theme.label}</button>
            {/each}
          </div>
          <div class="dock-controls">
            {#if requestedFixture}
              <label class="surface-preview-control">State
                <select
                  data-pom-part="field.surface"
                  aria-label="Surface preview state"
                  value={hostContext.surfaceState}
                  onchange={(event) => { hostContext.surfaceState = event.currentTarget.value; }}
                >
                  {#each requestedFixture.states as fixtureState}<option value={fixtureState}>{fixtureState}</option>{/each}
                </select>
              </label>
            {/if}
            <button
              class="developer-create-panel"
              type="button"
              data-pom-part="button.surface"
              hidden={themeSnapshot.compiled.theme.recipes.shellPresentation === 'instrumented'}
              onclick={openPanelDialog}
            >Create Panel</button>
            <button type="button" data-pom-part="button.surface" aria-pressed={leftCollapsed} onclick={() => { leftCollapsed = !leftCollapsed; }}>Collapse left dock</button>
          </div>
          <div class="persistence-actions">
            <button type="button" data-pom-part="button.surface" onclick={() => void save()}>Save layout</button>
            <button type="button" data-pom-part="button.surface" onclick={() => void reload()}>Reload saved layout</button>
            <button type="button" data-pom-part="button.surface" onclick={() => void clear()}>Clear saved layout</button>
          </div>
          <p role="status" aria-live="polite">{status}</p>
          <details><summary>Event log</summary><ol>{#each eventLog as entry}<li>{entry}</li>{/each}</ol></details>
          <details><summary>Native contract evidence</summary><ul>{#each FIRST_SLICE_CONTRACT_IDS as id}<li>{id}</li>{/each}</ul></details>
        </WorkbenchDeveloperDrawer>
      {/if}
    </div>
  </header>

  <section bind:this={workbenchElement} id="workbench" class="workbench-shell" data-pom-part="panel.surface" aria-label="Active Workbench">
    <SubPanelBar
      {store}
      onrequest={openSubPanelDialog}
      onduplicate={(panelId, subPanelId) => subPanelDialog.duplicate(panelId, subPanelId)}
    />
    <WorkbenchSurface
      {store}
      titleFor={frameTitle}
      {leftCollapsed}
      {rightCollapsed}
      ontoggleleft={() => { leftCollapsed = !leftCollapsed; }}
      ontoggleright={() => { rightCollapsed = !rightCollapsed; }}
      class="workbench-surface"
    >
      {#snippet renderWidget(frame)}
        <div
          class:widget-float={frame.placement.kind === 'floating'}
          data-widget-type={frame.instance.type}
          data-widget-shape={frame.manifest?.catalog?.shape}
          data-pomegranate-placement={frame.placement.kind}
          data-pomegranate-edge={frame.placement.kind === 'docked' ? frame.placement.regionId === 'stage' ? 'main' : frame.placement.regionId : undefined}
          data-pomegranate-region={frame.placement.kind === 'docked' ? frame.placement.regionId : undefined}
          data-pomegranate-shelf={frame.placement.kind === 'docked' ? frame.placement.shelfId : undefined}
          data-pomegranate-order={frame.placement.kind === 'docked' ? frame.placement.order : undefined}
          style={floatingStyle(frame)}
        >
          {#if focusedFrame?.instanceId === frame.instanceId}
            <div
              class="focused-widget-placeholder"
              data-focused-widget-placeholder={frame.instanceId}
              role="status"
            >{frame.title} is open in Focus.</div>
          {:else}
            <WidgetFrame
              {frame}
              {store}
              {rendererRegistry}
              {hostContext}
              onfocuswidget={focusWidget}
              surfacePart={frameSurfacePart(frame)}
              title={frameTitle(frame)}
              meta={frameMeta(frame)}
              class="widget-frame"
            />
          {/if}
        </div>
      {/snippet}
    </WorkbenchSurface>
  </section>

  <WidgetCatalog
    {catalog}
    {rendererRegistry}
    {hostContext}
    instanceCounts={catalogInstanceCounts}
    oncreate={placeFromCatalog}
    ontargetplace={placeFromCatalog}
    getPlacementTargetRoot={() => workbenchElement ?? null}
    isPlacementTargetCompatible={isCatalogPlacementTargetCompatible}
    class="widget-catalog"
  />

  {#if focusedFrame}
    <FocusedWidget
      frame={focusedFrame}
      title={frameTitle(focusedFrame)}
      meta={frameMeta(focusedFrame)}
      {store}
      {rendererRegistry}
      {hostContext}
      onreturn={() => void returnFromFocusedWidget()}
    />
  {/if}

  <PanelCreateDialog bind:this={panelDialog} oncreate={createPanel} />
  <SubPanelDialog bind:this={subPanelDialog} {store} oncreated={reportCreatedTab} />
</main>
