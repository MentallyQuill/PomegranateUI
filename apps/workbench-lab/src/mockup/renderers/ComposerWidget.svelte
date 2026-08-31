<script lang="ts">
  import type { LabHostContext } from '../host-context.js';
  let { hostContext }: { hostContext: LabHostContext } = $props();
  let draft = $state('');
</script>

<div class="widget-content composer" data-conformance-region="composer">
  <label class="visually-hidden" for="lab-composer">Next action in {hostContext.storyTitle}</label>
  <div class="composer-field">
    <span class="composer-placeholder" aria-hidden="true">Describe what you do, say, or notice…</span>
    <textarea id="lab-composer" data-pom-part="field.surface" bind:value={draft} placeholder="Describe what you do, say, or notice…"></textarea>
    <span class="composer-meta"><span>Enter to send</span><span>Shift + Enter for line break</span><span>Perspective: Aven</span></span>
  </div>
  <button type="button" data-pom-part="button.surface">Continue</button>
</div>
