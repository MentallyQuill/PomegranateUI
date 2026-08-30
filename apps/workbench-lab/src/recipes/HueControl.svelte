<script lang="ts">
  import { compileSliderProgress } from '@pomegranate-ui/theme';

  let { value, onchange }: { value: number; onchange: (value: number) => void } = $props();
</script>

<label class="theme-hue-control">
  <span>Hue</span>
  <output>{Math.round(value)}°</output>
  <input
    data-pom-part="slider.input"
    aria-label="Hue"
    type="range"
    min="0"
    max="359"
    step="1"
    value={Math.round(value)}
    style={`--pom-slider-progress:${compileSliderProgress(value, 0, 359)}`}
    oninput={(event) => onchange(Number(event.currentTarget.value))}
  />
</label>
