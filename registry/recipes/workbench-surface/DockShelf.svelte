<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelShelfProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import ShelfResizeHandle from './ShelfResizeHandle.svelte';
  import WidgetGroup from './WidgetGroup.svelte';
  let { projection, store, renderWidget, titleFor, resizable = false }: { projection: PanelShelfProjection; store: WorkbenchStore; renderWidget: Snippet<[WidgetFrameProjection]>; titleFor?: ((frame: WidgetFrameProjection) => string) | undefined; resizable?: boolean } = $props();
  const groups = $derived([...new Set(projection.frames.flatMap((frame) => frame.placement.kind === 'docked' && frame.placement.group ? [frame.placement.group.id] : []))]);
</script>
<section class="dock-shelf" data-pomegranate-shelf={projection.shelf.id} data-pomegranate-shelf-order={projection.shelf.order} aria-label={`${projection.shelf.id} shelf`} style={`--pom-shelf-weight:${projection.shelf.weight}`}>
  {#each projection.frames.filter((frame) => frame.placement.kind !== 'docked' || !frame.placement.group) as frame (frame.instanceId)}{@render renderWidget(frame)}{/each}
  {#each groups as groupId (groupId)}
    <WidgetGroup frames={projection.frames.filter((frame) => frame.placement.kind === 'docked' && frame.placement.group?.id === groupId)} {store} {renderWidget} {titleFor} />
  {/each}
</section>
{#if resizable}<ShelfResizeHandle panelId={projection.shelf.panelId} regionId={projection.shelf.regionId} shelfId={projection.shelf.id} weight={projection.shelf.weight} {store} />{/if}
