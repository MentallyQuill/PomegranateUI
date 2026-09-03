<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelSurfaceProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import DockRegion from './DockRegion.svelte';
  import StoryComposer from './StoryComposer.svelte';
  import StoryStage from './StoryStage.svelte';

  let { surface, store, renderWidget, titleFor, onexpanddock }: {
    surface: PanelSurfaceProjection;
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    onexpanddock?: ((edge: 'left' | 'right') => void) | undefined;
  } = $props();
</script>

<div
  class="panel-template-surface"
  data-panel-template-family={surface.templateFamily}
  data-sub-panel-layout={surface.activeSubPanelLayoutId ?? undefined}
  style={`--pom-template-columns:${surface.regions.length};--pom-sub-panel-columns:${surface.regions.map((region) => `${region.laneWeight}fr`).join(' ')}`}
>
  {#if surface.templateFamily === 'story-stage'}
    <p class="story-scene-chrome" aria-hidden="true">FIG. 07 / LIMINAL RESERVOIR</p>
  {/if}
  {#each surface.regions as region (region.region.id)}
    {#if surface.templateFamily === 'story-stage' && region.region.role === 'stage'}
      <StoryStage><DockRegion projection={region} {store} {renderWidget} {titleFor} {onexpanddock} surfacePart={null} /></StoryStage>
    {:else if surface.templateFamily === 'story-stage' && region.region.role === 'composer'}
      <StoryComposer><DockRegion projection={region} {store} {renderWidget} {titleFor} {onexpanddock} surfacePart={null} /></StoryComposer>
    {:else}
      <DockRegion projection={region} {store} {renderWidget} {titleFor} {onexpanddock} />
    {/if}
  {/each}
</div>
