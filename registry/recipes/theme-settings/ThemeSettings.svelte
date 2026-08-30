<script lang="ts">
  import { PersistedThemeDraftSchema, THEME_DRAFT_COLOR_ROLES, type PersistedThemeDraft, type ThemeDraftColorRole } from '@pomegranate-ui/contracts';
  import { compileSliderProgress, hexToHsv, hsvToHex } from '@pomegranate-ui/theme';
  import AmbientPosition from './AmbientPosition.svelte';
  import ColorPlane from './ColorPlane.svelte';
  import HueControl from './HueControl.svelte';

  type Result = { readonly ok: boolean; readonly authoring: { readonly editable: unknown; readonly diagnostics: readonly { readonly message: string }[] } };
  type Authoring = { readonly authoring: { readonly editable: unknown; readonly diagnostics: readonly { readonly message: string }[] }; readonly editDraft: (next: unknown) => Result; readonly resetDraft: () => Result; readonly saveDraft: () => Promise<Result> };
  type EyeDropper = { available(): boolean; sample(): Promise<string | null> };
  type Contract = { readonly scope: string; readonly rows: readonly (readonly [string, string])[]; readonly boundary: string };
  let { theme, eyedropper, contract }: { theme: Authoring; eyedropper: EyeDropper; contract?: Contract } = $props();

  const labels: Readonly<Record<ThemeDraftColorRole, string>> = Object.freeze({ canvas: 'Canvas', glass: 'Glass', chrome: 'Chrome', ambient: 'Ambient', text: 'Text', source: 'Source' });
  const materials = [['glassDensity', 'Glass Density'], ['barOpacity', 'Bar Opacity'], ['selectedStrength', 'Selected Strength'], ['frostLevel', 'Frost Level']] as const;
  const exactHex = /^#[0-9a-f]{6}$/i;
  function initial(): PersistedThemeDraft { return structuredClone(PersistedThemeDraftSchema.parse(theme.authoring.editable)); }
  function initialDiagnostics() { return [...theme.authoring.diagnostics]; }
  let draft = $state(initial());
  let role: ThemeDraftColorRole = $state('canvas');
  let inputs: Record<ThemeDraftColorRole, string> = $state(Object.fromEntries(THEME_DRAFT_COLOR_ROLES.map((id) => [id, initial().draft.colors[id]])) as Record<ThemeDraftColorRole, string>);
  let diagnostics = $state(initialDiagnostics());
  let status = $state('Theme draft ready.');
  const hsv = $derived(hexToHsv(draft.draft.colors[role]));
  const snapshot = () => PersistedThemeDraftSchema.parse($state.snapshot(draft));
  function apply(message: string) { const result = theme.editDraft(snapshot()); diagnostics = [...result.authoring.diagnostics]; status = result.ok ? message : diagnostics[0]?.message ?? 'Theme draft is invalid.'; }
  function setHex(value: string) {
    inputs[role] = value;
    if (exactHex.test(value)) { draft.draft.colors[role] = value.toLowerCase(); apply(`${labels[role]} updated.`); return; }
    const invalid = snapshot() as unknown as { draft: { colors: Record<string, string> } }; invalid.draft.colors[role] = value;
    const result = theme.editDraft(invalid); diagnostics = [...result.authoring.diagnostics]; status = diagnostics[0]?.message ?? 'Enter an exact #RRGGBB color.';
  }
  function setHsv(next: { hue: number; saturation: number; value: number }) { const value = hsvToHex(next); draft.draft.colors[role] = value; inputs[role] = value; apply(`${labels[role]} updated.`); }
  async function sample() { const value = await eyedropper.sample(); if (value) setHex(value); else status = 'Eyedropper request was unavailable or denied. No color changed.'; }
  function reset() { const result = theme.resetDraft(); diagnostics = [...result.authoring.diagnostics]; if (result.ok) { draft = structuredClone(PersistedThemeDraftSchema.parse(result.authoring.editable)); for (const id of THEME_DRAFT_COLOR_ROLES) inputs[id] = draft.draft.colors[id]; status = 'Theme draft reset to the active target.'; } }
  async function save() { const result = await theme.saveDraft(); diagnostics = [...result.authoring.diagnostics]; status = result.ok ? 'Theme draft saved on this device.' : diagnostics[0]?.message ?? 'Theme draft could not be saved.'; }
