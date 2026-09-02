<script lang="ts">
  import { PersistedThemeDraftSchema, THEME_DRAFT_COLOR_ROLES, type ThemeDraftColorRole } from '@pomegranate-ui/contracts';
  import { hexToHsv, hsvToHex } from '@pomegranate-ui/theme';
  import ColorPlane from './ColorPlane.svelte';
  import HueControl from './HueControl.svelte';
  import { diagnosticsFor, editableThemeDraft, type EyeDropperPort, type ThemeAuthoringPort } from './ThemeAuthoringTypes.js';

  let { theme, eyedropper }: { theme: ThemeAuthoringPort; eyedropper: EyeDropperPort } = $props();
  const labels: Readonly<Record<ThemeDraftColorRole, string>> = Object.freeze({ canvas: 'Canvas', glass: 'Glass', chrome: 'Chrome', ambient: 'Ambient', text: 'Text', source: 'Source' });
  const exactHex = /^#[0-9a-f]{6}$/i;
  let selectedRole: ThemeDraftColorRole = $state('canvas');
  let roleInputs: Record<ThemeDraftColorRole, string> = $state(Object.fromEntries(THEME_DRAFT_COLOR_ROLES.map((role) => [role, '#000000'])) as Record<ThemeDraftColorRole, string>);
  let rgbInputs: [string, string, string] = $state(['0', '0', '0']);
  let localDiagnostic = $state('');
  let syncedSignature = $state('');
  const draft = $derived(editableThemeDraft(theme));
  const hsv = $derived(hexToHsv(draft.draft.colors[selectedRole]));
  const diagnostics = $derived(diagnosticsFor(theme, ['colors']));

  $effect(() => {
    const parsed = PersistedThemeDraftSchema.safeParse(theme.authoring.editable);
    if (!parsed.success) return;
    const signature = JSON.stringify(parsed.data.draft.colors);
    if (signature === syncedSignature) return;
    syncedSignature = signature;
    for (const role of THEME_DRAFT_COLOR_ROLES) roleInputs[role] = parsed.data.draft.colors[role];
    rgbInputs = rgb(parsed.data.draft.colors[selectedRole]);
    localDiagnostic = '';
  });

  function rgb(hex: string): [string, string, string] { return [String(Number.parseInt(hex.slice(1, 3), 16)), String(Number.parseInt(hex.slice(3, 5), 16)), String(Number.parseInt(hex.slice(5, 7), 16))]; }
  function rgbHex(values: readonly string[]): string | null { const numbers = values.map(Number); return numbers.some((value) => !Number.isInteger(value) || value < 0 || value > 255) ? null : `#${numbers.map((value) => value.toString(16).padStart(2, '0')).join('')}`; }
  function selectRole(role: ThemeDraftColorRole) { selectedRole = role; rgbInputs = rgb(draft.draft.colors[role]); localDiagnostic = ''; }
  function setHex(raw: string) {
    roleInputs[selectedRole] = raw;
    const next = editableThemeDraft(theme);
    if (!exactHex.test(raw)) { const invalid = next as unknown as { draft: { colors: Record<string, string> } }; invalid.draft.colors[selectedRole] = raw; theme.editDraft(invalid); return; }
    next.draft.colors[selectedRole] = raw.toLowerCase();
    rgbInputs = rgb(raw);
    localDiagnostic = '';
    theme.editDraft(next);
  }
  function setRgb(index: number, raw: string) { rgbInputs[index] = raw; const next = rgbHex(rgbInputs); if (next) setHex(next); else localDiagnostic = 'RGB channels must be whole numbers from 0 to 255.'; }
  function setHsv(value: { hue: number; saturation: number; value: number }) { const hex = hsvToHex(value); roleInputs[selectedRole] = hex; rgbInputs = rgb(hex); const next = editableThemeDraft(theme); next.draft.colors[selectedRole] = hex; theme.editDraft(next); }
  async function sampleColor() { const sampled = await eyedropper.sample(); if (sampled) setHex(sampled); }
</script>

<div class="theme-authoring-element theme-authoring-colors" data-theme-authoring-element="colors">
  <div class="theme-role-swatches" role="group" aria-label="Theme color role">{#each THEME_DRAFT_COLOR_ROLES as role (role)}<button type="button" data-pom-part="button.surface" aria-label={labels[role]} aria-pressed={selectedRole === role} onclick={() => selectRole(role)}><i style={`--theme-swatch:${draft.draft.colors[role]}`} aria-hidden="true"></i><span>{labels[role]}</span></button>{/each}</div>
  <div class="theme-color-editor">
    <ColorPlane hue={hsv.hue} saturation={hsv.saturation} value={hsv.value} onchange={(value) => setHsv({ hue: hsv.hue, ...value })} />
    <HueControl value={hsv.hue} onchange={(hue) => setHsv({ hue, saturation: hsv.saturation, value: hsv.value })} />
    <div class="theme-channel-fields"><label class="theme-hex-field"><span>Hex</span><input data-pom-part="field.surface" aria-label="Hex color" value={roleInputs[selectedRole]} oninput={(event) => setHex(event.currentTarget.value)} /></label>{#each ['Red', 'Green', 'Blue'] as label, index (label)}<label><span>{label}</span><input data-pom-part="field.surface" aria-label={label} inputmode="numeric" value={rgbInputs[index]} oninput={(event) => setRgb(index, event.currentTarget.value)} /></label>{/each}</div>
    <button type="button" data-pom-part="button.surface" disabled={!eyedropper.available()} onclick={sampleColor}>{eyedropper.available() ? 'Use Eyedropper' : 'Eyedropper unavailable'}</button>
  </div>
  {#if localDiagnostic || diagnostics.length}<ul class="theme-authoring-diagnostics" aria-label="Color diagnostics">{#if localDiagnostic}<li>{localDiagnostic}</li>{/if}{#each diagnostics as diagnostic}<li>{diagnostic.message}</li>{/each}</ul>{/if}
</div>
