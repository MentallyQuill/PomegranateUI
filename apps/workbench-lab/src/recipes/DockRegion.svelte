<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelRegionProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import DockShelf from './DockShelf.svelte';

  let { projection, store, renderWidget }: {
    projection: PanelRegionProjection;
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
  } = $props();

  const legacyDock = $derived(
    projection.region.id === 'stage' ? 'main'
      : projection.region.id === 'focus' || projection.region.id === 'column-1' ? 'left'
        : projection.region.id === 'support' ? 'right'
          : projection.region.id
  );
</script>

<section
  class="dock-region"
  data-pomegranate-region-surface={projection.region.id}
  data-pomegranate-region-role={projection.region.role}
  data-pomegranate-dock={legacyDock}
  data-conformance-region={projection.region.id}
  data-pom-part="dock.surface"
  aria-label={`${projection.region.label} region`}
>
  {#each projection.shelves as shelf, index (`${shelf.shelf.regionId}:${shelf.shelf.id}`)}
    <DockShelf projection={shelf} {store} {renderWidget} resizable={index < projection.shelves.length - 1} />
  {/each}
</section>
