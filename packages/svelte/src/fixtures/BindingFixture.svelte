<script lang="ts">
  import type { CatalogController, WorkbenchStore } from '@pomegranate-ui/core';
  import type { WidgetRendererRegistry } from '../renderer-registry.js';
  import {
    getWorkbenchContext,
    setWorkbenchContext,
    type WorkbenchContextValue
  } from '../context.js';

  interface HostContext {
    readonly storyId: string;
  }

  export let store: WorkbenchStore | undefined = undefined;
  export let rendererRegistry: WidgetRendererRegistry<HostContext> | undefined = undefined;
  export let hostContext: HostContext | undefined = undefined;
  export let catalog: CatalogController | undefined = undefined;
  export let configured = true;

  const outcome: {
    readonly binding?: WorkbenchContextValue<HostContext>;
    readonly error: string;
  } = (() => {
    try {
      if (configured && store && rendererRegistry && hostContext) {
        const required = { store, rendererRegistry, hostContext };
        setWorkbenchContext(catalog ? { ...required, catalog } : required);
      }
      return { binding: getWorkbenchContext<HostContext>(), error: '' };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : String(cause) };
    }
  })();
</script>

{#if outcome.binding}
  <output aria-label="Host story">{outcome.binding.hostContext.storyId}</output>
  <output aria-label="Workbench revision">{outcome.binding.store.getState().revision}</output>
  <output aria-label="Catalog mode">{outcome.binding.catalog?.getState().presentation ?? 'none'}</output>
{:else}
  <p role="alert">{outcome.error}</p>
{/if}
