<script lang="ts">
  import type { ToolbarTogglePresentation } from '@pomegranate-ui/contracts';

  import { editableThemeDraft, type ThemeAuthoringPort } from './ThemeAuthoringTypes.js';

  let { theme }: { theme: ThemeAuthoringPort } = $props();
  let status = $state('Theme draft ready.');
  const draft = $derived(editableThemeDraft(theme));
  function setToolbarTogglePresentation(value: ToolbarTogglePresentation) {
    const next = editableThemeDraft(theme);
    next.draft.toolbarTogglePresentation = value;
    const result = theme.editDraft(next);
    status = result.ok ? 'Toolbar controls updated.' : result.authoring.diagnostics[0]?.message ?? 'Toolbar controls could not be updated.';
  }
  function reset() {
    const result = theme.resetDraft();
    status = result.ok ? 'Theme draft reset to the active preset.' : result.authoring.diagnostics[0]?.message ?? 'Theme draft could not be reset.';
  }
  async function save() {
    const result = await theme.saveDraft();
    status = result.ok ? 'Theme draft saved on this device.' : result.authoring.diagnostics[0]?.message ?? 'Theme draft could not be saved.';
  }
</script>

<div class="theme-authoring-element theme-authoring-overview" data-theme-authoring-element="overview">
  <p class="theme-authoring-meta">This theme · recoverable device draft</p>
  <dl class="theme-authoring-summary">
    <div><dt>Preset</dt><dd>{theme.authoring.applied.resolved.theme.label}</dd></div>
    <div><dt>State</dt><dd>{theme.authoring.dirty ? 'Unsaved changes' : 'Ready'}</dd></div>
  </dl>
  <fieldset class="theme-authoring-toolbar-controls">
    <legend>Toolbar controls</legend>
    <label><input type="radio" name="toolbar-toggle-presentation" value="edge-labels" checked={(draft.draft.toolbarTogglePresentation ?? 'edge-labels') === 'edge-labels'} onclick={() => setToolbarTogglePresentation('edge-labels')} /><span>Edge labels</span></label>
    <label><input type="radio" name="toolbar-toggle-presentation" value="bottom-chevrons" checked={draft.draft.toolbarTogglePresentation === 'bottom-chevrons'} onclick={() => setToolbarTogglePresentation('bottom-chevrons')} /><span>Bottom-edge chevrons</span></label>
  </fieldset>
  {#if theme.authoring.diagnostics.length}<ul class="theme-authoring-diagnostics" aria-label="Theme diagnostics">{#each theme.authoring.diagnostics as diagnostic}<li>{diagnostic.message}</li>{/each}</ul>{/if}
  <p class="theme-authoring-status" role="status" aria-live="polite">{status}</p>
  <footer class="theme-authoring-actions"><button type="button" data-pom-part="button.surface" onclick={reset}>Reset</button><button type="button" data-pom-part="button.surface" onclick={save} disabled={theme.authoring.diagnostics.length > 0 || theme.authoring.saving}>{theme.authoring.saving ? 'Saving…' : 'Save draft'}</button></footer>
</div>
