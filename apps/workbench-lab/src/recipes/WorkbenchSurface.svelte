<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WorkbenchState } from '@pomegranate-ui/contracts';
  import {
    selectPanelSurface,
    type WidgetFrameProjection,
    type WorkbenchStore
  } from '@pomegranate-ui/core';
  import ToolbarResizeHandle from './ToolbarResizeHandle.svelte';
  import WidgetGroup from './WidgetGroup.svelte';

  let {
    store,
    renderWidget,
    class: className = ''
  }: {
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    class?: string;
  } = $props();

  const edges = ['left', 'main', 'right'] as const;
  let state = $state<WorkbenchState>();
  $effect(() => {
    const current = store;
    state = current.getState();
    return current.subscribe((next) => { state = next; });
  });
  const surface = $derived(state ? selectPanelSurface(state, store.registry) : null);
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

  type DockItem =
    | { readonly kind: 'widget'; readonly id: string; readonly frame: WidgetFrameProjection }
    | { readonly kind: 'group'; readonly id: string; readonly frames: readonly WidgetFrameProjection[] };

  function dockItems(frames: readonly WidgetFrameProjection[]): readonly DockItem[] {
    const items: DockItem[] = [];
    const seenGroups = new Set<string>();
    for (const frame of frames) {
      const groupId = frame.placement.kind === 'docked' ? frame.placement.group?.id : undefined;
      if (!groupId) {
        items.push({ kind: 'widget', id: frame.instanceId, frame });
        continue;
      }
      if (seenGroups.has(groupId)) continue;
      seenGroups.add(groupId);
      items.push({
        kind: 'group',
        id: groupId,
        frames: frames.filter((candidate) => candidate.placement.kind === 'docked' && candidate.placement.group?.id === groupId)
      });
    }
    return items;
  }
</script>

{#if surface}
  <div
    class={className}
    id={surface.surfaceId}
    role="tabpanel"
    aria-labelledby={surface.tabId}
    data-pomegranate-panel={surface.panelId}
    style={`--pom-left-width:${leftCssWidth};--pom-right-width:${rightCssWidth}`}
  >
    {#each edges as edge}
      <section
        data-pomegranate-dock={edge}
        data-conformance-region={edge === 'main' ? 'stage' : edge}
        aria-label={`${edge} dock`}
      >
        {#each dockItems(surface.docks[edge]) as item (item.id)}
          {#if item.kind === 'group'}
            <WidgetGroup frames={item.frames} {store} {renderWidget} />
          {:else}
            {@render renderWidget(item.frame)}
          {/if}
        {/each}
      </section>
    {/each}
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
  <section data-pomegranate-empty-workbench aria-label="Empty Workbench">
    <p>Create or activate a Panel to begin.</p>
  </section>
{/if}
