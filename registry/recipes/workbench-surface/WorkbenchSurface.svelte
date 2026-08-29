<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WorkbenchState } from '@pomegranate-ui/contracts';
  import {
    selectPanelSurface,
    type WidgetFrameProjection,
    type WorkbenchStore
  } from '@pomegranate-ui/core';

  let {
    store,
    renderWidget,
    class: className = ''
  }: {
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    class?: string;
  } = $props();

  const edges = ['left', 'main', 'right'] as const;
  let state = $state<WorkbenchState>();
  $effect(() => {
    const current = store;
    state = current.getState();
    return current.subscribe((next) => { state = next; });
  });
  const surface = $derived(state ? selectPanelSurface(state, store.registry) : null);
</script>

{#if surface}
  <div
    class={className}
    id={surface.surfaceId}
    role="tabpanel"
    aria-labelledby={surface.tabId}
    data-pomegranate-panel={surface.panelId}
    data-pom-part="panel.surface"
  >
    {#each edges as edge}
      <section data-pomegranate-dock={edge} data-pom-part="dock.surface" aria-label={`${edge} dock`}>
        {#each surface.docks[edge] as frame (frame.instanceId)}
          {@render renderWidget(frame)}
        {/each}
      </section>
    {/each}
    <div data-pomegranate-floating-layer>
      {#each surface.floating as frame (frame.instanceId)}
        {@render renderWidget(frame)}
      {/each}
    </div>
  </div>
{:else}
  <section data-pomegranate-empty-workbench data-pom-part="panel.surface" aria-label="Empty Workbench">
    <p>Create or activate a Panel to begin.</p>
  </section>
{/if}
