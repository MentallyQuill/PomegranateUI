<script lang="ts" generics="THostContext">
  import { onDestroy } from 'svelte';
  import type { WorkbenchCommand } from '@pomegranate-ui/contracts';
  import {
    createWidgetActions,
    type WidgetFrameProjection,
    type WorkbenchStore
  } from '@pomegranate-ui/core';
  import type { WidgetRendererRegistry } from '@pomegranate-ui/svelte';
  import { createWidgetDragController } from './WidgetDragController.js';

  let {
    frame,
    store,
    rendererRegistry,
    hostContext,
    onfocuswidget,
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
    onfocuswidget?: (frame: WidgetFrameProjection) => void;
    surfacePart?: 'widget.surface' | 'widget.content' | 'floating.surface' | null;
    contentPart?: 'widget.content' | null;
    title?: string;
    meta?: string | undefined;
    class?: string;
  } = $props();

  const actions = $derived(createWidgetActions(store, frame.instanceId));
  const displayTitle = $derived(title ?? frame.title);
  const Renderer = $derived(rendererRegistry.get(frame.instance.type));
  const dispatch = (command: WorkbenchCommand) => store.dispatch(command);
  let dragging = $state(false);
  let actionsOpen = $state(false);
  const drag = createWidgetDragController({
    getFrame: () => frame,
    getStore: () => store,
    setDragging: (next) => { dragging = next; }
  });
  onDestroy(drag.destroy);

  const isInteractiveTarget = (target: EventTarget | null) => (
    target instanceof Element
    && Boolean(target.closest('button, a, input, textarea, select, summary, [role="menu"]'))
  );
  const dragSurfacePointerDown = (event: PointerEvent) => {
    if (isInteractiveTarget(event.target)) return;
    actionsOpen = false;
    drag.pointerDown(event);
  };
  const runAction = (action: () => void) => {
    actionsOpen = false;
    action();
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
    role="group"
    aria-label={`${displayTitle} draggable Widget header`}
    class:is-dragging={dragging}
    data-pom-part="widget.header"
    data-widget-drag-surface
    onpointerdown={dragSurfacePointerDown}
    onpointermove={drag.pointerMove}
    onpointerup={drag.pointerUp}
    onpointercancel={drag.pointerCancel}
  >
    <div class="widget-frame-heading" data-widget-touch-drag-grip>
      <h2>{displayTitle}</h2>
      {#if meta}<span class="widget-frame-meta">{meta}</span>{/if}
    </div>
    <nav aria-label={`${displayTitle} actions`} data-pom-part="widget.actions">
      <button
        class="action-menu"
        data-pom-part="button.icon"
        type="button"
        aria-label="Widget actions"
        aria-haspopup="menu"
        aria-expanded={actionsOpen}
        data-focus-widget-for={frame.instanceId}
        onclick={() => { actionsOpen = !actionsOpen; }}
      >Widget actions</button>
      {#if actionsOpen}
        <div class="widget-actions-menu" role="menu">
          <button class="action-dock-left" role="menuitem" data-pom-part="button.icon" type="button" onclick={() => runAction(() => actions.dock('left'))}>Dock left</button>
          <button class="action-dock-main" role="menuitem" data-pom-part="button.icon" type="button" onclick={() => runAction(() => actions.dock('main'))}>Dock main</button>
          <button class="action-dock-right" role="menuitem" data-pom-part="button.icon" type="button" onclick={() => runAction(() => actions.dock('right'))}>Dock right</button>
          <button class="action-float" role="menuitem" data-pom-part="button.icon" type="button" onclick={() => runAction(() => actions.float())}>Float</button>
          <button class="action-group" role="menuitem" data-pom-part="button.icon" type="button" onclick={() => runAction(() => actions.groupWithPrevious())}>Group with previous Widget</button>
          {#if onfocuswidget}
            <button
              class="action-focus"
              role="menuitem"
              data-pom-part="button.icon"
              type="button"
              onclick={() => runAction(() => onfocuswidget?.(frame))}
            >Focus Widget</button>
          {/if}
          <button class="action-remove" role="menuitem" data-pom-part="button.icon" type="button" onclick={() => runAction(() => actions.shelve())}>Move to Widget Shelf</button>
        </div>
      {/if}
    </nav>
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
