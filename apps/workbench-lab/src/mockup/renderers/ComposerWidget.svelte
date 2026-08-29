<script lang="ts">
  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../host-context.js';
  let { hostContext }: WidgetRendererProps<LabHostContext> = $props();
  let draft = $state('Ask Mara what the bell means.');
</script>

<div class="widget-content composer" data-conformance-region="composer">
  <label class="visually-hidden" for="lab-composer">Next action in {hostContext.storyTitle}</label>
  <div class="composer-field">
    <textarea id="lab-composer" data-pom-part="field.surface" bind:value={draft} placeholder="Describe what you do, say, or notice…"></textarea>
    <span>{draft.length} characters · draft retained locally · Perspective: Mara</span>
  </div>
  <button type="button" data-pom-part="button.surface">Send action</button>
</div>
