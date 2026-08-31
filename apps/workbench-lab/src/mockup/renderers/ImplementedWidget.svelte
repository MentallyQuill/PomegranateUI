<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import ThemeSettings from '../../recipes/ThemeSettings.svelte';
  import WidgetAnatomy from '../../recipes/WidgetAnatomy.svelte';
  import WidgetStateSurface from '../../recipes/WidgetStateSurface.svelte';
  import { createEyeDropperAdapter } from '../../themes/eyedropper.js';
  import type { LabHostContext } from '../host-context.js';
  import { getSurfaceFixture, resolveSurfaceState } from '../surface-fixtures.js';
  import AIConnectionsWidget from './AIConnectionsWidget.svelte';
  import CompactThemeWidget from './CompactThemeWidget.svelte';
  import ComposerWidget from './ComposerWidget.svelte';
  import PersonasWidget from './PersonasWidget.svelte';
  import PromiseLedgerWidget from './PromiseLedgerWidget.svelte';
  import RecordingCharactersWidget from './RecordingCharactersWidget.svelte';
  import RoomAmbienceWidget from './RoomAmbienceWidget.svelte';
  import SceneEffectsWidget from './SceneEffectsWidget.svelte';
  import TranscriptWidget from './TranscriptWidget.svelte';
  import WorldStateWidget from './WorldStateWidget.svelte';

  let { instance, hostContext }: WidgetRendererProps<LabHostContext> = $props();
  const fixture = $derived(getSurfaceFixture(instance.type));
  const state = $derived(fixture ? resolveSurfaceState(hostContext.surfaceState, fixture) : 'ready');
  const contentVisible = $derived(!['empty', 'unavailable', 'access-denied'].includes(state));
  const eyedropper = createEyeDropperAdapter();

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
    data-surface-owner="lab-fixture"
  >
    <WidgetStateSurface {state} />
    {#if instance.type === 'settings.custom-theme' && instance.configuration.presentation === 'compact' && contentVisible}
      <CompactThemeWidget theme={hostContext.theme} />
    {:else if instance.type === 'settings.custom-theme' && !['empty', 'unavailable', 'access-denied'].includes(state)}
      <ThemeSettings theme={hostContext.theme} {eyedropper} contract={fixture} />
    {:else if instance.type === 'story.composer' && instance.configuration.surfacePreview !== true && contentVisible}
      <ComposerWidget {hostContext} />
    {:else if instance.type === 'story.transcript' && instance.configuration.surfacePreview !== true && contentVisible}
      <TranscriptWidget {hostContext} />
    {:else if instance.type === 'story.characters' && instance.configuration.presentation === 'recording' && contentVisible}
      <RecordingCharactersWidget
        portraitAtlas={hostContext.visualMedia.characterPortraitAtlas}
        portraits={hostContext.visualMedia.characterPortraits}
      />
    {:else if instance.type === 'story.room-ambience' && instance.configuration.presentation === 'recording' && contentVisible}
      <SceneEffectsWidget />
    {:else if instance.type === 'systems.world-state' && instance.configuration.presentation === 'atmospheric' && contentVisible}
      <WorldStateWidget />
    {:else if instance.type === 'story.room-ambience' && instance.configuration.presentation === 'atmospheric' && contentVisible}
      <RoomAmbienceWidget />
    {:else if instance.type === 'systems.promise-ledger' && instance.configuration.presentation === 'atmospheric' && contentVisible}
      <PromiseLedgerWidget />
    {:else if instance.type === 'story.personas' && instance.configuration.presentation === 'recording' && contentVisible}
      <PersonasWidget />
    {:else if instance.type === 'settings.connections' && instance.configuration.presentation === 'recording' && contentVisible}
      <AIConnectionsWidget />
    {:else}
      <WidgetAnatomy {fixture} {state} {hostContext} />
    {/if}
  </section>
{/if}
