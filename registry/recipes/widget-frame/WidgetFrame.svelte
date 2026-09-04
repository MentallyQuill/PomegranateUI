<script lang="ts" generics="THostContext">
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
  const displayTitle = $derived(title ?? frame.title);
  const Renderer = $derived(rendererRegistry.get(frame.instance.type));
  const dispatch = (command: WorkbenchCommand) => store.dispatch(command);

  function requestActions(anchor: HTMLElement, source: 'pointer' | 'keyboard' | 'touch', point?: { x: number; y: number }) {
    onrequestactions?.({ frame, title: displayTitle, anchor, source, ...(point ? { point } : {}) });
  }

  function handleContextMenu(event: MouseEvent) {
    if (!onrequestactions) return;
    event.preventDefault();
    requestActions(event.currentTarget as HTMLElement, 'pointer', { x: event.clientX, y: event.clientY });
  }

  function handleHeaderKey(event: KeyboardEvent) {
    if (!onrequestactions || !(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) return;
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
>
  <header
    data-pom-part="widget.header"
    role="toolbar"
    aria-label={`${displayTitle} Widget header`}
    aria-keyshortcuts="Shift+F10"
    tabindex={onrequestactions ? 0 : undefined}
    oncontextmenu={handleContextMenu}
    onkeydown={handleHeaderKey}
  >
    <div class="widget-frame-heading">
      <h2>{displayTitle}</h2>
      {#if meta}<span class="widget-frame-meta">{meta}</span>{/if}
    </div>
    <nav aria-label={`${displayTitle} placement`} data-pom-part="widget.actions">
      {#if onrequestactions}
        <button class="widget-actions-trigger" type="button" data-pom-part="button.icon" aria-label="Widget actions" aria-haspopup="menu" onclick={(event) => requestActions(event.currentTarget, 'touch')}>Widget actions</button>
      {:else}
        <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('left')}>Dock left</button>
        <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('main')}>Dock main</button>
        <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('right')}>Dock right</button>
        <button type="button" data-pom-part="button.icon" onclick={() => actions.float()}>Float</button>
        <button type="button" data-pom-part="button.icon" onclick={() => actions.remove()}>Remove</button>
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
