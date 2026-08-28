<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../host-context.js';
  let { instance, hostContext }: WidgetRendererProps<LabHostContext> = $props();
  function rendererReady() {
    if (instance.configuration.fixtureMode === 'failure') {
      throw new Error('Intentional Lab renderer fixture failure.');
    }
    return true;
  }
</script>

{#if rendererReady()}
  <div class="widget-content settings-sample">
    <p class="widget-kicker">Device-local mockup · {hostContext.systemStatus}</p>
    <button type="button">Ink and Ember</button>
    <button type="button">Mist and Glass</button>
    <button type="button">High Contrast</button>
  </div>
{/if}
