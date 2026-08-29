<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { asPanelId, asWidgetInstanceId, asWidgetType, type WidgetManifest, type WorkbenchState } from '@pomegranate-ui/contracts';
  import { loadLayout, saveLayout } from '@pomegranate-ui/layout';
  import { setWorkbenchContext, toSvelteCatalogStore } from '@pomegranate-ui/svelte';
  import type { WidgetFrameProjection } from '@pomegranate-ui/core';
  import { FIRST_SLICE_CONTRACT_IDS } from '@pomegranate-ui/testkit';

  import deepCurrentStage from './assets/deep-current-stage.jpg';
  import { createLabHostContext, type LabThemeInspector } from './mockup/host-context.js';
  import { IMPLEMENTED_SURFACES, IMPLEMENTED_SURFACE_TYPES } from './mockup/implemented-surfaces.js';
  import { getSurfaceFixture, resolveSurfaceState } from './mockup/surface-fixtures.js';
  import { createLabRuntime } from './mockup/widgets.js';
  import PanelTabs from './recipes/PanelTabs.svelte';
  import FocusedWidget from './recipes/FocusedWidget.svelte';
  import WidgetCatalog from './recipes/WidgetCatalog.svelte';
  import WidgetFrame from './recipes/WidgetFrame.svelte';
  import WorkbenchSurface from './recipes/WorkbenchSurface.svelte';
  import { createLocalLayoutStorage, LAB_LAYOUT_KEY } from './storage.js';
  import { createLabThemeController } from './themes/controller.js';
  import { LAB_THEME_PRESETS } from './themes/presets.js';
  import { createLocalThemePreference } from './themes/theme-storage.js';

  const runtime = createLabRuntime();
  const storage = createLocalLayoutStorage();
  const { store, catalog, rendererRegistry } = runtime;
  const requestedSurface = new URLSearchParams(window.location.search).get('surface');
  const requestedSurfaceState = new URLSearchParams(window.location.search).get('surfaceState');
  const requestedType = requestedSurface ? asWidgetType(requestedSurface) : null;
  const requestedDefinition = requestedType ? IMPLEMENTED_SURFACES.find(({ type }) => type === requestedType) : undefined;
  const requestedFixture = requestedType && IMPLEMENTED_SURFACE_TYPES.has(requestedType) ? getSurfaceFixture(requestedType) : undefined;
  const initialSurfaceState = requestedFixture ? resolveSurfaceState(requestedSurfaceState, requestedFixture) : 'ready';
  if (requestedSurface) {
    if (requestedType && IMPLEMENTED_SURFACE_TYPES.has(requestedType)) {
      const panelId = asPanelId('surface-preview');
      store.dispatch({
        type: 'panel.create',
        panel: { id: panelId, name: 'Surface Preview', templateId: 'focus-support.v1', order: 3, configuration: { columns: 1 } }
      });
      store.dispatch({ type: 'panel.activate', panelId });
      store.dispatch({
        type: 'widget.create',
        instance: { id: asWidgetInstanceId('surface-preview-widget'), type: requestedType, manifestVersion: '1.0.0', configuration: {} },
        placement: {
          kind: 'docked',
          panelId,
          edge: requestedDefinition?.family === 'systems' ? 'right' : requestedDefinition?.family === 'story' ? 'main' : 'left',
          shelfId: 'primary',
          order: 0
        }
      });
    }
  }
  const catalogState = toSvelteCatalogStore(catalog);
  const themeController = createLabThemeController({
    preference: createLocalThemePreference(window.localStorage),
    availableAssets: new Set(['icons.minimal', 'image.deep-current-stage'])
  });
  const themeAssetBindings = `--pom-asset-image-deep-current-stage:url("${deepCurrentStage}")`;
  const initialThemeSnapshot = themeController.getSnapshot();
  let themeSnapshot = $state(initialThemeSnapshot);

  function themeInspector(): LabThemeInspector {
    return {
      colors: themeSnapshot.resolved.colors,
      typography: [
        themeSnapshot.resolved.typography.ui.family,
        themeSnapshot.resolved.typography.prose.family,
        themeSnapshot.resolved.typography.technical.family
      ],
      geometry: `${themeSnapshot.resolved.geometry.cornerFamily} · ${themeSnapshot.resolved.geometry.cornerMd}px`,
      density: themeSnapshot.resolved.spacing.density,
      iconPackId: themeSnapshot.resolved.iconPackId
    };
  }

  function activateTheme(id: string) {
    const result = themeController.activate(id);
    if (result.ok) {
      themeSnapshot = result.snapshot;
      hostContext.theme.activeId = result.snapshot.activeId;
      hostContext.theme.inspector = themeInspector();
      status = `${result.snapshot.resolved.label} applied without changing Workbench state.`;
    } else {
      status = result.diagnostics[0]?.message ?? 'Theme activation failed.';
    }
  }

  let hostContext = $state(createLabHostContext({
    activeId: initialThemeSnapshot.activeId,
    presets: LAB_THEME_PRESETS.map(({ id, definition }) => ({
      id,
      label: definition.label,
      description: definition.description ?? definition.label
    })),
    inspector: themeInspector(),
    activate: activateTheme
  }, initialSurfaceState));
  setWorkbenchContext({ store, catalog, rendererRegistry, hostContext });

  let workbench: WorkbenchState = $state(store.getState());
  let focusMode = $state(false);
  let focusedFrame = $state<WidgetFrameProjection | null>(null);
  let focusReturnId: string | null = null;
  let leftCollapsed = $state(false);
  let panelDialog: HTMLDialogElement;
  let panelName = $state('New Panel');
  let status = $state('Local mockup ready.');
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
    void loadLayout(storage, LAB_LAYOUT_KEY, store.getState()).then((loaded) => {
      if (current && loaded.ok) {
        store.dispatch({ type: 'layout.hydrate', state: loaded.state });
        status = 'Restored the saved local layout.';
      }
    });
    return () => { current = false; };
  });

  const activePanel = $derived(workbench.panels.find((panel) => panel.id === workbench.activePanelId));

  function floatingStyle(frame: { placement: { kind: string; x?: number; y?: number; width?: number; height?: number; z?: number } }) {
    if (frame.placement.kind !== 'floating') return '';
    return `left:${frame.placement.x}px;top:${frame.placement.y}px;width:${frame.placement.width}px;min-height:${frame.placement.height}px;z-index:${frame.placement.z}`;
  }

  function addFromCatalog(manifest: WidgetManifest) {
    const panelId = workbench.activePanelId;
    if (!panelId) return;
    const id = asWidgetInstanceId(`catalog-${manifest.type.replace(/[^a-z0-9]+/gi, '-')}-${workbench.revision + 1}`);
    const edge = manifest.defaultPlacement.kind === 'docked' ? manifest.defaultPlacement.edge : 'main';
    const result = store.dispatch({
      type: 'widget.create',
      instance: { id, type: manifest.type, manifestVersion: manifest.version, configuration: {} },
      placement: { kind: 'docked', panelId, edge, shelfId: 'primary', order: Number.MAX_SAFE_INTEGER }
    });
    status = result.ok ? `${manifest.title} added to ${activePanel?.name ?? 'Panel'}.` : result.error.message;
  }

  function createPanel(event: SubmitEvent) {
    event.preventDefault();
    const id = asPanelId(`user-panel-${workbench.panels.length - 2}`);
    const result = store.dispatch({
      type: 'panel.create',
      panel: { id, name: panelName.trim() || 'Untitled Panel', templateId: 'columns.v1', order: workbench.panels.length, configuration: { columns: 2 } }
    });
    if (result.ok) {
      store.dispatch({ type: 'panel.activate', panelId: id });
      panelDialog.close();
      status = `${panelName} created.`;
    } else status = result.error.message;
  }

  async function save() {
    const result = await saveLayout(storage, LAB_LAYOUT_KEY, store.getState());
    status = result.ok ? 'Saved pomegranate.ui.layout.v1 locally.' : result.error.message;
  }

  async function reload() {
    const result = await loadLayout(storage, LAB_LAYOUT_KEY, store.getState());
    if (result.ok) store.dispatch({ type: 'layout.hydrate', state: result.state });
    status = result.ok ? 'Reloaded the saved local layout.' : result.error.message;
  }

  async function clear() {
    await storage.remove?.(LAB_LAYOUT_KEY);
    status = 'Cleared the saved local layout.';
  }

  function openPanelDialog() {
    panelDialog.showModal();
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
</script>

<svelte:head><title>PomegranateUI Workbench Lab</title></svelte:head>

<main
  class:focus-mode={focusMode}
  class:left-collapsed={leftCollapsed}
  data-pom-theme={themeSnapshot.activeId}
  data-active-panel={workbench.activePanelId}
  data-workbench-revision={workbench.revision}
  style={`${themeSnapshot.cssText};${themeAssetBindings}`}
>
  <div class="atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>
  <header class="top-shelf" data-conformance-region="shelf">
    <a class="wordmark" href="#workbench"><span aria-hidden="true">P</span><strong>PomegranateUI</strong><small>Workbench Lab</small></a>
    <PanelTabs {store} class="panel-tabs" />
    <div class="story-lockup">
      <span>Active story</span>
      <strong>{hostContext.storyTitle}</strong>
      <small aria-label="Active story identity">{hostContext.storyId} · {hostContext.frameLabel}</small>
    </div>
    <div class="shelf-actions">
      <button type="button" aria-label="Open Widget Catalog" aria-expanded={$catalogState.open} onclick={() => catalog.open('drawer')}>Widgets</button>
      <button type="button" aria-pressed={focusMode} onclick={() => { focusMode = !focusMode; }}>Focus reading</button>
      <span class="runtime-status"><i></i>{hostContext.systemStatus}</span>
    </div>
  </header>

  <section class="context-rail" aria-label="Workbench context">
    <p><span>{activePanel?.templateId ?? 'No Panel'}</span><strong>{activePanel?.name ?? 'No active Panel'}</strong></p>
    <div class="theme-targets" role="group" aria-label="Visual target">
      {#each LAB_THEME_PRESETS as preset (preset.id)}
        <button
          type="button"
          aria-label={preset.definition.label}
          aria-pressed={themeSnapshot.activeId === preset.id}
          onclick={() => activateTheme(preset.id)}
        >{preset.definition.label}</button>
      {/each}
    </div>
    <div class="dock-controls">
      {#if requestedFixture}
        <label class="surface-preview-control">State
          <select
            aria-label="Surface preview state"
            value={hostContext.surfaceState}
            onchange={(event) => { hostContext.surfaceState = event.currentTarget.value; }}
          >
            {#each requestedFixture.states as fixtureState}<option value={fixtureState}>{fixtureState}</option>{/each}
          </select>
        </label>
      {/if}
      <button type="button" aria-pressed={leftCollapsed} onclick={() => { leftCollapsed = !leftCollapsed; }}>Collapse left dock</button>
      <button type="button" onclick={openPanelDialog}>Create Panel</button>
    </div>
    <div class="persistence-actions">
      <button type="button" onclick={() => void save()}>Save layout</button>
      <button type="button" onclick={() => void reload()}>Reload saved layout</button>
      <button type="button" onclick={() => void clear()}>Clear saved layout</button>
    </div>
  </section>

  <section id="workbench" class="workbench-shell" aria-label="Active Workbench">
    <WorkbenchSurface {store} class="workbench-surface">
      {#snippet renderWidget(frame)}
        <div
          class:widget-float={frame.placement.kind === 'floating'}
          data-widget-type={frame.instance.type}
          data-widget-shape={frame.manifest?.catalog?.shape}
          data-pomegranate-placement={frame.placement.kind}
          data-pomegranate-edge={frame.placement.kind === 'docked' ? frame.placement.edge : undefined}
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
              class="widget-frame"
            />
          {/if}
        </div>
      {/snippet}
    </WorkbenchSurface>
  </section>

  <footer class="lab-footer">
    <p role="status" aria-live="polite">{status}</p>
    <details><summary>Event log</summary><ol>{#each eventLog as entry}<li>{entry}</li>{/each}</ol></details>
    <details><summary>Native contract evidence</summary><ul>{#each FIRST_SLICE_CONTRACT_IDS as id}<li>{id}</li>{/each}</ul></details>
  </footer>

  <WidgetCatalog {catalog} oncreate={addFromCatalog} class="widget-catalog" />

  {#if focusedFrame}
    <FocusedWidget
      frame={focusedFrame}
      {store}
      {rendererRegistry}
      {hostContext}
      onreturn={() => void returnFromFocusedWidget()}
    />
  {/if}

  <dialog bind:this={panelDialog} aria-labelledby="panel-dialog-title">
    <form onsubmit={createPanel}>
      <h2 id="panel-dialog-title">Create a Panel</h2>
      <label>Panel name<input bind:value={panelName} /></label>
      <p>Starts as an adopter-owned two-column layout.</p>
      <div><button type="button" onclick={() => panelDialog.close()}>Cancel</button><button type="submit">Create Panel</button></div>
    </form>
  </dialog>
</main>
