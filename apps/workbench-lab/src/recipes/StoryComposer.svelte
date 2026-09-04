<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelId } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';
  import StoryMeasureResizeHandle from './StoryMeasureResizeHandle.svelte';

  let { children, panelId, measure, minimum, maximum, resizable = true, store }: {
    children: Snippet;
    panelId: PanelId;
    measure: number;
    minimum: number;
    maximum: number;
    resizable?: boolean;
    store: WorkbenchStore;
  } = $props();
</script>

<section class="story-composer" data-story-composer aria-label="Story composer instrument">
  {@render children()}
  {#if resizable}
    <StoryMeasureResizeHandle edge="left" {panelId} {measure} {minimum} {maximum} {store} />
    <StoryMeasureResizeHandle edge="right" {panelId} {measure} {minimum} {maximum} {store} />
  {/if}
</section>
