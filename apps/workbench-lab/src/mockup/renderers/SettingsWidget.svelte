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
  {#if instance.type === 'settings.custom-theme'}
    <div class="widget-content settings-sample theme-picker">
      <p class="widget-kicker">Same Workbench · three complete targets</p>
      {#each hostContext.theme.presets as preset (preset.id)}
        <button
          type="button"
          aria-label={preset.label}
          aria-pressed={hostContext.theme.activeId === preset.id}
          onclick={() => hostContext.theme.activate(preset.id)}
        >
          <strong>{preset.label}</strong>
          <small>{preset.description}</small>
        </button>
      {/each}
    </div>
  {:else if instance.type === 'settings.theme'}
    <div class="widget-content settings-sample theme-inspector">
      <p class="widget-kicker">Resolved semantic bindings · read only</p>
      <dl>
        <div><dt>Target</dt><dd>{hostContext.theme.activeId}</dd></div>
        <div><dt>Density</dt><dd>{hostContext.theme.inspector.density}</dd></div>
        <div><dt>Geometry</dt><dd>{hostContext.theme.inspector.geometry}</dd></div>
        <div><dt>Typography</dt><dd>{hostContext.theme.inspector.typography.join(' · ')}</dd></div>
        <div><dt>Icons</dt><dd>{hostContext.theme.inspector.iconPackId}</dd></div>
      </dl>
      <p>Pom owns validated semantic values. Adopters keep their markup, composition, assets, and product identity.</p>
    </div>
  {:else}
    <div class="widget-content settings-sample">
      <p class="widget-kicker">Device-local mockup · {hostContext.systemStatus}</p>
      <button type="button">Comfortable reading</button>
      <button type="button">Compact chrome</button>
      <button type="button">High contrast</button>
    </div>
  {/if}
{/if}
