<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../host-context.js';
  let { hostContext }: WidgetRendererProps<LabHostContext> = $props();
  let draft = $state('Ask Mara what the bell means.');
</script>

<div class="widget-content composer" data-conformance-region="composer">
  <label for="lab-composer">Next action in {hostContext.storyTitle}</label>
  <textarea id="lab-composer" bind:value={draft}></textarea>
  <div><span>{draft.length} characters · draft retained locally</span><button type="button">Send action</button></div>
</div>
