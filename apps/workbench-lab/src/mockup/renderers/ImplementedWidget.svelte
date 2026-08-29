<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import WidgetAnatomy from '../../recipes/WidgetAnatomy.svelte';
  import WidgetStateSurface from '../../recipes/WidgetStateSurface.svelte';
  import type { LabHostContext } from '../host-context.js';
  import { getSurfaceFixture, resolveSurfaceState } from '../surface-fixtures.js';

  let { instance, hostContext }: WidgetRendererProps<LabHostContext> = $props();
  const fixture = $derived(getSurfaceFixture(instance.type));
  const state = $derived(fixture ? resolveSurfaceState(hostContext.surfaceState, fixture) : 'ready');

  function rendererReady() {
    if (instance.configuration.fixtureMode === 'failure') throw new Error('Intentional Lab renderer fixture failure.');
    if (!fixture) throw new Error(`Implemented surface fixture missing for ${instance.type}.`);
    return true;
  }
</script>

{#if rendererReady() && fixture}
  <section
    class="implemented-widget"
    data-surface-type={fixture.type}
    data-surface-state={state}
    data-surface-scope={fixture.scope}
    data-surface-boundary={fixture.boundary}
    data-surface-row-labels={JSON.stringify(fixture.rows.map(([label]) => label))}
    data-surface-actions={JSON.stringify(fixture.actions)}
    data-surface-owner="lab-fixture"
  >
    <WidgetStateSurface {state} />
    <WidgetAnatomy {fixture} {state} {hostContext} />
  </section>
{/if}
