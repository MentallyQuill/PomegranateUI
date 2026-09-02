<script lang="ts">
  import {
    THEME_DRAFT_COLOR_ROLES,
    type ThemeDraftColorRole
  } from '@pomegranate-ui/contracts';
  import { hexToHsv, hsvToHex } from '@pomegranate-ui/theme';

  import ColorPlane from '../ColorPlane.svelte';
  import HueControl from '../HueControl.svelte';
  import {
    diagnosticsFor,
    type EyeDropperPort,
    type ThemeAuthoringPort
  } from './types.js';

  let { theme, eyedropper }: { theme: ThemeAuthoringPort; eyedropper: EyeDropperPort } = $props();
  const labels: Readonly<Record<ThemeDraftColorRole, string>> = Object.freeze({
    canvas: 'Canvas',
    glass: 'Glass',
    chrome: 'Chrome',
    ambient: 'Ambient',
    text: 'Text',
    source: 'Source'
  });
  const exactHex = /^#[0-9a-f]{6}$/i;
  let selectedRole: ThemeDraftColorRole = $state('canvas');
  let status = $state('');
  const selectedHex = $derived(theme.authoring.colorInputs.hex[selectedRole]);
  const previewHex = $derived(exactHex.test(selectedHex)
    ? selectedHex
    : theme.authoring.lastValidEditable.draft.colors[selectedRole]);
  const rgbInputs = $derived(theme.authoring.colorInputs.rgb[selectedRole]);
  const hsv = $derived(hexToHsv(previewHex));
  const diagnostics = $derived(diagnosticsFor(theme, ['colors']));

  function selectRole(role: ThemeDraftColorRole) {
    selectedRole = role;
    status = '';
  }

  function setHex(raw: string) {
    status = '';
    theme.editColorHex(selectedRole, raw);
  }

  function setRgb(index: number, raw: string) {
    status = '';
    theme.editColorRgb(selectedRole, index as 0 | 1 | 2, raw);
  }

  function setHsv(nextHsv: { hue: number; saturation: number; value: number }) {
    const hex = hsvToHex(nextHsv);
    status = '';
    theme.editColorHex(selectedRole, hex);
  }

  async function sampleColor() {
    const sampled = await eyedropper.sample();
    if (sampled) setHex(sampled);
    else status = 'No color was selected; the theme did not change.';
  }
</script>

<div class="theme-authoring-element theme-authoring-colors" data-theme-authoring-element="colors">
  <div class="theme-role-swatches" role="group" aria-label="Theme color role">
    {#each THEME_DRAFT_COLOR_ROLES as role (role)}
      <button
        type="button"
        data-pom-part="button.surface"
        aria-label={labels[role]}
        aria-pressed={selectedRole === role}
        onclick={() => selectRole(role)}
      ><i style={`--theme-swatch:${exactHex.test(theme.authoring.colorInputs.hex[role]) ? theme.authoring.colorInputs.hex[role] : theme.authoring.lastValidEditable.draft.colors[role]}`} aria-hidden="true"></i><span>{labels[role]}</span></button>
    {/each}
  </div>
  <div class="theme-color-editor">
    <ColorPlane
      hue={hsv.hue}
      saturation={hsv.saturation}
      value={hsv.value}
      onchange={(value) => setHsv({ hue: hsv.hue, ...value })}
    />
    <HueControl value={hsv.hue} onchange={(hue) => setHsv({ hue, saturation: hsv.saturation, value: hsv.value })} />
    <div class="theme-channel-fields">
      <label class="theme-hex-field"><span>Hex</span><input data-pom-part="field.surface" aria-label="Hex color" value={selectedHex} oninput={(event) => setHex(event.currentTarget.value)} /></label>
      {#each ['Red', 'Green', 'Blue'] as label, index (label)}
        <label><span>{label}</span><input data-pom-part="field.surface" aria-label={label} inputmode="numeric" value={rgbInputs[index]} oninput={(event) => setRgb(index, event.currentTarget.value)} /></label>
      {/each}
    </div>
    <button type="button" data-pom-part="button.surface" disabled={!eyedropper.available()} onclick={sampleColor}>
      {eyedropper.available() ? 'Use Eyedropper' : 'Eyedropper unavailable'}
    </button>
  </div>
  {#if status}<p class="theme-authoring-status" role="status" aria-live="polite">{status}</p>{/if}
  {#if diagnostics.length}
    <ul class="theme-authoring-diagnostics" aria-label="Color diagnostics">
      {#each diagnostics as diagnostic}<li>{diagnostic.message}</li>{/each}
    </ul>
  {/if}
</div>
