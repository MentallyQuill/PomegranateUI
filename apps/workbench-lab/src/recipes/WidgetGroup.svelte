<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import { onDestroy, tick } from 'svelte';
  import { createTabReorderController } from './TabReorderController.js';
  import { createWidgetDragController } from './WidgetDragController.js';
  import {
    nextWidgetGroupGestureOwner,
    type WidgetGroupGestureOwner
  } from './widget-group-gesture.js';
  import {
    createSecondaryWidgetContextController,
    getWidgetActionMenuContext,
    type WidgetActionRequestSource
  } from './WidgetActionMenuController.js';

  let {
    frames,
    store,
    renderWidget,
    titleFor,
    onexpanddock
  }: {
    frames: readonly WidgetFrameProjection[];
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    onexpanddock?: ((edge: 'left' | 'right') => void) | undefined;
  } = $props();

  const ordered = $derived([...frames].sort((left, right) => {
    const leftOrder = left.placement.kind === 'docked' ? left.placement.group?.order ?? 0 : 0;
    const rightOrder = right.placement.kind === 'docked' ? right.placement.group?.order ?? 0 : 0;
    return leftOrder - rightOrder || left.instanceId.localeCompare(right.instanceId);
  }));
  const active = $derived(ordered.find((frame) => frame.placement.kind === 'docked' && frame.placement.group?.active) ?? ordered[0]);
  const rowHeight = $derived(active?.placement.kind === 'docked' ? active.placement.height : undefined);
  let previewFrameId = $state<WidgetFrameProjection['instanceId'] | null>(null);
  const rendered = $derived(previewFrameId === null
    ? active
    : ordered.find((frame) => frame.instanceId === previewFrameId) ?? active);
  const groupId = $derived(active?.placement.kind === 'docked' ? active.placement.group?.id : undefined);
  let dragFrame = $state<WidgetFrameProjection | null>(null);
  let dragging = $state(false);
  let tablist = $state<HTMLElement>();
  let actionsOpen = $state(false);
  let lastTouchPointerAt = Number.NEGATIVE_INFINITY;
  const requestWidgetActions = getWidgetActionMenuContext();
  const secondaryContext = createSecondaryWidgetContextController();
  let groupGesture: {
    pointerId: number;
    pointerType: string;
    startX: number;
    startY: number;
    startedAt: number;
    owner: WidgetGroupGestureOwner;
  } | null = null;
  const drag = createWidgetDragController({
    getFrame: () => dragFrame ?? active!,
    getStore: () => store,
    setDragging: (next) => {
      dragging = next;
      if (!next) previewFrameId = null;
    },
    onExpandDock: (edge) => onexpanddock?.(edge),
    activation: 'manual'
  });
  onDestroy(() => {
    drag.destroy();
    secondaryContext.destroy();
  });

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
    if (event.pointerType === 'touch') lastTouchPointerAt = event.timeStamp;
    const anchor = event.currentTarget as HTMLElement;
    if (secondaryContext.pointerDown(event, frame.instanceId, (point) => openActions(frame, anchor, 'pointer', point))) return;
    if (event.button !== 0) return;
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
    if (groupGesture.owner === 'tear-off') {
      drag.pointerMove(event);
      return;
    }

    const corridor = tablist?.getBoundingClientRect();
    if (!corridor) return;
    const owner = nextWidgetGroupGestureOwner({
      owner: groupGesture.owner,
      dx: event.clientX - groupGesture.startX,
      dy: event.clientY - groupGesture.startY,
      y: event.clientY,
      corridor: { top: corridor.top, bottom: corridor.bottom },
      pointerType: groupGesture.pointerType,
      elapsedMs: event.timeStamp - groupGesture.startedAt
    });
    if (owner === 'cancelled') {
      groupGesture = null;
      reorderDrag.pointerCancel(event);
      drag.pointerCancel(event);
      return;
    }
    if (owner === 'pending') return;
    groupGesture.owner = owner;
    if (owner === 'reorder') {
      reorderDrag.pointerMove(event);
      return;
    }

    if (owner === 'tear-off') {
      reorderDrag.preventNextClick();
      reorderDrag.pointerCancel(event);
      previewFrameId = dragFrame?.instanceId ?? null;
      void tick().then(() => {
        if (groupGesture?.pointerId === event.pointerId && groupGesture.owner === 'tear-off') drag.activate(event);
      });
    }
  }

  function dragPointerUp(event: PointerEvent) {
    if (secondaryContext.pointerUp(event)) return;
    if (!groupGesture || groupGesture.pointerId !== event.pointerId) return;
    const owner = groupGesture.owner;
    groupGesture = null;
    if (owner === 'reorder') {
      drag.pointerCancel(event);
      reorderDrag.pointerUp(event);
    }
    else if (owner === 'tear-off') drag.pointerUp(event);
    else {
      reorderDrag.pointerUp(event);
      drag.pointerUp(event);
    }
  }

  function dragPointerCancel(event: PointerEvent) {
    secondaryContext.pointerCancel(event);
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
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      event.preventDefault();
      openActions(frame, event.currentTarget as HTMLElement, 'keyboard');
      return;
    }
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

  function openActions(
    frame: WidgetFrameProjection,
    anchor: HTMLElement,
    source: WidgetActionRequestSource,
    point?: { x: number; y: number }
  ) {
    requestWidgetActions?.({
      frame,
      title: titleFor?.(frame) ?? frame.title,
      anchor,
      source,
      ...(point ? { point } : {}),
      onopenchange: (open) => { actionsOpen = open; }
    });
  }

  function tabContextMenu(event: MouseEvent, frame: WidgetFrameProjection) {
    const pointerType = (event as MouseEvent & { pointerType?: string }).pointerType;
    if (pointerType ? pointerType === 'touch' : event.timeStamp - lastTouchPointerAt < 2_000) {
      event.preventDefault();
      return;
    }
    const anchor = event.currentTarget as HTMLElement;
    secondaryContext.contextMenu(event, frame.instanceId, (point) => openActions(frame, anchor, 'pointer', point));
  }
