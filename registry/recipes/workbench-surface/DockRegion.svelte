<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelRegionProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import DockShelf from './DockShelf.svelte';
  let { projection, store, renderWidget, titleFor, surfacePart = 'dock.surface' }: { projection: PanelRegionProjection; store: WorkbenchStore; renderWidget: Snippet<[WidgetFrameProjection]>; titleFor?: ((frame: WidgetFrameProjection) => string) | undefined; surfacePart?: 'dock.surface' | null } = $props();
</script>
<section data-pomegranate-region-surface={projection.region.id} data-pomegranate-region-role={projection.region.role} data-pom-part={surfacePart ?? undefined} aria-label={`${projection.region.label} region`}>
  {#each projection.shelves as shelf, index (`${shelf.shelf.regionId}:${shelf.shelf.id}`)}
    <DockShelf projection={shelf} {store} {renderWidget} {titleFor} resizable={index < projection.shelves.length - 1} />
  {/each}
</section>
