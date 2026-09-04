<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelId, WidgetInstanceId } from '@pomegranate-ui/contracts';
  import type { PanelRegionProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import type { StoryToolbarGeometry } from '@pomegranate-ui/layout';
  import StoryToolbarColumn from './StoryToolbarColumn.svelte';
  import ToolbarColumnRemovalDialog from './ToolbarColumnRemovalDialog.svelte';

  let { panelId, projection, edge, geometry, collapsed, store, renderWidget, titleFor, onexpanddock }: {
    panelId: PanelId;
    projection: PanelRegionProjection;
    edge: 'left' | 'right';
    geometry: StoryToolbarGeometry;
    collapsed: boolean;
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    onexpanddock?: ((edge: 'left' | 'right') => void) | undefined;
  } = $props();

  let removalDialog = $state<{ open(): void }>();
  let removeButton = $state<HTMLButtonElement>();
  let addButton = $state<HTMLButtonElement>();
  let status = $state('');
  const innermostColumn = $derived(
    projection.toolbarColumns.find(({ index }) => index === geometry.columnCount - 1)
  );
  const affectedWidgets = $derived(
    innermostColumn?.shelves.flatMap(({ frames }) => frames.map((frame) => ({
      id: frame.instanceId,
      title: titleFor?.(frame) ?? frame.title
    }))) ?? []
  );
  const controlsVisible = $derived(geometry.visible && !geometry.compressed && !collapsed);

  function addColumn() {
    store.dispatch({ type: 'panel.add-toolbar-column', panelId, edge });
  }

  function removeColumn() {
    if (affectedWidgets.length === 0) {
      store.dispatch({ type: 'panel.remove-toolbar-column', panelId, edge, expectedWidgetIds: [] });
      return;
    }
    removalDialog?.open();
  }

  function confirmRemoval(widgetIds: readonly WidgetInstanceId[]): boolean {
    const result = store.dispatch({
      type: 'panel.remove-toolbar-column', panelId, edge, expectedWidgetIds: widgetIds
    });
    if (!result.ok) {
      status = result.error.code === 'STALE_LAYOUT'
        ? 'Column contents changed. Review the updated Widget list before removing it.'
        : result.error.message;
      return false;
    }
    queueMicrotask(() => (geometry.columnCount > 2 ? removeButton : addButton)?.focus());
    return true;
  }

  function restoreRemoveFocus() {
    queueMicrotask(() => removeButton?.focus());
  }
</script>

<section
  class="dock-region story-toolbar"
  class:is-compressed={geometry.compressed}
  data-pomegranate-region-role={projection.region.role}
  data-conformance-region={projection.region.id}
  data-pomegranate-dock={edge}
  data-pom-part="dock.surface"
  aria-label={`${projection.region.label} region`}
>
  <div class="story-toolbar-columns" style={`--pom-story-toolbar-columns:${geometry.renderedColumnCount}`}>
    {#each projection.toolbarColumns as column (column.index)}
      <StoryToolbarColumn {projection} {column} {store} {renderWidget} {titleFor} {onexpanddock} />
    {/each}
  </div>
  {#if controlsVisible}
    <div class="story-toolbar-column-controls" data-toolbar-column-controls={edge}>
      <button
        bind:this={removeButton}
        type="button"
        data-pom-part="button.surface"
        aria-label={`Remove column from ${edge} toolbar`}
        disabled={geometry.columnCount <= 1}
        onclick={removeColumn}
      >−</button>
      <button
        bind:this={addButton}
        type="button"
        data-pom-part="button.surface"
        aria-label={`Add column to ${edge} toolbar`}
        disabled={!geometry.canAddColumn}
        onclick={addColumn}
      >+</button>
    </div>
  {/if}
  <p class="visually-hidden" role="status" aria-live="polite">{status}</p>
</section>

<ToolbarColumnRemovalDialog
  bind:this={removalDialog}
  {edge}
  widgets={affectedWidgets}
  onconfirm={confirmRemoval}
  oncancel={restoreRemoveFocus}
/>
