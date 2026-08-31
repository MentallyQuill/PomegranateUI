<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import { onDestroy, tick } from 'svelte';
  import { createTabReorderController } from './TabReorderController.js';
  import { createWidgetDragController } from './WidgetDragController.js';
  import { tabDragDecision } from './tab-reorder.js';

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
  let previewFrameId = $state<WidgetFrameProjection['instanceId'] | null>(null);
  const rendered = $derived(previewFrameId === null
    ? active
    : ordered.find((frame) => frame.instanceId === previewFrameId) ?? active);
  const groupId = $derived(active?.placement.kind === 'docked' ? active.placement.group?.id : undefined);
  let dragFrame = $state<WidgetFrameProjection | null>(null);
  let dragging = $state(false);
  let tablist = $state<HTMLElement>();
  let groupGesture: {
    pointerId: number;
    pointerType: string;
    startX: number;
    startY: number;
    startedAt: number;
    owner: 'pending' | 'reorder' | 'tear-off';
  } | null = null;
  const drag = createWidgetDragController({
    getFrame: () => dragFrame ?? active!,
    getStore: () => store,
    setDragging: (next) => {
      dragging = next;
      if (!next) previewFrameId = null;
    },
    activation: 'vertical-tearoff'
  });
  onDestroy(drag.destroy);

  const reorderDrag = createTabReorderController({
    getItems: () => ordered.flatMap((frame) => {
      const element = tablist?.querySelector<HTMLElement>(`[data-group-tab="${CSS.escape(frame.instanceId)}"]`)?.closest<HTMLElement>('[data-tab-reorder-item]');
      return element ? [{ id: frame.instanceId, element }] : [];
    }),
    commit: (instanceId, toIndex) => store.dispatch({
      type: 'widget.group.reorder',
      instanceId: instanceId as WidgetFrameProjection['instanceId'],
      toIndex
    })
  });
  onDestroy(reorderDrag.destroy);

  function dragPointerDown(event: PointerEvent, frame: WidgetFrameProjection) {
    dragFrame = frame;
    groupGesture = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: event.timeStamp,
      owner: 'pending'
    };
    reorderDrag.pointerDown(event, frame.instanceId);
    drag.pointerDown(event);
  }

  function dragPointerMove(event: PointerEvent) {
    if (!groupGesture || groupGesture.pointerId !== event.pointerId) return;
    if (groupGesture.owner === 'pending') {
      const decision = tabDragDecision({
        dx: event.clientX - groupGesture.startX,
        dy: event.clientY - groupGesture.startY,
        pointerType: groupGesture.pointerType,
        elapsedMs: event.timeStamp - groupGesture.startedAt,
        allowTearOff: true
      });
      if (decision === 'cancelled') {
        groupGesture = null;
        reorderDrag.pointerCancel(event);
        drag.pointerCancel(event);
        return;
      }
      if (decision === 'pending') return;
      groupGesture.owner = decision === 'tear-off' ? 'tear-off' : 'reorder';
      if (groupGesture.owner === 'reorder') {
        drag.pointerCancel(event);
        reorderDrag.pointerMove(event);
        return;
      }
      reorderDrag.preventNextClick();
      reorderDrag.pointerCancel(event);
      previewFrameId = dragFrame?.instanceId ?? null;
      void tick().then(() => {
        if (groupGesture?.pointerId === event.pointerId && groupGesture.owner === 'tear-off') drag.pointerMove(event);
      });
      return;
    }
    if (groupGesture.owner === 'reorder') reorderDrag.pointerMove(event);
    else drag.pointerMove(event);
  }

  function dragPointerUp(event: PointerEvent) {
    if (!groupGesture || groupGesture.pointerId !== event.pointerId) return;
    const owner = groupGesture.owner;
    groupGesture = null;
    if (owner === 'reorder') reorderDrag.pointerUp(event);
    else if (owner === 'tear-off') drag.pointerUp(event);
    else {
      reorderDrag.pointerUp(event);
      drag.pointerUp(event);
    }
  }

  function dragPointerCancel(event: PointerEvent) {
    if (!groupGesture || groupGesture.pointerId !== event.pointerId) return;
    groupGesture = null;
    reorderDrag.pointerCancel(event);
    drag.pointerCancel(event);
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
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const delta = event.key === 'ArrowLeft' ? -1 : 1;
    if (event.ctrlKey && event.shiftKey) {
      move(frame, delta);
      void tick().then(() => tablist?.querySelector<HTMLButtonElement>(`[data-group-tab="${CSS.escape(frame.instanceId)}"]`)?.focus());
      return;
    }
    const index = ordered.findIndex((candidate) => candidate.instanceId === frame.instanceId);
    const next = ordered[(index + delta + ordered.length) % ordered.length];
    if (!next) return;
    activate(next);
    void tick().then(() => tablist?.querySelector<HTMLButtonElement>(`[data-group-tab="${CSS.escape(next.instanceId)}"]`)?.focus());
  }
</script>

<section class="widget-group" class:is-dragging={dragging} role="group" aria-label="Widget group" data-widget-group data-widget-group-id={groupId} data-pom-part="group.surface">
  <div bind:this={tablist} class="widget-group-tabs" role="tablist" aria-label="Grouped Widgets" data-pom-part="widget.header">
    {#each ordered as frame (frame.instanceId)}
      {@const title = titleFor?.(frame) ?? frame.title}
      <span data-tab-reorder-item>
        <button
          type="button"
          data-pom-part="button.surface"
          role="tab"
          data-group-tab={frame.instanceId}
          data-group-widget-type={frame.instance.type}
          data-widget-drag-root
          data-widget-drag-surface
          data-widget-touch-drag-grip
          aria-selected={frame.instanceId === active?.instanceId}
          tabindex={frame.instanceId === active?.instanceId ? 0 : -1}
          onclick={() => { if (!reorderDrag.consumeClick()) activate(frame); }}
          onkeydown={(event) => tabKeyDown(event, frame)}
          onpointerdown={(event) => dragPointerDown(event, frame)}
          onpointermove={dragPointerMove}
          onpointerup={dragPointerUp}
          onpointercancel={dragPointerCancel}
        >{title}</button>
      </span>
    {/each}
  </div>
  {#if rendered}
    {@render renderWidget(rendered)}
  {/if}
</section>
