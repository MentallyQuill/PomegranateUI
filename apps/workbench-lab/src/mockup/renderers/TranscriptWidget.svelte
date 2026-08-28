<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../host-context.js';
  let { hostContext }: WidgetRendererProps<LabHostContext> = $props();
</script>

<div class="widget-content transcript">
  <p class="widget-kicker">{hostContext.location} · {hostContext.timeLabel}</p>
  <p>The rain had thinned to silver threads by the time Mara reached the concourse.</p>
  <p>Across the black water, the reservoir bell answered once—too early for the ferry.</p>
  <blockquote>“That wasn’t the wind,” Ilex said.</blockquote>
</div>
