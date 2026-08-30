<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  let { frames, store, renderWidget }: { frames: readonly WidgetFrameProjection[]; store: WorkbenchStore; renderWidget: Snippet<[WidgetFrameProjection]> } = $props();
  const ordered = $derived([...frames].sort((left, right) => (left.placement.kind === 'docked' ? left.placement.group?.order ?? 0 : 0) - (right.placement.kind === 'docked' ? right.placement.group?.order ?? 0 : 0)));
  const active = $derived(ordered.find((frame) => frame.placement.kind === 'docked' && frame.placement.group?.active) ?? ordered[0]);
</script>
<section class="widget-group" role="group" aria-label="Widget group" data-widget-group data-pom-part="group.surface">
  <div role="tablist" aria-label="Grouped Widgets" data-pom-part="widget.header">
    {#each ordered as frame (frame.instanceId)}
      <button type="button" data-pom-part="button.surface" role="tab" aria-selected={frame.instanceId === active?.instanceId} tabindex={frame.instanceId === active?.instanceId ? 0 : -1} onclick={() => store.dispatch({ type: 'widget.group.activate', instanceId: frame.instanceId })}>{frame.title}</button>
    {/each}
  </div>
  {#if active}{@render renderWidget(active)}{/if}
</section>
