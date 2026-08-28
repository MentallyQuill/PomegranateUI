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
    class: className = ''
  }: {
    frame: WidgetFrameProjection;
    store: WorkbenchStore;
    rendererRegistry: WidgetRendererRegistry<THostContext>;
    hostContext: THostContext;
    class?: string;
  } = $props();

  const actions = $derived(createWidgetActions(store, frame.instanceId));
  const Renderer = $derived(rendererRegistry.get(frame.instance.type));
  const dispatch = (command: WorkbenchCommand) => store.dispatch(command);
</script>

<article
  class={className}
  aria-label={frame.title}
  data-pomegranate-widget={frame.instanceIdAttribute}
  data-pomegranate-placement={frame.placement.kind}
>
  <header>
    <h2>{frame.title}</h2>
    <nav aria-label={`${frame.title} placement`}>
      <button type="button" onclick={() => actions.dock('left')}>Dock left</button>
      <button type="button" onclick={() => actions.dock('main')}>Dock main</button>
      <button type="button" onclick={() => actions.dock('right')}>Dock right</button>
      <button type="button" onclick={() => actions.float()}>Float</button>
      <button type="button" onclick={() => actions.remove()}>Remove</button>
    </nav>
  </header>
  {#if Renderer}
    <svelte:boundary>
      <Renderer
        instance={frame.instance}
        {hostContext}
        capabilities={frame.manifest?.capabilities ?? []}
        {dispatch}
      />
      {#snippet failed()}
        <p role="alert" aria-label={`${frame.title} renderer failed`}>
          {frame.title} failed to render.
        </p>
      {/snippet}
    </svelte:boundary>
  {:else}
    <p role="status" aria-label={`${frame.title} renderer unavailable`}>
      Renderer unavailable for {frame.title}.
    </p>
  {/if}
</article>
