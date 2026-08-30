<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelSurfaceProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import DockRegion from './DockRegion.svelte';

  let { surface, store, renderWidget }: {
    surface: PanelSurfaceProjection;
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
  } = $props();
</script>

<div
  class="panel-template-surface"
  data-panel-template-family={surface.templateFamily}
  style={`--pom-template-columns:${surface.regions.length}`}
>
  {#each surface.regions as region (region.region.id)}
    <DockRegion projection={region} {store} {renderWidget} />
  {/each}
</div>
