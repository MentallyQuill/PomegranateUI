<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { WorkbenchState } from '@pomegranate-ui/contracts';
  import { selectPanelSurface, type WidgetFrameProjection, type WorkbenchStore } from '@pomegranate-ui/core';
  import PanelTemplateSurface from './PanelTemplateSurface.svelte';
  import UnavailableTemplate from './UnavailableTemplate.svelte';
  let { store, renderWidget, titleFor, onrequestactions, class: className = '' }: {
    store: WorkbenchStore;
    renderWidget: Snippet<[WidgetFrameProjection]>;
    titleFor?: ((frame: WidgetFrameProjection) => string) | undefined;
    onrequestactions?: ((request: { frame: WidgetFrameProjection; title: string; anchor: HTMLElement; source: 'pointer' | 'keyboard' | 'touch'; point?: { x: number; y: number } }) => void) | undefined;
    class?: string;
  } = $props();
  let state = $state<WorkbenchState>();
  $effect(() => {
    state = store.getState();
    return store.subscribe((next) => { state = next; });
  });
  const surface = $derived(state ? selectPanelSurface(state, store.registry, store.templates) : null);
</script>
{#if surface}
  <div class={className} id={surface.surfaceId} role="tabpanel" aria-labelledby={surface.tabId} data-pomegranate-panel={surface.panelId} data-pom-part="panel.surface">
    {#if surface.unavailableTemplateId}
      <UnavailableTemplate templateId={surface.unavailableTemplateId} />
    {:else}
      <PanelTemplateSurface {surface} {store} {renderWidget} {titleFor} {onrequestactions} />
    {/if}
    <div data-pomegranate-floating-layer>
      {#each surface.floating as frame (frame.instanceId)}{@render renderWidget(frame)}{/each}
    </div>
  </div>
{:else}
  <section data-pomegranate-empty-workbench data-pom-part="panel.surface" aria-label="Empty Workbench"><p>Create or activate a Panel to begin.</p></section>
{/if}
