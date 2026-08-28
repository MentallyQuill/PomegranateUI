<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { asPanelId, asWidgetInstanceId, type WidgetManifest, type WorkbenchState } from '@pomegranate-ui/contracts';
  import { loadLayout, saveLayout } from '@pomegranate-ui/layout';
  import { setWorkbenchContext } from '@pomegranate-ui/svelte';
  import { FIRST_SLICE_CONTRACT_IDS } from '@pomegranate-ui/testkit';

  import { LAB_HOST_CONTEXT } from './mockup/host-context.js';
  import { createLabRuntime } from './mockup/widgets.js';
  import PanelTabs from './recipes/PanelTabs.svelte';
  import WidgetCatalog from './recipes/WidgetCatalog.svelte';
  import WidgetFrame from './recipes/WidgetFrame.svelte';
  import WorkbenchSurface from './recipes/WorkbenchSurface.svelte';
  import { createLocalLayoutStorage, LAB_LAYOUT_KEY } from './storage.js';

  const runtime = createLabRuntime();
  const storage = createLocalLayoutStorage();
  const { store, catalog, rendererRegistry } = runtime;
  setWorkbenchContext({ store, catalog, rendererRegistry, hostContext: LAB_HOST_CONTEXT });

  let workbench: WorkbenchState = $state(store.getState());
  let focusMode = $state(false);
  let leftCollapsed = $state(false);
  let panelDialogOpen = $state(false);
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
      panelDialogOpen = false;
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
</script>

<svelte:head><title>PomegranateUI Workbench Lab</title></svelte:head>

<main class:focus-mode={focusMode} class:left-collapsed={leftCollapsed}>
  <div class="atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>
  <header class="top-shelf">
    <a class="wordmark" href="#workbench"><span aria-hidden="true">P</span><strong>PomegranateUI</strong><small>Workbench Lab</small></a>
    <PanelTabs {store} class="panel-tabs" />
    <div class="story-lockup">
      <span>Active story</span>
      <strong>{LAB_HOST_CONTEXT.storyTitle}</strong>
      <small aria-label="Active story identity">{LAB_HOST_CONTEXT.storyId} · {LAB_HOST_CONTEXT.frameLabel}</small>
    </div>
    <div class="shelf-actions">
      <button type="button" aria-label="Open Widget Catalog" aria-expanded={catalog.getState().open} onclick={() => catalog.open('drawer')}>Widgets</button>
      <button type="button" aria-pressed={focusMode} onclick={() => { focusMode = !focusMode; }}>Focus reading</button>
      <span class="runtime-status"><i></i>{LAB_HOST_CONTEXT.systemStatus}</span>
    </div>
  </header>

  <section class="context-rail" aria-label="Workbench context">
    <p><span>{activePanel?.templateId ?? 'No Panel'}</span><strong>{activePanel?.name ?? 'No active Panel'}</strong></p>
    <div class="dock-controls">
      <button type="button" aria-pressed={leftCollapsed} onclick={() => { leftCollapsed = !leftCollapsed; }}>Collapse left dock</button>
      <button type="button" onclick={() => { panelDialogOpen = true; }}>Create Panel</button>
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
        <div class:widget-float={frame.placement.kind === 'floating'} style={floatingStyle(frame)}>
          <WidgetFrame
            {frame}
            {store}
            {rendererRegistry}
            hostContext={LAB_HOST_CONTEXT}
            class="widget-frame"
          />
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

  {#if panelDialogOpen}
    <dialog open aria-labelledby="panel-dialog-title">
      <form onsubmit={createPanel}>
        <h2 id="panel-dialog-title">Create a Panel</h2>
        <label>Panel name<input bind:value={panelName} /></label>
        <p>Starts as an adopter-owned two-column layout.</p>
        <div><button type="button" onclick={() => { panelDialogOpen = false; }}>Cancel</button><button type="submit">Create Panel</button></div>
      </form>
    </dialog>
  {/if}
</main>
