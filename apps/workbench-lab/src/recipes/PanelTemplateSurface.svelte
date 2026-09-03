<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelSurfaceProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import ColumnResizeHandle from './ColumnResizeHandle.svelte';
  import DockRegion from './DockRegion.svelte';
  import StoryComposer from './StoryComposer.svelte';
  import StoryStage from './StoryStage.svelte';

  let { surface, store, renderWidget, titleFor, toolbarControls }: {
    surface: PanelSurfaceProjection;
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    toolbarControls?: Snippet | undefined;
  } = $props();
</script>

<div
  class="panel-template-surface"
  data-panel-template-family={surface.templateFamily}
  data-sub-panel-layout={surface.activeSubPanelLayoutId ?? undefined}
  style={`--pom-template-columns:${surface.regions.length};--pom-sub-panel-columns:${surface.columnWeights.map((weight) => `${weight}fr`).join(' ')}`}
>
  {#if surface.templateFamily === 'story-stage'}
    <p class="story-scene-chrome" aria-hidden="true">FIG. 07 / LIMINAL RESERVOIR</p>
  {/if}
  {#each surface.regions as region (region.region.id)}
    {#if surface.templateFamily === 'story-stage' && region.region.role === 'stage'}
      <StoryStage><DockRegion projection={region} {store} {renderWidget} {titleFor} surfacePart={null} rowResizable={false} /></StoryStage>
    {:else if surface.templateFamily === 'story-stage' && region.region.role === 'composer'}
      <StoryComposer><DockRegion projection={region} {store} {renderWidget} {titleFor} surfacePart={null} rowResizable={false} /></StoryComposer>
    {:else}
      <DockRegion projection={region} {store} {renderWidget} {titleFor} rowResizable={surface.templateFamily !== 'story-stage'} />
    {/if}
  {/each}
  {#if surface.templateFamily === 'focus-support' || surface.templateFamily === 'columns'}
    {#each surface.regions.slice(0, -1) as region, boundary (region.region.id)}
      <ColumnResizeHandle
        panelId={surface.panelId}
        subPanelId={surface.activeSubPanelId}
        {boundary}
        weights={surface.columnWeights}
        defaultWeights={surface.defaultColumnWeights}
        beforeLabel={region.region.label}
        afterLabel={surface.regions[boundary + 1]!.region.label}
        {store}
      />
    {/each}
  {/if}
  {#if toolbarControls}{@render toolbarControls()}{/if}
</div>
