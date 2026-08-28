<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../host-context.js';
  let { hostContext }: WidgetRendererProps<LabHostContext> = $props();
</script>

<div class="widget-content promise-list">
  <p class="widget-kicker">Recognized in {hostContext.storyTitle}</p>
  <div><i></i><span><strong>Find the missing ferry log</strong><small>Open · evidence at the lower relay</small></span></div>
  <div><i></i><span><strong>Return before the second bell</strong><small>At risk · locally inferred</small></span></div>
</div>
