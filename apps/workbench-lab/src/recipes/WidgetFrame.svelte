<script lang="ts" generics="THostContext">
  import { onDestroy } from 'svelte';
  import type { WorkbenchCommand } from '@pomegranate-ui/contracts';
  import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';
  import type { WidgetRendererRegistry } from '@pomegranate-ui/svelte';
  import { createWidgetDragController } from './WidgetDragController.js';
  import { getWidgetActionMenuContext, type WidgetActionRequestSource } from './WidgetActionMenuController.js';

  let {
    frame,
    store,
    rendererRegistry,
    hostContext,
    onexpanddock,
    surfacePart = 'widget.surface',
    contentPart = 'widget.content',
    title,
    meta,
    class: className = ''
  }: {
    frame: WidgetFrameProjection;
    store: WorkbenchStore;
    rendererRegistry: WidgetRendererRegistry<THostContext>;
    hostContext: THostContext;
    onexpanddock?: ((edge: 'left' | 'right') => void) | undefined;
    surfacePart?: 'widget.surface' | 'widget.content' | 'floating.surface' | null;
    contentPart?: 'widget.content' | null;
    title?: string;
    meta?: string | undefined;
    class?: string;
  } = $props();

  const displayTitle = $derived(title ?? frame.title);
  const grouped = $derived(frame.placement.kind === 'docked' && Boolean(frame.placement.group));
  const Renderer = $derived(rendererRegistry.get(frame.instance.type));
  const dispatch = (command: WorkbenchCommand) => store.dispatch(command);
  let dragging = $state(false);
  let actionsOpen = $state(false);
  const requestWidgetActions = getWidgetActionMenuContext();
  const drag = createWidgetDragController({
    getFrame: () => frame,
    getStore: () => store,
    setDragging: (next) => { dragging = next; },
    onExpandDock: (edge) => onexpanddock?.(edge)
  });
  onDestroy(drag.destroy);

  const isInteractiveTarget = (target: EventTarget | null) => (
    target instanceof Element
    && Boolean(target.closest('button, a, input, textarea, select, summary, [role="menu"]'))
  );
  const dragSurfacePointerDown = (event: PointerEvent) => {
    if (event.button === 2) {
      if (!grouped && event.pointerType !== 'touch') {
        event.preventDefault();
        openActions(event.currentTarget as HTMLElement, 'pointer', { x: event.clientX, y: event.clientY });
      }
      return;
    }
    if (event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;
    drag.pointerDown(event);
  };
  const openActions = (anchor: HTMLElement, source: WidgetActionRequestSource, point?: { x: number; y: number }) => {
    requestWidgetActions?.({
      frame,
      title: displayTitle,
      anchor,
      source,
      ...(point ? { point } : {}),
      onopenchange: (open) => { actionsOpen = open; }
    });
  };
  const handleContextMenu = (event: MouseEvent) => {
    if (grouped) return;
    event.preventDefault();
    if (
      ('pointerType' in event && event.pointerType === 'touch')
      || (typeof window.matchMedia === 'function'
        && window.matchMedia('(pointer: coarse)').matches
        && !window.matchMedia('(any-pointer: fine)').matches)
    ) return;
    openActions(event.currentTarget as HTMLElement, 'pointer', { x: event.clientX, y: event.clientY });
  };
  const handleHeaderKey = (event: KeyboardEvent) => {
    if (grouped) return;
    if (!(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) return;
    event.preventDefault();
    openActions(event.currentTarget as HTMLElement, 'keyboard');
  };
</script>

<article
  class={className}
  aria-label={displayTitle}
  data-pomegranate-widget={frame.instanceIdAttribute}
  data-pom-part={surfacePart ?? undefined}
  data-pomegranate-placement={frame.placement.kind}
  data-pomegranate-edge={frame.placement.kind === 'docked' ? frame.placement.regionId === 'stage' ? 'main' : frame.placement.regionId : 'floating'}
  data-pomegranate-region={frame.placement.kind === 'docked' ? frame.placement.regionId : undefined}
>
  <header
    role="toolbar"
    aria-label={`${displayTitle} draggable Widget header`}
    class:is-dragging={dragging}
    data-pom-part="widget.header"
    data-focus-widget-for={grouped ? undefined : frame.instanceId}
    data-widget-drag-surface
    tabindex={grouped ? undefined : 0}
    aria-keyshortcuts={grouped ? undefined : 'Shift+F10'}
    oncontextmenu={handleContextMenu}
    onkeydown={handleHeaderKey}
    onpointerdown={dragSurfacePointerDown}
    onpointermove={drag.pointerMove}
    onpointerup={drag.pointerUp}
    onpointercancel={drag.pointerCancel}
  >
    <div class="widget-frame-heading" data-widget-touch-drag-grip>
      <h2>{displayTitle}</h2>
      {#if meta}<span class="widget-frame-meta">{meta}</span>{/if}
    </div>
    {#if !grouped}<nav aria-label={`${displayTitle} actions`} data-pom-part="widget.actions">
      <button
        class="action-menu widget-actions-trigger"
        data-pom-part="button.icon"
        type="button"
        aria-label="Widget actions"
        aria-haspopup="menu"
        aria-expanded={actionsOpen}
        onclick={(event) => openActions(event.currentTarget, 'touch')}
      >Widget actions</button>
    </nav>{/if}
  </header>
  <div data-pom-part={contentPart ?? undefined}>
    {#if Renderer}
      <svelte:boundary>
      <Renderer
        instance={frame.instance}
        {hostContext}
        capabilities={frame.manifest?.capabilities ?? []}
        {dispatch}
      />
      {#snippet failed()}
        <p role="alert" data-pom-part="row.surface" aria-label={`${displayTitle} renderer failed`}>
          {displayTitle} failed to render.
        </p>
      {/snippet}
      </svelte:boundary>
    {:else}
      <p role="status" data-pom-part="row.surface" aria-label={`${displayTitle} renderer unavailable`}>
        Renderer unavailable for {displayTitle}.
      </p>
    {/if}
  </div>
</article>
