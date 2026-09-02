<script lang="ts">
  import type { ThemeAuthoringPort } from './types.js';

  let { theme }: { theme: ThemeAuthoringPort } = $props();
  let status = $state('Theme draft ready.');

  function reset() {
    const result = theme.resetDraft();
    status = result.ok ? 'Theme draft reset to the active preset.' : result.diagnostics[0]?.message ?? 'Theme draft could not be reset.';
  }

  async function save() {
    const result = await theme.saveDraft();
    status = result.ok ? 'Theme draft saved on this device.' : result.diagnostics[0]?.message ?? 'Theme draft could not be saved.';
  }
</script>

<div class="theme-authoring-element theme-authoring-overview" data-theme-authoring-element="overview">
  <p class="theme-authoring-meta">This device · one shared recoverable draft</p>
  <dl class="theme-authoring-summary">
    <div><dt>Preset</dt><dd>{theme.authoring.applied.resolved.theme.label}</dd></div>
    <div><dt>State</dt><dd>{theme.authoring.dirty ? 'Unsaved changes' : 'Ready'}</dd></div>
  </dl>
  {#if theme.authoring.diagnostics.length}
    <ul class="theme-authoring-diagnostics" aria-label="Theme diagnostics">
      {#each theme.authoring.diagnostics as diagnostic}<li>{diagnostic.message}</li>{/each}
    </ul>
  {/if}
  <p class="theme-authoring-status" role="status" aria-live="polite">{status}</p>
  <footer class="theme-authoring-actions">
    <button type="button" data-pom-part="button.surface" onclick={reset}>Reset</button>
    <button type="button" data-pom-part="button.surface" onclick={save} disabled={theme.authoring.diagnostics.length > 0}>Save draft</button>
  </footer>
</div>
