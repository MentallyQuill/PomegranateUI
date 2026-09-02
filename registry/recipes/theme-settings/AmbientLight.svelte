<script lang="ts">
  import { compileSliderProgress } from '@pomegranate-ui/theme';
  import AmbientPosition from './AmbientPosition.svelte';
  import { diagnosticsFor, editableThemeDraft, type ThemeAuthoringPort } from './ThemeAuthoringTypes.js';

  let { theme }: { theme: ThemeAuthoringPort } = $props();
  const draft = $derived(editableThemeDraft(theme));
  const diagnostics = $derived(diagnosticsFor(theme, ['ambient']));
  function updatePosition(position: { x: number; y: number }) { const next = editableThemeDraft(theme); next.ambient.position = position; theme.editDraft(next); }
  function updateValue(field: 'radius' | 'power', value: number) { const next = editableThemeDraft(theme); next.ambient[field] = value; theme.editDraft(next); }
</script>

<div class="theme-authoring-element theme-authoring-ambient" data-theme-authoring-element="ambient">
  <AmbientPosition x={draft.ambient.position.x} y={draft.ambient.position.y} onchange={updatePosition} />
  <div class="theme-authoring-ranges">{#each [['radius', 'Radius'], ['power', 'Power']] as control (control[0])}<label><span>{control[1]}</span><output>{Math.round(draft.ambient[control[0] as 'radius' | 'power'] * 100)}%</output><input data-pom-part="slider.input" aria-label={control[1]} type="range" min="0" max="100" value={Math.round(draft.ambient[control[0] as 'radius' | 'power'] * 100)} style={`--pom-slider-progress:${compileSliderProgress(draft.ambient[control[0] as 'radius' | 'power'] * 100, 0, 100)}`} oninput={(event) => updateValue(control[0] as 'radius' | 'power', Number(event.currentTarget.value) / 100)} /></label>{/each}</div>
  {#if diagnostics.length}<ul class="theme-authoring-diagnostics" aria-label="Ambient diagnostics">{#each diagnostics as diagnostic}<li>{diagnostic.message}</li>{/each}</ul>{/if}
</div>
