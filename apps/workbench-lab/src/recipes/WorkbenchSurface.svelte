<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WorkbenchState } from '@pomegranate-ui/contracts';
  import {
    selectPanelSurface,
    selectSubPanelTabs,
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
    onexpanddock,
    leftCollapsed = false,
    rightCollapsed = false,
    ontoggleleft,
    ontoggleright,
    class: className = ''
  }: {
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    onexpanddock?: ((edge: 'left' | 'right') => void) | undefined;
    leftCollapsed?: boolean;
    rightCollapsed?: boolean;
    ontoggleleft?: (() => void) | undefined;
    ontoggleright?: (() => void) | undefined;
    class?: string;
  } = $props();

  let state = $state<WorkbenchState>();
  $effect(() => {
    const current = store;
    state = current.getState();
    return current.subscribe((next) => { state = next; });
  });
  const surface = $derived(state ? selectPanelSurface(state, store.registry, store.templates) : null);
  const activeSubPanel = $derived(state
    ? selectSubPanelTabs(state).find((subPanel) => subPanel.selected)
    : undefined);
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
    data-sub-panel-layout={surface.activeSubPanelLayoutId ?? undefined}
    data-pom-part="panel.surface"
    style={`--pom-left-width:${leftCssWidth};--pom-right-width:${rightCssWidth}`}
  >
    <div
      class="sub-panel-surface"
      id={activeSubPanel?.surfaceId}
      role={activeSubPanel ? 'tabpanel' : undefined}
      aria-labelledby={activeSubPanel?.tabId}
      data-pom-part={activeSubPanel ? 'sub-panel.surface' : undefined}
      data-sub-panel={activeSubPanel?.subPanelIdAttribute}
    >
      {#if surface.unavailableTemplateId}
        <UnavailableTemplate templateId={surface.unavailableTemplateId} />
      {:else}
        <PanelTemplateSurface {surface} {store} {renderWidget} {titleFor} {onexpanddock} />
      {/if}
      <ToolbarResizeHandle edge="left" panelId={surface.panelId} width={leftWidth} {store} />
      <ToolbarResizeHandle edge="right" panelId={surface.panelId} width={rightWidth} {store} />
      {#if surface.templateFamily === 'story-stage'}
        <button
          type="button"
          class="toolbar-edge-toggle toolbar-edge-toggle-left"
          aria-label="Toggle left dock"
          aria-pressed={leftCollapsed}
          onclick={ontoggleleft}
        >OPEN TOOLBAR LFT</button>
        <button
          type="button"
          class="toolbar-edge-toggle toolbar-edge-toggle-right"
          aria-label="Toggle right dock"
          aria-pressed={rightCollapsed}
          onclick={ontoggleright}
        >OPEN TOOLBAR RGT</button>
      {/if}
      <div data-pomegranate-floating-layer>
        {#each surface.floating as frame (frame.instanceId)}
          {@render renderWidget(frame)}
        {/each}
      </div>
    </div>
  </div>
{:else}
  <section data-pomegranate-empty-workbench data-pom-part="panel.surface" aria-label="Empty Workbench">
    <p>Create or activate a Panel to begin.</p>
  </section>
{/if}
