<script lang="ts">
  import { compileSliderProgress } from '@pomegranate-ui/theme';
  import { editableThemeDraft, type ThemeAuthoringPort } from './ThemeAuthoringTypes.js';

  let { theme }: { theme: ThemeAuthoringPort } = $props();
  const controls = [['glassDensity', 'Glass Density'], ['barOpacity', 'Bar Opacity'], ['selectedStrength', 'Selected Strength'], ['frostLevel', 'Frost Level']] as const;
  const draft = $derived(editableThemeDraft(theme));
  function setMaterial(id: (typeof controls)[number][0], value: number) {
    const next = editableThemeDraft(theme);
    next.draft.materials[id] = value;
    theme.editDraft(next);
  }
</script>

<div class="theme-authoring-element theme-authoring-ranges" data-theme-authoring-element="materials">
  {#each controls as control (control[0])}<label><span>{control[1]}</span><output>{draft.draft.materials[control[0]]}%</output><input data-pom-part="slider.input" aria-label={control[1]} type="range" min="0" max="100" value={draft.draft.materials[control[0]]} style={`--pom-slider-progress:${compileSliderProgress(draft.draft.materials[control[0]], 0, 100)}`} oninput={(event) => setMaterial(control[0], Number(event.currentTarget.value))} /></label>{/each}
</div>
