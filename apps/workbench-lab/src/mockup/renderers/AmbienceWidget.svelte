<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../host-context.js';
  let { hostContext }: WidgetRendererProps<LabHostContext> = $props();
  let playing = $state(true);
</script>

<div class="widget-content ambience">
  <button type="button" aria-pressed={playing} onclick={() => { playing = !playing; }}>{playing ? 'Pause' : 'Play'}</button>
  <span class="sound-wave" aria-hidden="true">▂▄▆▃▅▇▄</span>
  <p>Reservoir rain · distant machinery</p>
  <small>{hostContext.location}</small>
</div>
