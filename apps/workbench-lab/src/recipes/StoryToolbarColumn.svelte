<script lang="ts">
  import type { Snippet } from 'svelte';
  import type {
    PanelRegionProjection,
    PanelToolbarColumnProjection,
    WidgetFrameProjection,
    WorkbenchStore
  } from '@pomegranate-ui/core';
  import DockShelf from './DockShelf.svelte';

  let { projection, column, store, renderWidget, titleFor, onexpanddock }: {
    projection: PanelRegionProjection;
    column: PanelToolbarColumnProjection;
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    onexpanddock?: ((edge: 'left' | 'right') => void) | undefined;
  } = $props();
</script>

<section
  class="story-toolbar-column"
  data-pomegranate-region-surface={projection.region.id}
  data-dock-column={column.index}
  aria-label={`${projection.region.label} column ${column.index + 1}`}
>
  {#each column.shelves as shelf, index (`${column.index}:${shelf.shelf.id}`)}
    <DockShelf
      projection={shelf}
      {store}
      {renderWidget}
      {titleFor}
      {onexpanddock}
      resizable={index < column.shelves.length - 1}
      rowResizable={false}
    />
  {/each}
</section>