</script>

<div class="theme-settings" data-surface-presentation="theme-settings">
  {#if contract}<p class="surface-scope">{contract.scope}</p><dl class="surface-contract-facts" aria-label="Visible surface contract">{#each contract.rows as row (row[0])}<div><dt>{row[0]}</dt><dd>{row[1]}</dd></div>{/each}</dl>{/if}
  <section aria-label="Semantic colors">
    <h3>Semantic colors</h3>
    <div class="theme-role-swatches" role="group" aria-label="Theme color role">{#each THEME_DRAFT_COLOR_ROLES as id (id)}<button type="button" data-pom-part="button.surface" aria-label={labels[id]} aria-pressed={role === id} onclick={() => role = id}><i style={`--theme-swatch:${draft.draft.colors[id]}`} aria-hidden="true"></i><span>{labels[id]}</span></button>{/each}</div>
    <ColorPlane hue={hsv.hue} saturation={hsv.saturation} value={hsv.value} onchange={(next) => setHsv({ hue: hsv.hue, ...next })} />
    <HueControl value={hsv.hue} onchange={(hue) => setHsv({ hue, saturation: hsv.saturation, value: hsv.value })} />
    <label><span>Hex</span><input data-pom-part="field.surface" aria-label="Hex color" value={inputs[role]} oninput={(event) => setHex(event.currentTarget.value)} /></label>
    <button type="button" data-pom-part="button.surface" disabled={!eyedropper.available()} onclick={sample}>{eyedropper.available() ? 'Use Eyedropper' : 'Eyedropper unavailable'}</button>
  </section>
  <section aria-label="Materials"><h3>Materials</h3><div class="theme-settings-ranges">{#each materials as control (control[0])}<label><span>{control[1]}</span><output>{draft.draft.materials[control[0]]}%</output><input data-pom-part="slider.input" aria-label={control[1]} type="range" min="0" max="100" value={draft.draft.materials[control[0]]} style={`--pom-slider-progress:${compileSliderProgress(draft.draft.materials[control[0]], 0, 100)}`} oninput={(event) => { draft.draft.materials[control[0]] = Number(event.currentTarget.value); apply(`${control[1]} updated.`); }} /></label>{/each}</div></section>
  <section aria-label="Ambient light"><h3>Ambient light</h3><AmbientPosition x={draft.ambient.position.x} y={draft.ambient.position.y} onchange={(position) => { draft.ambient.position = position; apply('Ambient position updated.'); }} /><div class="theme-settings-ranges">{#each [['radius', 'Radius'], ['power', 'Power']] as control (control[0])}<label><span>{control[1]}</span><output>{Math.round(draft.ambient[control[0] as 'radius' | 'power'] * 100)}%</output><input data-pom-part="slider.input" aria-label={control[1]} type="range" min="0" max="100" value={Math.round(draft.ambient[control[0] as 'radius' | 'power'] * 100)} oninput={(event) => { draft.ambient[control[0] as 'radius' | 'power'] = Number(event.currentTarget.value) / 100; apply(`Ambient ${control[0]} updated.`); }} /></label>{/each}</div></section>
  {#if diagnostics.length}<ul class="theme-diagnostics" aria-label="Theme diagnostics">{#each diagnostics as diagnostic}<li>{diagnostic.message}</li>{/each}</ul>{/if}
  <p role="status" aria-live="polite">{status}</p>
  {#if contract}<p class="surface-boundary"><span aria-hidden="true">i</span>{contract.boundary}</p>{/if}
  <footer class="surface-actions"><button type="button" data-pom-part="button.surface" onclick={reset}>Reset</button><button type="button" data-pom-part="button.surface" disabled={diagnostics.length > 0} onclick={save}>Save draft</button></footer>
</div>
