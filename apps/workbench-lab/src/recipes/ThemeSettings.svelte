<script lang="ts">
  import {
    PersistedThemeDraftSchema,
    THEME_DRAFT_COLOR_ROLES,
    type PersistedThemeDraft,
    type ThemeDraftColorRole
  } from '@pomegranate-ui/contracts';
  import { compileSliderProgress, hexToHsv, hsvToHex } from '@pomegranate-ui/theme';

  import AmbientPosition from './AmbientPosition.svelte';
  import ColorPlane from './ColorPlane.svelte';
  import HueControl from './HueControl.svelte';

  type AuthoringResult = {
    readonly ok: boolean;
    readonly authoring: {
      readonly editable: unknown;
      readonly diagnostics: readonly { readonly message: string; readonly path: readonly (string | number)[] }[];
      readonly dirty: boolean;
    };
  };

  type ThemeAuthoring = {
    readonly authoring: {
      readonly editable: unknown;
      readonly diagnostics: readonly { readonly message: string; readonly path: readonly (string | number)[] }[];
      readonly dirty: boolean;
    };
    readonly editDraft: (next: unknown) => AuthoringResult;
    readonly resetDraft: () => AuthoringResult;
    readonly saveDraft: () => Promise<AuthoringResult>;
  };

  type EyeDropper = { available(): boolean; sample(): Promise<string | null> };
  type Contract = {
    readonly scope: string;
    readonly rows: readonly (readonly [string, string])[];
    readonly boundary: string;
  };

  let {
    theme,
    eyedropper,
    contract
  }: {
    theme: ThemeAuthoring;
    eyedropper: EyeDropper;
    contract?: Contract;
  } = $props();

  const ROLE_LABELS: Readonly<Record<ThemeDraftColorRole, string>> = Object.freeze({
    canvas: 'Canvas',
    glass: 'Glass',
    chrome: 'Chrome',
    ambient: 'Ambient',
    text: 'Text',
    source: 'Source'
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

  function initialEditable(): PersistedThemeDraft {
    return parseEditable(theme.authoring.editable);
  }

  function initialDiagnostics() {
    return [...theme.authoring.diagnostics];
  }

  function snapshotDraft(): PersistedThemeDraft {
    return PersistedThemeDraftSchema.parse($state.snapshot(draft));
  }

  function rgb(hex: string): [string, string, string] {
    return [String(Number.parseInt(hex.slice(1, 3), 16)), String(Number.parseInt(hex.slice(3, 5), 16)), String(Number.parseInt(hex.slice(5, 7), 16))];
  }

  function rgbHex(values: readonly string[]): string | null {
    const numbers = values.map(Number);
    if (numbers.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return null;
    return `#${numbers.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  }

  let draft = $state(initialEditable());
  let selectedRole: ThemeDraftColorRole = $state('canvas');
  let roleInputs: Record<ThemeDraftColorRole, string> = $state(Object.fromEntries(
    THEME_DRAFT_COLOR_ROLES.map((role) => [role, initialEditable().draft.colors[role]])
  ) as Record<ThemeDraftColorRole, string>);
  let rgbInputs: [string, string, string] = $state(rgb(initialEditable().draft.colors.canvas));
  let diagnostics = $state(initialDiagnostics());
  let status = $state('Theme draft ready.');
  let activeBase = $state(initialEditable().draft.baseTargetId);
  const hsv = $derived(hexToHsv(draft.draft.colors[selectedRole]));

  function syncFrom(next: unknown) {
    const parsed = parseEditable(next);
    draft = parsed;
    activeBase = parsed.draft.baseTargetId;
    for (const role of THEME_DRAFT_COLOR_ROLES) roleInputs[role] = parsed.draft.colors[role];
    rgbInputs = rgb(parsed.draft.colors[selectedRole]);
  }

  $effect(() => {
    const parsed = PersistedThemeDraftSchema.safeParse(theme.authoring.editable);
    if (parsed.success && parsed.data.draft.baseTargetId !== activeBase) syncFrom(parsed.data);
  });

  function apply(nextStatus = 'Theme draft applied locally.') {
    const result = theme.editDraft(snapshotDraft());
    diagnostics = [...result.authoring.diagnostics];
    status = result.ok ? nextStatus : result.authoring.diagnostics[0]?.message ?? 'Theme draft is invalid.';
  }

  function selectRole(role: ThemeDraftColorRole) {
    selectedRole = role;
    rgbInputs = rgb(draft.draft.colors[role]);
  }

  function setHex(raw: string) {
    roleInputs[selectedRole] = raw;
    if (exactHex.test(raw)) {
      draft.draft.colors[selectedRole] = raw.toLowerCase();
      rgbInputs = rgb(raw);
      apply(`${ROLE_LABELS[selectedRole]} updated.`);
      return;
    }
    const invalid = snapshotDraft() as unknown as { draft: { colors: Record<string, string> } };
    invalid.draft.colors[selectedRole] = raw;
    const result = theme.editDraft(invalid);
    diagnostics = [...result.authoring.diagnostics];
    status = result.authoring.diagnostics[0]?.message ?? 'Enter an exact #RRGGBB color.';
  }

  function setRgb(index: number, raw: string) {
    rgbInputs[index] = raw;
    const next = rgbHex(rgbInputs);
    if (next) setHex(next);
    else {
      diagnostics = [{ message: 'RGB channels must be whole numbers from 0 to 255.', path: ['draft', 'colors', selectedRole] }];
      status = diagnostics[0]!.message;
    }
  }

  function setHsv(next: { hue: number; saturation: number; value: number }) {
    const hex = hsvToHex(next);
    roleInputs[selectedRole] = hex;
    draft.draft.colors[selectedRole] = hex;
    rgbInputs = rgb(hex);
    apply(`${ROLE_LABELS[selectedRole]} updated.`);
  }

  function setMaterial(id: (typeof MATERIALS)[number][0], value: number) {
    draft.draft.materials[id] = value;
    apply(`${MATERIALS.find(([candidate]) => candidate === id)?.[1] ?? 'Material'} updated.`);
  }

  function setAmbient(field: 'radius' | 'power', value: number) {
    draft.ambient[field] = value;
    apply(`Ambient ${field} updated.`);
  }

  async function sampleColor() {
    const sampled = await eyedropper.sample();
    if (!sampled) {
      status = 'Eyedropper request was unavailable or denied. No color changed.';
      return;
    }
    setHex(sampled);
    status = `${ROLE_LABELS[selectedRole]} sampled with Eyedropper.`;
  }

  function reset() {
    const result = theme.resetDraft();
    diagnostics = [...result.authoring.diagnostics];
    if (result.ok) {
      syncFrom(result.authoring.editable);
      status = 'Theme draft reset to the active target.';
    }
  }

  async function save() {
    const result = await theme.saveDraft();
    diagnostics = [...result.authoring.diagnostics];
    status = result.ok ? 'Theme draft saved on this device.' : result.authoring.diagnostics[0]?.message ?? 'Theme draft could not be saved.';
  }
</script>

<div class="theme-settings" data-surface-presentation="theme-settings">
  {#if contract}
    <p class="surface-scope">{contract.scope}</p>
    <dl class="surface-contract-facts" aria-label="Visible surface contract">
      {#each contract.rows as row (row[0])}<div><dt>{row[0]}</dt><dd>{row[1]}</dd></div>{/each}
    </dl>
  {/if}

  <section class="theme-settings-colors" aria-label="Semantic colors">
    <h3>Semantic colors</h3>
    <div class="theme-role-swatches" role="group" aria-label="Theme color role">
      {#each THEME_DRAFT_COLOR_ROLES as role (role)}
        <button
          type="button"
          data-pom-part="button.surface"
          aria-label={ROLE_LABELS[role]}
          aria-pressed={selectedRole === role}
          onclick={() => selectRole(role)}
        ><i style={`--theme-swatch:${draft.draft.colors[role]}`} aria-hidden="true"></i><span>{ROLE_LABELS[role]}</span></button>
      {/each}
    </div>
    <div class="theme-color-editor">
      <ColorPlane
        hue={hsv.hue}
        saturation={hsv.saturation}
        value={hsv.value}
        onchange={(next) => setHsv({ hue: hsv.hue, ...next })}
      />
      <HueControl value={hsv.hue} onchange={(hue) => setHsv({ hue, saturation: hsv.saturation, value: hsv.value })} />
      <div class="theme-channel-fields">
        <label class="theme-hex-field"><span>Hex</span><input data-pom-part="field.surface" aria-label="Hex color" value={roleInputs[selectedRole]} oninput={(event) => setHex(event.currentTarget.value)} /></label>
        {#each ['Red', 'Green', 'Blue'] as label, index (label)}
          <label><span>{label}</span><input data-pom-part="field.surface" aria-label={label} inputmode="numeric" value={rgbInputs[index]} oninput={(event) => setRgb(index, event.currentTarget.value)} /></label>
        {/each}
      </div>
      <button type="button" data-pom-part="button.surface" disabled={!eyedropper.available()} onclick={sampleColor}>
        {eyedropper.available() ? 'Use Eyedropper' : 'Eyedropper unavailable'}
      </button>
    </div>
  </section>

  <section aria-label="Materials">
    <h3>Materials</h3>
    <div class="theme-settings-ranges">
      {#each MATERIALS as control (control[0])}
        <label><span>{control[1]}</span><output>{draft.draft.materials[control[0]]}%</output><input data-pom-part="slider.input" aria-label={control[1]} type="range" min="0" max="100" value={draft.draft.materials[control[0]]} style={`--pom-slider-progress:${compileSliderProgress(draft.draft.materials[control[0]], 0, 100)}`} oninput={(event) => setMaterial(control[0], Number(event.currentTarget.value))} /></label>
      {/each}
    </div>
  </section>

  <section aria-label="Ambient light">
    <h3>Ambient light</h3>
    <AmbientPosition x={draft.ambient.position.x} y={draft.ambient.position.y} onchange={(position) => { draft.ambient.position = position; apply('Ambient position updated.'); }} />
    <div class="theme-settings-ranges">
      {#each [['radius', 'Radius'], ['power', 'Power']] as control (control[0])}
        <label><span>{control[1]}</span><output>{Math.round(draft.ambient[control[0] as 'radius' | 'power'] * 100)}%</output><input data-pom-part="slider.input" aria-label={control[1]} type="range" min="0" max="100" value={Math.round(draft.ambient[control[0] as 'radius' | 'power'] * 100)} style={`--pom-slider-progress:${compileSliderProgress(draft.ambient[control[0] as 'radius' | 'power'] * 100, 0, 100)}`} oninput={(event) => setAmbient(control[0] as 'radius' | 'power', Number(event.currentTarget.value) / 100)} /></label>
      {/each}
    </div>
  </section>

  {#if diagnostics.length}
    <ul class="theme-diagnostics" aria-label="Theme diagnostics">{#each diagnostics as diagnostic}<li>{diagnostic.message}</li>{/each}</ul>
  {/if}
  <p class="theme-settings-status" role="status" aria-live="polite">{status}</p>
  {#if contract}<p class="surface-boundary"><span aria-hidden="true">i</span>{contract.boundary}</p>{/if}
  <footer class="surface-actions"><button type="button" data-pom-part="button.surface" onclick={reset}>Reset</button><button type="button" data-pom-part="button.surface" onclick={save} disabled={diagnostics.length > 0}>Save draft</button></footer>
</div>
