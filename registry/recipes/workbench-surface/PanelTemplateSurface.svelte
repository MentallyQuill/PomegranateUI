<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelSurfaceProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import DockRegion from './DockRegion.svelte';
  import StoryComposer from './StoryComposer.svelte';
  import StoryStage from './StoryStage.svelte';
  let { surface, store, renderWidget }: { surface: PanelSurfaceProjection; store: WorkbenchStore; renderWidget: Snippet<[WidgetFrameProjection]> } = $props();
</script>
<div class="panel-template-surface" data-panel-template-family={surface.templateFamily} style={`--pom-template-columns:${surface.regions.length}`}>
  {#each surface.regions as region (region.region.id)}
    {#if surface.templateFamily === 'story-stage' && region.region.role === 'stage'}
      <StoryStage><DockRegion projection={region} {store} {renderWidget} /></StoryStage>
    {:else if surface.templateFamily === 'story-stage' && region.region.role === 'composer'}
      <StoryComposer><DockRegion projection={region} {store} {renderWidget} /></StoryComposer>
    {:else}
      <DockRegion projection={region} {store} {renderWidget} />
    {/if}
  {/each}
</div>
