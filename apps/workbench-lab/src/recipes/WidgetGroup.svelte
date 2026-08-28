<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';

  let {
    frames,
    store,
    renderWidget
  }: {
    frames: readonly WidgetFrameProjection[];
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
  } = $props();

  const ordered = $derived([...frames].sort((left, right) => {
    const leftOrder = left.placement.kind === 'docked' ? left.placement.group?.order ?? 0 : 0;
    const rightOrder = right.placement.kind === 'docked' ? right.placement.group?.order ?? 0 : 0;
    return leftOrder - rightOrder || left.instanceId.localeCompare(right.instanceId);
  }));
  const active = $derived(ordered.find((frame) => frame.placement.kind === 'docked' && frame.placement.group?.active) ?? ordered[0]);

  function activate(frame: WidgetFrameProjection) {
    store.dispatch({ type: 'widget.group.activate', instanceId: frame.instanceId });
  }

  function move(frame: WidgetFrameProjection, delta: number) {
    const order = frame.placement.kind === 'docked' ? frame.placement.group?.order ?? 0 : 0;
    store.dispatch({
      type: 'widget.group.reorder',
      instanceId: frame.instanceId,
      toIndex: Math.max(0, Math.min(ordered.length - 1, order + delta))
    });
  }

  function tabKeyDown(event: KeyboardEvent, frame: WidgetFrameProjection) {
    if (!event.altKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(frame, event.key === 'ArrowLeft' ? -1 : 1);
  }
</script>

<section class="widget-group" role="group" aria-label="Widget group" data-widget-group>
  <div class="widget-group-tabs" role="tablist" aria-label="Grouped Widgets">
    {#each ordered as frame, index (frame.instanceId)}
      <span>
        <button
          type="button"
          role="tab"
          data-group-tab={frame.instanceId}
          aria-selected={frame.instanceId === active?.instanceId}
          tabindex={frame.instanceId === active?.instanceId ? 0 : -1}
          onclick={() => activate(frame)}
          onkeydown={(event) => tabKeyDown(event, frame)}
        >{frame.title}</button>
        <button
          type="button"
          class="widget-group-move"
          aria-label={`Move ${frame.title} left`}
          disabled={index === 0}
          onclick={() => move(frame, -1)}
        >Move left</button>
        <button
          type="button"
          class="widget-group-move"
          aria-label={`Move ${frame.title} right`}
          disabled={index === ordered.length - 1}
          onclick={() => move(frame, 1)}
        >Move right</button>
      </span>
    {/each}
  </div>
  {#if active}
    {@render renderWidget(active)}
  {/if}
</section>
