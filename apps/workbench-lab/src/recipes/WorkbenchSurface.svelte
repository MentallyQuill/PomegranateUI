<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ToolbarTogglePresentation, WorkbenchState } from '@pomegranate-ui/contracts';
  import { resolveStoryLayoutGeometry } from '@pomegranate-ui/layout';
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
    storyTitle,
    currentScene,
    leftCollapsed = false,
    rightCollapsed = false,
    showDockResizers = false,
    toolbarTogglePresentation = 'edge-labels',
    ontoggleleft,
    ontoggleright,
    class: className = ''
  }: {
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    onexpanddock?: ((edge: 'left' | 'right') => void) | undefined;
    storyTitle: string;
    currentScene: string;
    leftCollapsed?: boolean;
    rightCollapsed?: boolean;
    showDockResizers?: boolean;
    toolbarTogglePresentation?: ToolbarTogglePresentation;
    ontoggleleft?: (() => void) | undefined;
    ontoggleright?: (() => void) | undefined;
    class?: string;
  } = $props();

  let workbenchState = $state<WorkbenchState>();
  let panelRoot = $state<HTMLElement>();
  let availableWidth = $state(1920);
  $effect(() => {
    const current = store;
    workbenchState = current.getState();
    return current.subscribe((next) => { workbenchState = next; });
  });
  const surface = $derived(workbenchState ? selectPanelSurface(workbenchState, store.registry, store.templates) : null);
  const activeSubPanel = $derived(workbenchState
    ? selectSubPanelTabs(workbenchState).find((subPanel) => subPanel.selected)
    : undefined);
  const activePanel = $derived(workbenchState?.panels.find((panel) => panel.id === workbenchState?.activePanelId));
  $effect(() => {
    const root = panelRoot;
    if (!root) return;
    const update = () => {
      const measuredWidth = root.clientWidth - 14;
      if (measuredWidth > 0) availableWidth = measuredWidth;
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  });
  const panelDockWidths = $derived.by(() => {
    const raw = activePanel?.configuration?.dockWidths;
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw as Readonly<Record<string, unknown>>;
  });
  const storyGeometry = $derived(activePanel && surface?.templateFamily === 'story-stage'
    ? resolveStoryLayoutGeometry({
        panel: activePanel,
        availableWidth,
        leftOpen: !leftCollapsed,
        rightOpen: !rightCollapsed
      })
    : null);
  const leftWidth = $derived(storyGeometry?.left.renderedWidth ?? (typeof panelDockWidths.left === 'number' ? panelDockWidths.left : 286));
  const rightWidth = $derived(storyGeometry?.right.renderedWidth ?? (typeof panelDockWidths.right === 'number' ? panelDockWidths.right : 286));
  const leftCssWidth = $derived(storyGeometry ? `${leftWidth}px` : typeof panelDockWidths.left === 'number' ? `${leftWidth}px` : 'var(--pom-side-width)');
  const rightCssWidth = $derived(storyGeometry ? `${rightWidth}px` : typeof panelDockWidths.right === 'number' ? `${rightWidth}px` : 'var(--pom-side-width)');
  const leftToggleLabel = $derived(`${leftCollapsed ? 'Open' : 'Close'} left toolbar`);
  const rightToggleLabel = $derived(`${rightCollapsed ? 'Open' : 'Close'} right toolbar`);

</script>

{#snippet toolbarControls()}
  <button
    type="button"
    class="toolbar-edge-toggle toolbar-edge-toggle-left"
    aria-label={leftToggleLabel}
    aria-pressed={leftCollapsed}
    data-toolbar-toggle-presentation={toolbarTogglePresentation}
    onclick={ontoggleleft}
  >{#if toolbarTogglePresentation === 'bottom-chevrons'}<span class="toolbar-toggle-chevron" aria-hidden="true">{leftCollapsed ? '›' : '‹'}</span>{:else}{leftCollapsed ? 'OPEN' : 'CLOSE'} TOOLBAR LFT{/if}</button>
  <button
    type="button"
    class="toolbar-edge-toggle toolbar-edge-toggle-right"
    aria-label={rightToggleLabel}
    aria-pressed={rightCollapsed}
    data-toolbar-toggle-presentation={toolbarTogglePresentation}
    onclick={ontoggleright}
  >{#if toolbarTogglePresentation === 'bottom-chevrons'}<span class="toolbar-toggle-chevron" aria-hidden="true">{rightCollapsed ? '‹' : '›'}</span>{:else}{rightCollapsed ? 'OPEN' : 'CLOSE'} TOOLBAR RGT{/if}</button>
{/snippet}

{#if surface}
  <div
    bind:this={panelRoot}
    class={className}
    id={surface.surfaceId}
    role="tabpanel"
    aria-labelledby={surface.tabId}
    data-pomegranate-panel={surface.panelId}
    data-sub-panel-layout={surface.activeSubPanelLayoutId ?? undefined}
    data-pom-part="panel.surface"
    style={`--pom-left-width:${leftCssWidth};--pom-right-width:${rightCssWidth};--pom-story-measure:${storyGeometry?.renderedMeasure ?? 800}px`}
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
        <PanelTemplateSurface
          {surface}
          {store}
          {renderWidget}
          {titleFor}
          {onexpanddock}
          {storyTitle}
          {currentScene}
          {storyGeometry}
          {leftCollapsed}
          {rightCollapsed}
        />
      {/if}
      {#if surface.templateFamily === 'story-stage' ? storyGeometry?.left.visible && !storyGeometry.left.compressed : showDockResizers}
        <ToolbarResizeHandle
          edge="left"
          panelId={surface.panelId}
          width={leftWidth}
          minimum={(storyGeometry?.left.renderedColumnCount ?? 1) * 200}
          maximum={(storyGeometry?.left.renderedColumnCount ?? 1) * 420}
          {store}
        />
      {/if}
      {#if surface.templateFamily === 'story-stage' ? storyGeometry?.right.visible && !storyGeometry.right.compressed : showDockResizers}
        <ToolbarResizeHandle
          edge="right"
          panelId={surface.panelId}
          width={rightWidth}
          minimum={(storyGeometry?.right.renderedColumnCount ?? 1) * 200}
          maximum={(storyGeometry?.right.renderedColumnCount ?? 1) * 420}
          {store}
        />
      {/if}
      {#if surface.templateFamily === 'story-stage'}
        {@render toolbarControls()}
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
