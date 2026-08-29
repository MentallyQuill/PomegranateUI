<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../host-context.js';
  let { hostContext }: WidgetRendererProps<LabHostContext> = $props();
</script>

<div class="widget-content fact-grid">
  <span data-pom-part="row.surface">Location<strong>{hostContext.location}</strong></span>
  <span data-pom-part="row.surface">Weather<strong>Rain easing</strong></span>
  <span data-pom-part="row.surface">Light<strong>Blue relay glow</strong></span>
  <span data-pom-part="row.surface">Frame<strong>Present · 42</strong></span>
</div>
