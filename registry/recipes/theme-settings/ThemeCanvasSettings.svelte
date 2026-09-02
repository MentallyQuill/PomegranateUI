<script lang="ts">
  import { compileSliderProgress } from '@pomegranate-ui/theme';
  import { diagnosticsFor, editableThemeDraft, type ThemeAuthoringPort } from './ThemeAuthoringTypes.js';

  let { theme }: { theme: ThemeAuthoringPort } = $props();
  const controls = [['imageStrength', 'Image Strength', 100, 'image'], ['overlayStrength', 'Overlay Strength', 100, 'overlay'], ['gradientAngle', 'Gradient Direction', 359, 'gradient'], ['vignetteStrength', 'Vignette Strength', 100, 'vignette']] as const;
  const draft = $derived(editableThemeDraft(theme));
  const diagnostics = $derived(diagnosticsFor(theme, ['canvas']));
  function setCanvas(id: (typeof controls)[number][0], value: number) {
    const next = editableThemeDraft(theme);
    next.draft.canvas[id] = value;
    theme.editDraft(next);
  }
</script>

<div class="theme-authoring-element theme-authoring-ranges" data-theme-authoring-element="canvas">
  {#each controls as control (control[0])}{@const available = theme.authoring.canvasAvailability[control[3]]}<label class:theme-control-unavailable={!available}><span>{control[1]}</span><output>{draft.draft.canvas[control[0]]}{control[0] === 'gradientAngle' ? '°' : '%'}</output><input data-pom-part="slider.input" aria-label={control[1]} type="range" min="0" max={control[2]} value={draft.draft.canvas[control[0]]} disabled={!available} style={`--pom-slider-progress:${compileSliderProgress(draft.draft.canvas[control[0]], 0, control[2])}`} oninput={(event) => setCanvas(control[0], Number(event.currentTarget.value))} />{#if !available}<small>Not used by this preset</small>{/if}</label>{/each}
  {#if diagnostics.length}<ul class="theme-authoring-diagnostics" aria-label="Canvas diagnostics">{#each diagnostics as diagnostic}<li>{diagnostic.message}</li>{/each}</ul>{/if}
</div>
