<script lang="ts" generics="THostContext">
  import { onDestroy } from 'svelte';
  import type { WorkbenchCommand } from '@pomegranate-ui/contracts';
  import {
    createWidgetActions,
    type WidgetFrameProjection,
    type WorkbenchStore
  } from '@pomegranate-ui/core';
  import type { WidgetRendererRegistry } from '@pomegranate-ui/svelte';

  let {
    frame,
    store,
    rendererRegistry,
    hostContext,
    surfacePart = 'widget.surface',
    contentPart = 'widget.content',
    title,
    meta,
    onrequestactions,
    class: className = ''
  }: {
    frame: WidgetFrameProjection;
    store: WorkbenchStore;
    rendererRegistry: WidgetRendererRegistry<THostContext>;
    hostContext: THostContext;
    surfacePart?: 'widget.surface' | 'widget.content' | 'floating.surface' | null;
    contentPart?: 'widget.content' | null;
    title?: string;
    meta?: string | undefined;
    onrequestactions?: ((request: {
      frame: WidgetFrameProjection;
      title: string;
      anchor: HTMLElement;
      source: 'pointer' | 'keyboard' | 'touch';
      point?: { x: number; y: number };
    }) => void) | undefined;
    class?: string;
  } = $props();

  const actions = $derived(createWidgetActions(store, frame.instanceId));
  const grouped = $derived(frame.placement.kind === 'docked' && Boolean(frame.placement.group));
  const displayTitle = $derived(title ?? frame.title);
  const Renderer = $derived(rendererRegistry.get(frame.instance.type));
  const dispatch = (command: WorkbenchCommand) => store.dispatch(command);
  let lastTouchPointerAt = Number.NEGATIVE_INFINITY;
  let secondaryPointer: {
    pointerId: number;
    anchor: HTMLElement;
    releaseQueued: boolean;
  } | undefined;
  let secondaryDuplicate: { anchor: HTMLElement; until: number } | undefined;

  function requestActions(anchor: HTMLElement, source: 'pointer' | 'keyboard' | 'touch', point?: { x: number; y: number }) {
    onrequestactions?.({ frame, title: displayTitle, anchor, source, ...(point ? { point } : {}) });
  }

  function actionAnchor(surface: HTMLElement) {
    if (grouped) {
      const activeTab = surface.closest<HTMLElement>('[data-widget-group]')
        ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (activeTab) return activeTab;
    }
    return surface.querySelector<HTMLElement>(':scope > [data-pom-part="widget.header"]') ?? surface;
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
    secondaryDuplicate = { anchor: current.anchor, until: performance.now() + 1_000 };
    queueMicrotask(() => {
      if (secondaryPointer !== current) return;
      clearSecondaryPointer(current);
      requestActions(current.anchor, 'pointer', point);
    });
    return true;
  }

  function cancelSecondaryPointer(event: PointerEvent) {
    if (secondaryPointer?.pointerId === event.pointerId) clearSecondaryPointer();
  }

  function handleContextMenu(event: MouseEvent) {
    if (!onrequestactions) return;
    event.preventDefault();
    const pointerType = (event as MouseEvent & { pointerType?: string }).pointerType;
    if (pointerType ? pointerType === 'touch' : event.timeStamp - lastTouchPointerAt < 2_000) return;
    const anchor = actionAnchor(event.currentTarget as HTMLElement);
    if (secondaryDuplicate && performance.now() > secondaryDuplicate.until) secondaryDuplicate = undefined;
    if (secondaryDuplicate?.anchor === anchor) {
      secondaryDuplicate = undefined;
      return;
    }
    if (secondaryPointer?.anchor === anchor) return;
    requestActions(anchor, 'pointer', { x: event.clientX, y: event.clientY });
  }

  function handleSecondaryPointerDown(event: PointerEvent) {
    if (!onrequestactions) return;
    if (event.pointerType === 'touch') {
      lastTouchPointerAt = event.timeStamp;
      return;
    }
    if (event.button !== 2) return;
    event.preventDefault();
    const anchor = actionAnchor(event.currentTarget as HTMLElement);
    clearSecondaryPointer();
    secondaryPointer = { pointerId: event.pointerId, anchor, releaseQueued: false };
    window.addEventListener('pointerup', finishSecondaryPointer);
    window.addEventListener('pointercancel', cancelSecondaryPointer);
    window.addEventListener('blur', cancelSecondaryOnBlur);
  }

  onDestroy(() => {
    clearSecondaryPointer();
    secondaryDuplicate = undefined;
  });

  function handleHeaderKey(event: KeyboardEvent) {
    if (!onrequestactions || grouped || !(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) return;
    event.preventDefault();
    requestActions(event.currentTarget as HTMLElement, 'keyboard');
  }
</script>

<article
  class={className}
  aria-label={displayTitle}
  data-pomegranate-widget={frame.instanceIdAttribute}
  data-pom-part={surfacePart ?? undefined}
  data-pomegranate-placement={frame.placement.kind}
  onpointerdown={handleSecondaryPointerDown}
  onpointerup={(event) => { finishSecondaryPointer(event); }}
  onpointercancel={cancelSecondaryPointer}
  oncontextmenu={handleContextMenu}
>
  <header
    data-pom-part="widget.header"
    role="toolbar"
    aria-label={`${displayTitle} Widget header`}
    aria-keyshortcuts={onrequestactions && !grouped ? 'Shift+F10' : undefined}
    tabindex={onrequestactions && !grouped ? 0 : undefined}
    onkeydown={handleHeaderKey}
  >
    <div class="widget-frame-heading">
      <h2>{displayTitle}</h2>
      {#if meta}<span class="widget-frame-meta">{meta}</span>{/if}
    </div>
    {#if !grouped}<nav class:widget-actions-host={Boolean(onrequestactions)} aria-label={`${displayTitle} placement`} data-pom-part="widget.actions">
      {#if onrequestactions}
        <button class="widget-actions-trigger" type="button" data-pom-part="button.icon" aria-label="Widget actions" aria-haspopup="menu" onclick={(event) => requestActions(event.currentTarget, 'touch')}>Widget actions</button>
      {:else}
        <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('left')}>Dock left</button>
        <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('main')}>Dock main</button>
        <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('right')}>Dock right</button>
        <button type="button" data-pom-part="button.icon" onclick={() => actions.float()}>Float</button>
        <button type="button" data-pom-part="button.icon" onclick={() => actions.remove()}>Remove</button>
      {/if}
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

<style>
  .widget-actions-host { display: none; width: 0; min-width: 0; flex: 0 0 0; }
  .widget-actions-trigger { display: none; }

  @media (pointer: coarse) {
    .widget-actions-host { display: flex; width: 44px; min-width: 44px; flex: 0 0 44px; }
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
