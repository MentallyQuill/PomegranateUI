<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WorkbenchState } from '@pomegranate-ui/contracts';
  import {
    selectPanelSurface,
    type WidgetFrameProjection,
    type WorkbenchStore
  } from '@pomegranate-ui/core';
  import PanelTemplateSurface from './PanelTemplateSurface.svelte';
  import ToolbarResizeHandle from './ToolbarResizeHandle.svelte';
  import UnavailableTemplate from './UnavailableTemplate.svelte';

  let {
    store,
    renderWidget,
    titleFor,
    class: className = ''
  }: {
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    class?: string;
  } = $props();

  let state = $state<WorkbenchState>();
  $effect(() => {
    const current = store;
    state = current.getState();
    return current.subscribe((next) => { state = next; });
  });
  const surface = $derived(state ? selectPanelSurface(state, store.registry, store.templates) : null);
  const activePanel = $derived(state?.panels.find((panel) => panel.id === state?.activePanelId));
  const panelDockWidths = $derived.by(() => {
    const raw = activePanel?.configuration?.dockWidths;
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw as Readonly<Record<string, unknown>>;
  });
  const leftWidth = $derived(typeof panelDockWidths.left === 'number' ? panelDockWidths.left : 286);
  const rightWidth = $derived(typeof panelDockWidths.right === 'number' ? panelDockWidths.right : 286);
  const leftCssWidth = $derived(typeof panelDockWidths.left === 'number' ? `${leftWidth}px` : 'var(--pom-side-width)');
  const rightCssWidth = $derived(typeof panelDockWidths.right === 'number' ? `${rightWidth}px` : 'var(--pom-side-width)');

</script>

{#if surface}
  <div
    class={className}
    id={surface.surfaceId}
    role="tabpanel"
    aria-labelledby={surface.tabId}
    data-pomegranate-panel={surface.panelId}
    data-pom-part="panel.surface"
    style={`--pom-left-width:${leftCssWidth};--pom-right-width:${rightCssWidth}`}
  >
    {#if surface.unavailableTemplateId}
      <UnavailableTemplate templateId={surface.unavailableTemplateId} />
    {:else}
      <PanelTemplateSurface {surface} {store} {renderWidget} {titleFor} />
    {/if}
    <div data-shelf-insertion="left" aria-hidden="true"></div>
    <div data-shelf-insertion="right" aria-hidden="true"></div>
    <ToolbarResizeHandle edge="left" panelId={surface.panelId} width={leftWidth} {store} />
    <ToolbarResizeHandle edge="right" panelId={surface.panelId} width={rightWidth} {store} />
    <div data-pomegranate-floating-layer>
      {#each surface.floating as frame (frame.instanceId)}
        {@render renderWidget(frame)}
      {/each}
    </div>
  </div>
{:else}
  <section data-pomegranate-empty-workbench data-pom-part="panel.surface" aria-label="Empty Workbench">
    <p>Create or activate a Panel to begin.</p>
  </section>
{/if}
