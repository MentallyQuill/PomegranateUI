<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../host-context.js';
  let { hostContext }: WidgetRendererProps<LabHostContext> = $props();
</script>

<div class="widget-content fact-grid">
  <span>Location<strong>{hostContext.location}</strong></span>
  <span>Weather<strong>Rain easing</strong></span>
  <span>Light<strong>Blue relay glow</strong></span>
  <span>Frame<strong>Present · 42</strong></span>
</div>
