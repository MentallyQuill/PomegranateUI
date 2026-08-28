<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../host-context.js';
  let { hostContext }: WidgetRendererProps<LabHostContext> = $props();
  const characters = [
    { mark: 'MV', name: 'Mara Venn', note: 'At the ferry gate' },
    { mark: 'IL', name: 'Ilex', note: 'Listening from the lower relay' },
    { mark: 'OA', name: 'Old Ansel', note: 'Dormant · off screen' }
  ];
</script>

<div class="widget-content character-list">
  <p class="widget-kicker">{hostContext.frameLabel}</p>
  {#each characters as character}
    <div class="character-row"><span>{character.mark}</span><strong>{character.name}</strong><small>{character.note}</small></div>
  {/each}
</div>