</script>

<section
  class="widget-group"
  class:is-dragging={dragging}
  role="group"
  aria-label="Widget group"
  data-widget-group
  data-widget-group-id={groupId}
  data-pomegranate-row-height={rowHeight}
  data-pom-part="group.surface"
  style={rowHeight === undefined ? undefined : `height:${rowHeight}px;min-height:${rowHeight}px`}
>
  <div class="widget-group-header" data-widget-group-header data-pom-part="widget.header">
    <div bind:this={tablist} class="widget-group-tabs" data-pom-control-group="joined" role="tablist" aria-label="Grouped Widgets">
      {#each ordered as frame, index (frame.instanceId)}
        {@const title = titleFor?.(frame) ?? frame.title}
        <span data-tab-reorder-item>
          <button
            type="button"
            data-pom-part="button.surface"
            data-pom-control-segment={ordered.length === 1 ? 'only' : index === 0 ? 'start' : index === ordered.length - 1 ? 'end' : 'middle'}
            role="tab"
            data-group-tab={frame.instanceId}
            data-group-widget-type={frame.instance.type}
            data-widget-drag-root
            data-widget-drag-surface
            data-widget-touch-drag-grip
            data-tab-touch-reorder-grip
            data-focus-widget-for={frame.instanceId}
            aria-selected={frame.instanceId === active?.instanceId}
            aria-keyshortcuts="Shift+F10"
            tabindex={frame.instanceId === active?.instanceId ? 0 : -1}
            onclick={() => { if (!reorderDrag.consumeClick()) activate(frame); }}
            oncontextmenu={(event) => tabContextMenu(event, frame)}
            onkeydown={(event) => tabKeyDown(event, frame)}
            onpointerdown={(event) => dragPointerDown(event, frame)}
            onpointermove={dragPointerMove}
            onpointerup={dragPointerUp}
            onpointercancel={dragPointerCancel}
          >{title}</button>
        </span>
      {/each}
    </div>
    {#if active}
      <button
        class="widget-actions-trigger action-menu"
        type="button"
        data-pom-part="button.icon"
        aria-label="Widget actions"
        aria-haspopup="menu"
        aria-expanded={actionsOpen}
        onclick={(event) => openActions(active, event.currentTarget, 'touch')}
      >Widget actions</button>
    {/if}
  </div>
  {#if rendered}
    {@render renderWidget(rendered)}
  {/if}
</section>
