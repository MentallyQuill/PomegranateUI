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
    class?: string;
  } = $props();

  const actions = $derived(createWidgetActions(store, frame.instanceId));
  const displayTitle = $derived(title ?? frame.title);
  const Renderer = $derived(rendererRegistry.get(frame.instance.type));
  const dispatch = (command: WorkbenchCommand) => store.dispatch(command);
</script>

<article
  class={className}
  aria-label={displayTitle}
  data-pomegranate-widget={frame.instanceIdAttribute}
  data-pom-part={surfacePart ?? undefined}
  data-pomegranate-placement={frame.placement.kind}
>
  <header data-pom-part="widget.header">
    <div class="widget-frame-heading">
      <h2>{displayTitle}</h2>
      {#if meta}<span class="widget-frame-meta">{meta}</span>{/if}
    </div>
    <nav aria-label={`${displayTitle} placement`} data-pom-part="widget.actions">
      <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('left')}>Dock left</button>
      <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('main')}>Dock main</button>
      <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('right')}>Dock right</button>
      <button type="button" data-pom-part="button.icon" onclick={() => actions.float()}>Float</button>
      <button type="button" data-pom-part="button.icon" onclick={() => actions.remove()}>Remove</button>
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
