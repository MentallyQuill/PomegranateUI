<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { PanelShelfProjection, WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import ShelfResizeHandle from './ShelfResizeHandle.svelte';
  import WidgetRowResizeHandle from './WidgetRowResizeHandle.svelte';
  import WidgetGroup from './WidgetGroup.svelte';

  let { projection, store, renderWidget, titleFor, resizable = false, rowResizable = true }: {
    projection: PanelShelfProjection;
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    resizable?: boolean;
    rowResizable?: boolean;
  } = $props();

  type ShelfItem =
    | { readonly kind: 'widget'; readonly id: string; readonly frame: WidgetFrameProjection }
    | { readonly kind: 'group'; readonly id: string; readonly frames: readonly WidgetFrameProjection[] };

  const items = $derived.by(() => {
    const result: ShelfItem[] = [];
    const groups = new Set<string>();
    for (const frame of projection.frames) {
      const groupId = frame.placement.kind === 'docked' ? frame.placement.group?.id : undefined;
      if (!groupId) result.push({ kind: 'widget', id: frame.instanceId, frame });
      else if (!groups.has(groupId)) {
        groups.add(groupId);
        result.push({
          kind: 'group', id: groupId,
          frames: projection.frames.filter((candidate) => candidate.placement.kind === 'docked' && candidate.placement.group?.id === groupId)
        });
      }
    }
    return result;
  });

  function frameFor(item: ShelfItem): WidgetFrameProjection {
    if (item.kind === 'widget') return item.frame;
    return item.frames.find((frame) => frame.placement.kind === 'docked' && frame.placement.group?.active)
      ?? item.frames[0]!;
  }

  function minimumFor(item: ShelfItem): number {
    const frames = item.kind === 'widget' ? [item.frame] : item.frames;
    return Math.max(...frames.map((frame) => frame.manifest?.catalog?.geometry.minHeight ?? 80));
  }

  function maximumFor(item: ShelfItem): number {
    const frames = item.kind === 'widget' ? [item.frame] : item.frames;
    return Math.max(minimumFor(item), Math.min(...frames.map((frame) => frame.manifest?.catalog?.geometry.maxHeight ?? 1200)));
  }
</script>

<section
  class="dock-shelf"
  data-pomegranate-shelf={projection.shelf.id}
  data-pomegranate-shelf-order={projection.shelf.order}
  aria-label={`${projection.shelf.id} shelf`}
  style={`--pom-shelf-weight:${projection.shelf.weight}`}
>
  {#each items as item (item.id)}
    {@const rowFrame = frameFor(item)}
    {#if item.kind === 'group'}
      <WidgetGroup frames={item.frames} {store} {renderWidget} {titleFor} />
    {:else}
      {@render renderWidget(item.frame)}
    {/if}
    {#if rowResizable}
      <WidgetRowResizeHandle
        instanceId={rowFrame.instanceId}
        label={titleFor?.(rowFrame) ?? rowFrame.title}
        height={rowFrame.placement.kind === 'docked' ? rowFrame.placement.height : undefined}
        minimum={minimumFor(item)}
        maximum={maximumFor(item)}
        {store}
      />
    {/if}
  {/each}
</section>
{#if resizable}
  <ShelfResizeHandle
    panelId={projection.shelf.panelId}
    regionId={projection.shelf.regionId}
    shelfId={projection.shelf.id}
    weight={projection.shelf.weight}
    {store}
  />
{/if}
