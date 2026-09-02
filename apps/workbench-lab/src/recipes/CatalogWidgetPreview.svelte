<script lang="ts" generics="THostContext">
  import { onMount, tick } from 'svelte';
  import {
    asWidgetInstanceId,
    type JsonObject,
    type WidgetManifest
  } from '@pomegranate-ui/contracts';
  import type {
    WidgetRendererProps,
    WidgetRendererRegistry
  } from '@pomegranate-ui/svelte';

  let {
    manifest,
    rendererRegistry,
    hostContext,
    configuration = {}
  }: {
    manifest: WidgetManifest;
    rendererRegistry: WidgetRendererRegistry<THostContext>;
    hostContext: THostContext;
    configuration?: JsonObject;
  } = $props();

  let previewHost: HTMLElement;
  const Renderer = $derived(rendererRegistry.get(manifest.type));
  const instance = $derived({
    id: asWidgetInstanceId(`catalog-preview-${manifest.type.replace(/[^a-z0-9]+/gi, '-')}`),
    type: manifest.type,
    manifestVersion: manifest.version,
    configuration: {
      ...manifest.defaultConfiguration,
      ...configuration,
      surfacePreview: true,
      fixtureMode: 'ready',
      presentation: 'compact'
    }
  });
  const dispatch: WidgetRendererProps<THostContext>['dispatch'] = () => {
    throw new Error('Catalog previews cannot dispatch Workbench commands.');
  };

  onMount(() => {
    let observer: MutationObserver | undefined;
    const removeGeneratedIds = () => {
      for (const element of previewHost.querySelectorAll<HTMLElement>('[id]')) element.removeAttribute('id');
    };
    void tick().then(() => {
      removeGeneratedIds();
      if (typeof MutationObserver === 'undefined') return;
      observer = new MutationObserver(removeGeneratedIds);
      observer.observe(previewHost, { subtree: true, childList: true, attributes: true, attributeFilter: ['id'] });
    });
    return () => observer?.disconnect();
  });
</script>

<div
  bind:this={previewHost}
  class="catalog-widget-preview"
  data-catalog-preview
  data-preview-widget={manifest.type}
  data-pom-part="widget.content"
  inert
  aria-hidden="true"
>
  {#if Renderer}
    <svelte:boundary>
      <Renderer
        {instance}
        {hostContext}
        capabilities={manifest.capabilities}
        {dispatch}
      />
      {#snippet failed()}
        <!-- Preview failures remain silent and inert; completeness is enforced by renderer tests. -->
      {/snippet}
    </svelte:boundary>
  {/if}
</div>
