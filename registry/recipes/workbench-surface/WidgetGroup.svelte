<script lang="ts">
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

  function requestActions(frame: WidgetFrameProjection, anchor: HTMLElement, source: 'pointer' | 'keyboard' | 'touch', point?: { x: number; y: number }) {
    onrequestactions?.({ frame, title: titleFor?.(frame) ?? frame.title, anchor, source, ...(point ? { point } : {}) });
  }

  function handleContextMenu(event: MouseEvent, frame: WidgetFrameProjection) {
    if (!onrequestactions) return;
    event.preventDefault();
    requestActions(frame, event.currentTarget as HTMLElement, 'pointer', { x: event.clientX, y: event.clientY });
  }

  function handleKey(event: KeyboardEvent, frame: WidgetFrameProjection) {
    if (!onrequestactions || !(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) return;
    event.preventDefault();
    requestActions(frame, event.currentTarget as HTMLElement, 'keyboard');
  }
</script>
<section class="widget-group" role="group" aria-label="Widget group" data-widget-group data-pomegranate-row-height={rowHeight}
  data-pom-part="group.surface" style={rowHeight === undefined ? undefined : `height:${rowHeight}px;min-height:${rowHeight}px`}>
  <div class="widget-group-header" data-widget-group-header data-pom-part="widget.header">
    <div class="widget-group-tabs" role="tablist" aria-label="Grouped Widgets">
      {#each ordered as frame (frame.instanceId)}
        {@const title = titleFor?.(frame) ?? frame.title}
        <button type="button" data-pom-part="button.surface" role="tab" aria-selected={frame.instanceId === active?.instanceId} aria-keyshortcuts="Shift+F10" tabindex={frame.instanceId === active?.instanceId ? 0 : -1} onclick={() => store.dispatch({ type: 'widget.group.activate', instanceId: frame.instanceId })} oncontextmenu={(event) => handleContextMenu(event, frame)} onkeydown={(event) => handleKey(event, frame)}>{title}</button>
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
