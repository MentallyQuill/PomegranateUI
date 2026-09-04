<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelSurfaceProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import type { StoryLayoutGeometry } from '@pomegranate-ui/layout';
  import ColumnResizeHandle from './ColumnResizeHandle.svelte';
  import DockRegion from './DockRegion.svelte';
  import StoryComposer from './StoryComposer.svelte';
  import StoryMeasureResizeHandle from './StoryMeasureResizeHandle.svelte';
  import StoryStage from './StoryStage.svelte';
  import StoryToolbar from './StoryToolbar.svelte';

  let { surface, store, renderWidget, titleFor, onexpanddock, storyTitle, currentScene, storyGeometry, leftCollapsed, rightCollapsed, toolbarControls }: {
    surface: PanelSurfaceProjection;
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    onexpanddock?: ((edge: 'left' | 'right') => void) | undefined;
    storyTitle: string;
    currentScene: string;
    storyGeometry?: StoryLayoutGeometry | null;
    leftCollapsed?: boolean;
    rightCollapsed?: boolean;
    toolbarControls?: Snippet | undefined;
  } = $props();
</script>

<div
  class="panel-template-surface"
  data-panel-template-family={surface.templateFamily}
  data-sub-panel-layout={surface.activeSubPanelLayoutId ?? undefined}
  style={`--pom-template-columns:${surface.regions.length};--pom-sub-panel-columns:${surface.columnWeights.map((weight) => `${weight}fr`).join(' ')}`}
>
  {#each surface.regions as region (region.region.id)}
    {#if surface.templateFamily === 'story-stage' && region.region.role === 'stage'}
      <StoryStage {storyTitle} {currentScene}><DockRegion projection={region} {store} {renderWidget} {titleFor} {onexpanddock} surfacePart={null} rowResizable={false} /></StoryStage>
    {:else if surface.templateFamily === 'story-stage' && region.region.role === 'composer'}
      <StoryComposer><DockRegion projection={region} {store} {renderWidget} {titleFor} {onexpanddock} surfacePart={null} rowResizable={false} /></StoryComposer>
    {:else if surface.templateFamily === 'story-stage' && region.region.role === 'left-instruments' && storyGeometry}
      <StoryToolbar panelId={surface.panelId} projection={region} edge="left" geometry={storyGeometry.left} collapsed={leftCollapsed ?? false} {store} {renderWidget} {titleFor} {onexpanddock} />
    {:else if surface.templateFamily === 'story-stage' && region.region.role === 'right-instruments' && storyGeometry}
      <StoryToolbar panelId={surface.panelId} projection={region} edge="right" geometry={storyGeometry.right} collapsed={rightCollapsed ?? false} {store} {renderWidget} {titleFor} {onexpanddock} />
    {:else}
      <DockRegion projection={region} {store} {renderWidget} {titleFor} {onexpanddock} rowResizable={surface.templateFamily !== 'story-stage'} />
    {/if}
  {/each}
  {#if surface.templateFamily === 'story-stage' && storyGeometry && !storyGeometry.compact}
    <div class="story-measure-resize-layer">
      <StoryMeasureResizeHandle
        edge="left"
        panelId={surface.panelId}
        measure={storyGeometry.renderedMeasure}
        minimum={420}
        maximum={storyGeometry.maximumMeasure}
        {store}
      />
      <StoryMeasureResizeHandle
        edge="right"
        panelId={surface.panelId}
        measure={storyGeometry.renderedMeasure}
        minimum={420}
        maximum={storyGeometry.maximumMeasure}
        {store}
      />
    </div>
  {/if}
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
