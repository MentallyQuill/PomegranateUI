<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelSurfaceProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import DockRegion from './DockRegion.svelte';
  import StoryComposer from './StoryComposer.svelte';
  import StoryStage from './StoryStage.svelte';

  let { surface, store, renderWidget, titleFor }: {
    surface: PanelSurfaceProjection;
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
  } = $props();
</script>

<div
  class="panel-template-surface"
  data-panel-template-family={surface.templateFamily}
  style={`--pom-template-columns:${surface.regions.length}`}
>
  {#each surface.regions as region (region.region.id)}
    {#if surface.templateFamily === 'story-stage' && region.region.role === 'stage'}
      <StoryStage><DockRegion projection={region} {store} {renderWidget} {titleFor} surfacePart={null} /></StoryStage>
    {:else if surface.templateFamily === 'story-stage' && region.region.role === 'composer'}
      <StoryComposer><DockRegion projection={region} {store} {renderWidget} {titleFor} surfacePart={null} /></StoryComposer>
    {:else}
      <DockRegion projection={region} {store} {renderWidget} {titleFor} />
    {/if}
  {/each}
</div>
