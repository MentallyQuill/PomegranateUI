<script lang="ts">
  import {
    PersistedThemeDraftSchema,
    THEME_DRAFT_COLOR_ROLES,
    type PersistedThemeDraft,
    type ThemeDraftColorRole
  } from '@pomegranate-ui/contracts';
  import { compileSliderProgress, hexToHsv, hsvToHex } from '@pomegranate-ui/theme';

  import AmbientPosition from '../../recipes/AmbientPosition.svelte';
  import ColorPlane from '../../recipes/ColorPlane.svelte';
  import HueControl from '../../recipes/HueControl.svelte';
  import type { LabThemeHostContext } from '../host-context.js';

  let { theme }: { theme: LabThemeHostContext } = $props();

  const ROLE_LABELS: Readonly<Record<ThemeDraftColorRole, string>> = Object.freeze({
    canvas: 'Canvas',
    glass: 'Glass',
    chrome: 'Chrome',
    ambient: 'Ambient',
    text: 'Text',
    source: 'Source'
  });
  const EDITOR_LABELS: Readonly<Record<ThemeDraftColorRole, string>> = Object.freeze({
    canvas: 'Canvas Ink',
    glass: 'Glass Surface',
    chrome: 'Control Chrome',
    ambient: 'Ambient Accent',
    text: 'Interface Text',
    source: 'Source Gold'
  });
  const MATERIALS = [
    ['glassDensity', 'Glass Density'],
    ['barOpacity', 'Bar Opacity'],
    ['selectedStrength', 'Selected Strength'],
    ['frostLevel', 'Frost Level']
  ] as const;
  const exactHex = /^#[0-9a-f]{6}$/i;

  function parseEditable(value: unknown): PersistedThemeDraft {
    return structuredClone(PersistedThemeDraftSchema.parse(value));
  }

  function rgb(hex: string): [string, string, string] {
    return [String(Number.parseInt(hex.slice(1, 3), 16)), String(Number.parseInt(hex.slice(3, 5), 16)), String(Number.parseInt(hex.slice(5, 7), 16))];
  }

  function rgbHex(values: readonly string[]): string | null {
    const numbers = values.map(Number);
    if (numbers.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return null;
    return `#${numbers.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  }

  function initialDraft() {
    return parseEditable(theme.authoring.editable);
  }

  let draft = $state(initialDraft());
  let draftThemeId = $state('');
  let selectedRole = $state<ThemeDraftColorRole | null>(null);
  let colorInput = $state(initialDraft().draft.colors.canvas);
  let rgbInputs = $state<[string, string, string]>(rgb(initialDraft().draft.colors.canvas));
  const hsv = $derived(hexToHsv(draft.draft.colors[selectedRole ?? 'canvas']));
  const activeLabel = $derived(theme.authoring.applied.resolved.theme.label);

  $effect(() => {
    const activeId = theme.activeId;
    if (activeId === draftThemeId) return;
    const next = initialDraft();
    draftThemeId = activeId;
    draft = next;
    selectedRole = null;
    colorInput = next.draft.colors.canvas;
    rgbInputs = rgb(colorInput);
  });

  function apply() {
    theme.editDraft(PersistedThemeDraftSchema.parse($state.snapshot(draft)));
  }

  function editRole(role: ThemeDraftColorRole) {
    selectedRole = role;
    colorInput = draft.draft.colors[role];
    rgbInputs = rgb(colorInput);
  }

  function setHex(raw: string) {
    if (!selectedRole) return;
    colorInput = raw;
    if (!exactHex.test(raw)) return;
    draft.draft.colors[selectedRole] = raw.toLowerCase();
    rgbInputs = rgb(raw);
    apply();
  }

  function setRgb(index: number, raw: string) {
    rgbInputs[index] = raw;
    const next = rgbHex(rgbInputs);
    if (next) setHex(next);
  }

  function setHsv(next: { hue: number; saturation: number; value: number }) {
    if (!selectedRole) return;
    const hex = hsvToHex(next);
    draft.draft.colors[selectedRole] = hex;
    colorInput = hex;
    rgbInputs = rgb(hex);
    apply();
  }

  function setMaterial(id: (typeof MATERIALS)[number][0], value: number) {
    draft.draft.materials[id] = value;
    apply();
  }

  function setAmbient(field: 'radius' | 'power', value: number) {
    draft.ambient[field] = value;
    apply();
  }

  function scrollWithKeyboard(event: KeyboardEvent) {
    if (event.target !== event.currentTarget || (event.key !== 'Home' && event.key !== 'End')) return;
    event.preventDefault();
    const region = event.currentTarget as HTMLElement;
    region.scrollTop = event.key === 'Home' ? 0 : region.scrollHeight;
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (named overflow owner implements Home/End scrolling) -->
<div
  class="compact-theme"
  data-surface-presentation="compact-theme"
  role="region"
  aria-label="Custom Theme controls"
  tabindex="0"
  onkeydown={scrollWithKeyboard}
>
  {#if selectedRole}
    <section class="compact-color-editor" aria-label={`${EDITOR_LABELS[selectedRole]} editor`}>
      <header><strong>{EDITOR_LABELS[selectedRole]}</strong><span>Edited</span></header>
      <ColorPlane
        hue={hsv.hue}
        saturation={hsv.saturation}
        value={hsv.value}
        onchange={(next) => setHsv({ hue: hsv.hue, ...next })}
      />
      <HueControl value={hsv.hue} onchange={(hue) => setHsv({ hue, saturation: hsv.saturation, value: hsv.value })} />
      <div class="compact-color-fields">
        <label class="compact-hex-field"><span>Hex</span><input data-pom-part="field.surface" aria-label="Hex color" value={colorInput} oninput={(event) => setHex(event.currentTarget.value)} /></label>
        {#each ['Red', 'Green', 'Blue'] as label, index (label)}
          <label><span>{label}</span><input data-pom-part="field.surface" aria-label={label} inputmode="numeric" value={rgbInputs[index]} oninput={(event) => setRgb(index, event.currentTarget.value)} /></label>
        {/each}
      </div>
      <button type="button" data-pom-part="button.surface" onclick={() => { selectedRole = null; }}>Back to theme overview</button>
    </section>
  {:else}
    <header class="compact-theme-identity"><strong>{activeLabel}</strong><span>Edited</span></header>
    <div class="compact-theme-swatches" role="group" aria-label="Semantic theme colors">
      {#each THEME_DRAFT_COLOR_ROLES as role (role)}
        <button
          type="button"
          data-pom-part="button.surface"
          aria-label={ROLE_LABELS[role]}
          style={`--theme-swatch:${draft.draft.colors[role]};background-color:${draft.draft.colors[role]}`}
          onclick={() => editRole(role)}
        ></button>
      {/each}
    </div>
    <section class="compact-theme-materials" aria-label="Materials">
      {#each MATERIALS as control (control[0])}
        <label>
          <span>{control[1]}</span><output>{draft.draft.materials[control[0]]}%</output>
          <input
            data-pom-part="slider.input"
            aria-label={control[1]}
            type="range"
            min="0"
            max="100"
            value={draft.draft.materials[control[0]]}
            style={`--pom-slider-progress:${compileSliderProgress(draft.draft.materials[control[0]], 0, 100)}`}
            oninput={(event) => setMaterial(control[0], Number(event.currentTarget.value))}
          />
        </label>
      {/each}
    </section>
  {/if}

  <section class="compact-ambient" aria-label="Ambient light">
    <header><strong>Ambient Light</strong><span>Screen X,Y</span></header>
    <AmbientPosition
      x={draft.ambient.position.x}
      y={draft.ambient.position.y}
      radius={draft.ambient.radius}
      power={draft.ambient.power}
      onchange={(position) => { draft.ambient.position = position; apply(); }}
      onradiuschange={(radius) => setAmbient('radius', radius)}
      onpowerchange={(power) => setAmbient('power', power)}
    />
    <footer>
      <span>POS {Math.round(draft.ambient.position.x * 100)}/{Math.round(draft.ambient.position.y * 100)}</span>
      <span>RAD {Math.round(draft.ambient.radius * 100)}</span>
      <span>PWR {Math.round(draft.ambient.power * 100)}</span>
    </footer>
  </section>
</div>
