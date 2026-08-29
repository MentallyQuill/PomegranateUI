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
  data-pom-part="widget.surface"
  data-pomegranate-placement={frame.placement.kind}
>
  <header data-pom-part="widget.header">
    <h2>{frame.title}</h2>
    <nav aria-label={`${frame.title} placement`} data-pom-part="widget.actions">
      <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('left')}>Dock left</button>
      <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('main')}>Dock main</button>
      <button type="button" data-pom-part="button.icon" onclick={() => actions.dock('right')}>Dock right</button>
      <button type="button" data-pom-part="button.icon" onclick={() => actions.float()}>Float</button>
      <button type="button" data-pom-part="button.icon" onclick={() => actions.remove()}>Remove</button>
    </nav>
  </header>
  <div data-pom-part="widget.content">
    {#if Renderer}
      <svelte:boundary>
      <Renderer
        instance={frame.instance}
        {hostContext}
        capabilities={frame.manifest?.capabilities ?? []}
        {dispatch}
      />
      {#snippet failed()}
        <p role="alert" data-pom-part="row.surface" aria-label={`${frame.title} renderer failed`}>
          {frame.title} failed to render.
        </p>
      {/snippet}
      </svelte:boundary>
    {:else}
      <p role="status" data-pom-part="row.surface" aria-label={`${frame.title} renderer unavailable`}>
        Renderer unavailable for {frame.title}.
      </p>
    {/if}
  </div>
</article>
