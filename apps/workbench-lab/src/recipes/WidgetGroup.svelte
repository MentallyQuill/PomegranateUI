<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import { createWidgetDragController } from './WidgetDragController.js';

  let {
    frames,
    store,
    renderWidget,
    titleFor
  }: {
    frames: readonly WidgetFrameProjection[];
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
  } = $props();

  const ordered = $derived([...frames].sort((left, right) => {
    const leftOrder = left.placement.kind === 'docked' ? left.placement.group?.order ?? 0 : 0;
    const rightOrder = right.placement.kind === 'docked' ? right.placement.group?.order ?? 0 : 0;
    return leftOrder - rightOrder || left.instanceId.localeCompare(right.instanceId);
  }));
  const active = $derived(ordered.find((frame) => frame.placement.kind === 'docked' && frame.placement.group?.active) ?? ordered[0]);
  const groupId = $derived(active?.placement.kind === 'docked' ? active.placement.group?.id : undefined);
  let dragFrame = $state<WidgetFrameProjection | null>(null);
  let dragging = $state(false);
  const drag = createWidgetDragController({
    getFrame: () => dragFrame ?? active!,
    getStore: () => store,
    setDragging: (next) => { dragging = next; }
  });

  function dragPointerDown(event: PointerEvent, frame: WidgetFrameProjection) {
    const placement = store.getState().placements[frame.instanceId];
    if (placement?.kind === 'docked' && !placement.group?.active) {
      activate(frame);
    }
    dragFrame = frame;
    drag.pointerDown(event);
  }

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

<section class="widget-group" class:is-dragging={dragging} role="group" aria-label="Widget group" data-widget-group data-widget-group-id={groupId} data-pom-part="group.surface">
  <div class="widget-group-tabs" role="tablist" aria-label="Grouped Widgets" data-pom-part="widget.header">
    {#each ordered as frame, index (frame.instanceId)}
      {@const title = titleFor?.(frame) ?? frame.title}
      <span>
        <button
          type="button"
          data-pom-part="button.surface"
          role="tab"
          data-group-tab={frame.instanceId}
          data-group-widget-type={frame.instance.type}
          data-widget-drag-root
          data-widget-drag-surface
          aria-selected={frame.instanceId === active?.instanceId}
          tabindex={frame.instanceId === active?.instanceId ? 0 : -1}
          onclick={() => activate(frame)}
          onkeydown={(event) => tabKeyDown(event, frame)}
          onpointerdown={(event) => dragPointerDown(event, frame)}
          onpointermove={drag.pointerMove}
          onpointerup={drag.pointerUp}
          onpointercancel={drag.pointerCancel}
        >{title}</button>
        <button
          type="button"
          class="widget-group-move"
          data-pom-part="button.icon"
          aria-label={`Move ${title} left`}
          disabled={index === 0}
          onclick={() => move(frame, -1)}
        >Move left</button>
        <button
          type="button"
          class="widget-group-move"
          data-pom-part="button.icon"
          aria-label={`Move ${title} right`}
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
