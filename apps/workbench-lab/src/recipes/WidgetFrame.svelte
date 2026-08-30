<script lang="ts" generics="THostContext">
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
    class?: string;
  } = $props();

  const actions = $derived(createWidgetActions(store, frame.instanceId));
  const displayTitle = $derived(title ?? frame.title);
  const Renderer = $derived(rendererRegistry.get(frame.instance.type));
  const dispatch = (command: WorkbenchCommand) => store.dispatch(command);
  let dragging = $state(false);
  const drag = createWidgetDragController({
    getFrame: () => frame,
    getStore: () => store,
    setDragging: (next) => { dragging = next; }
  });
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
  <header class:is-dragging={dragging} data-pom-part="widget.header">
    <h2>{displayTitle}</h2>
    <nav aria-label={`${displayTitle} placement`} data-pom-part="widget.actions">
      <button
        class="action-drag"
        data-pom-part="button.icon"
        type="button"
        aria-label="Drag Widget"
        onpointerdown={drag.pointerDown}
        onpointermove={drag.pointerMove}
        onpointerup={drag.pointerUp}
        onpointercancel={drag.pointerCancel}
      >Drag Widget</button>
      <button class="action-dock-left" data-pom-part="button.icon" type="button" onclick={() => actions.dock('left')}>Dock left</button>
      <button class="action-dock-main" data-pom-part="button.icon" type="button" onclick={() => actions.dock('main')}>Dock main</button>
      <button class="action-dock-right" data-pom-part="button.icon" type="button" onclick={() => actions.dock('right')}>Dock right</button>
      <button class="action-float" data-pom-part="button.icon" type="button" onclick={() => actions.float()}>Float</button>
      <button class="action-group" data-pom-part="button.icon" type="button" onclick={() => actions.groupWithPrevious()}>Group with previous Widget</button>
      {#if onfocuswidget}
        <button
          class="action-focus"
          data-pom-part="button.icon"
          type="button"
          data-focus-widget-for={frame.instanceId}
          onclick={() => onfocuswidget?.(frame)}
        >Focus Widget</button>
      {/if}
      <button class="action-remove" data-pom-part="button.icon" type="button" onclick={() => actions.shelve()}>Move to Widget Shelf</button>
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
