<script lang="ts">
  import { compileSliderProgress } from '@pomegranate-ui/theme';

  const effects = [
    { label: 'Atmosphere', value: 62, output: '62' },
    { label: 'Contrast', value: 38, output: '38' },
    { label: 'Motion', value: 20, output: 'IDLE' },
    { label: 'Reading Veil', value: 48, output: '48' }
  ] as const;

  const progressStyle = (value: number) => `--pom-slider-progress:${compileSliderProgress(value, 0, 100)}`;
  const syncProgress = (input: HTMLInputElement) => {
    input.style.setProperty('--pom-slider-progress', compileSliderProgress(Number(input.value), 0, 100));
  };
</script>

<fieldset class="scene-effects" aria-label="Scene Effects controls" data-pom-part="group.surface">
  <legend>Scene Effects</legend>
  {#each effects as effect (effect.label)}
    <label data-pom-part="row.surface">
      <span>{effect.label}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={effect.value}
        aria-label={effect.label}
        data-pom-part="slider.input"
        style={progressStyle(effect.value)}
        oninput={(event) => syncProgress(event.currentTarget)}
      />
      <output>{effect.output}</output>
    </label>
  {/each}
</fieldset>
