<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  let { frames, store, renderWidget, titleFor, onrequestactions }: {
    frames: readonly WidgetFrameProjection[];
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    onrequestactions?: ((request: {
      frame: WidgetFrameProjection;
      title: string;
      anchor: HTMLElement;
      source: 'pointer' | 'keyboard' | 'touch';
      point?: { x: number; y: number };
    }) => void) | undefined;
  } = $props();
  const ordered = $derived([...frames].sort((left, right) => (left.placement.kind === 'docked' ? left.placement.group?.order ?? 0 : 0) - (right.placement.kind === 'docked' ? right.placement.group?.order ?? 0 : 0)));
  const active = $derived(ordered.find((frame) => frame.placement.kind === 'docked' && frame.placement.group?.active) ?? ordered[0]);
  const rowHeight = $derived(active?.placement.kind === 'docked' ? active.placement.height : undefined);
  let lastTouchPointerAt = Number.NEGATIVE_INFINITY;
  let secondaryPointer: {
    pointerId: number;
    frame: WidgetFrameProjection;
    anchor: HTMLElement;
    releaseQueued: boolean;
  } | undefined;
  let secondaryDuplicate: { frameId: string; anchor: HTMLElement; until: number } | undefined;

  function requestActions(frame: WidgetFrameProjection, anchor: HTMLElement, source: 'pointer' | 'keyboard' | 'touch', point?: { x: number; y: number }) {
    onrequestactions?.({ frame, title: titleFor?.(frame) ?? frame.title, anchor, source, ...(point ? { point } : {}) });
  }

  function clearSecondaryPointer(current = secondaryPointer) {
    if (!current || secondaryPointer !== current) return;
    secondaryPointer = undefined;
    window.removeEventListener('pointerup', finishSecondaryPointer);
    window.removeEventListener('pointercancel', cancelSecondaryPointer);
    window.removeEventListener('blur', cancelSecondaryOnBlur);
  }

  function cancelSecondaryOnBlur() {
    clearSecondaryPointer();
  }

  function finishSecondaryPointer(event: PointerEvent) {
    const current = secondaryPointer;
    if (!current || current.pointerId !== event.pointerId) return false;
    event.preventDefault();
    if (current.releaseQueued) return true;
    current.releaseQueued = true;
    const point = { x: event.clientX, y: event.clientY };
    secondaryDuplicate = {
      frameId: current.frame.instanceId,
      anchor: current.anchor,
      until: performance.now() + 1_000
    };
    queueMicrotask(() => {
      if (secondaryPointer !== current) return;
      clearSecondaryPointer(current);
      requestActions(current.frame, current.anchor, 'pointer', point);
    });
    return true;
  }

  function cancelSecondaryPointer(event: PointerEvent) {
    if (secondaryPointer?.pointerId === event.pointerId) clearSecondaryPointer();
  }

  function handleContextMenu(event: MouseEvent, frame: WidgetFrameProjection) {
    if (!onrequestactions) return;
    event.preventDefault();
    const pointerType = (event as MouseEvent & { pointerType?: string }).pointerType;
    if (pointerType ? pointerType === 'touch' : event.timeStamp - lastTouchPointerAt < 2_000) return;
    const anchor = event.currentTarget as HTMLElement;
    if (secondaryDuplicate && performance.now() > secondaryDuplicate.until) secondaryDuplicate = undefined;
    if (secondaryDuplicate?.anchor === anchor && secondaryDuplicate.frameId === frame.instanceId) {
      secondaryDuplicate = undefined;
      return;
    }
    if (secondaryPointer?.anchor === anchor && secondaryPointer.frame.instanceId === frame.instanceId) return;
    requestActions(frame, anchor, 'pointer', { x: event.clientX, y: event.clientY });
  }

  function handleSecondaryPointerDown(event: PointerEvent, frame: WidgetFrameProjection) {
    if (!onrequestactions) return;
    if (event.pointerType === 'touch') {
      lastTouchPointerAt = event.timeStamp;
      return;
    }
    if (event.button !== 2) return;
    event.preventDefault();
    const anchor = event.currentTarget as HTMLElement;
    clearSecondaryPointer();
    secondaryPointer = { pointerId: event.pointerId, frame, anchor, releaseQueued: false };
    window.addEventListener('pointerup', finishSecondaryPointer);
    window.addEventListener('pointercancel', cancelSecondaryPointer);
    window.addEventListener('blur', cancelSecondaryOnBlur);
  }

  onDestroy(() => {
    clearSecondaryPointer();
    secondaryDuplicate = undefined;
  });

  function handleKey(event: KeyboardEvent, frame: WidgetFrameProjection) {
    if (!onrequestactions || !(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) return;
    event.preventDefault();
    requestActions(frame, event.currentTarget as HTMLElement, 'keyboard');
  }
</script>
<section class="widget-group" role="group" aria-label="Widget group" data-widget-group data-pomegranate-row-height={rowHeight}
  data-pom-part="group.surface" style={rowHeight === undefined ? undefined : `height:${rowHeight}px;min-height:${rowHeight}px`}>
  <div class="widget-group-header" data-widget-group-header data-pom-part="widget.header">
    <div class="widget-group-tabs" data-pom-control-group="joined" role="tablist" aria-label="Grouped Widgets">
      {#each ordered as frame, index (frame.instanceId)}
        {@const title = titleFor?.(frame) ?? frame.title}
        <button type="button" data-pom-part="button.surface" data-pom-control-segment={ordered.length === 1 ? 'only' : index === 0 ? 'start' : index === ordered.length - 1 ? 'end' : 'middle'} role="tab" aria-selected={frame.instanceId === active?.instanceId} aria-keyshortcuts="Shift+F10" tabindex={frame.instanceId === active?.instanceId ? 0 : -1} onclick={() => store.dispatch({ type: 'widget.group.activate', instanceId: frame.instanceId })} onpointerdown={(event) => handleSecondaryPointerDown(event, frame)} onpointerup={(event) => { finishSecondaryPointer(event); }} onpointercancel={cancelSecondaryPointer} oncontextmenu={(event) => handleContextMenu(event, frame)} onkeydown={(event) => handleKey(event, frame)}>{title}</button>
      {/each}
    </div>
    {#if active && onrequestactions}
      <button class="widget-actions-trigger" type="button" data-pom-part="button.icon" aria-label="Widget actions" aria-haspopup="menu" onclick={(event) => requestActions(active, event.currentTarget, 'touch')}>Widget actions</button>
    {/if}
  </div>
  {#if active}{@render renderWidget(active)}{/if}
</section>

<style>
  .widget-group-header { display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; }
  .widget-group-tabs { display: flex; min-width: 0; overflow-x: auto; }
  .widget-actions-trigger { display: none; }

  @media (pointer: coarse) {
    .widget-group-header { grid-template-columns: minmax(0, 1fr) 44px; min-height: 44px; }
    .widget-actions-trigger {
      display: block;
      box-sizing: border-box;
      width: 44px;
      min-width: 44px;
      height: 44px;
      min-height: 44px;
    }
  }
</style>
