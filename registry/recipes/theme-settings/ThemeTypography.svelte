<script lang="ts">
  import { compileSliderProgress } from '@pomegranate-ui/theme';

  import { editableThemeDraft, type ThemeAuthoringPort, type ThemeTypographyRoleId, type ThemeTypographyScaleId } from './ThemeAuthoringTypes.js';

  let { theme }: { theme: ThemeAuthoringPort } = $props();
  let status = $state('Typography controls ready.');
  const draft = $derived(editableThemeDraft(theme));
  const typography = $derived(draft.draft.typography ?? theme.authoring.applied.resolved.theme.typography);

  const roleControls = [
    { id: 'ui', label: 'Interface' },
    { id: 'prose', label: 'Prose' },
    { id: 'display', label: 'Display' },
    { id: 'technical', label: 'Technical' }
  ] as const;
  const scaleControls = [
    { id: 'xs', label: 'Metadata size', min: 8, max: 24 },
    { id: 'sm', label: 'Support size', min: 9, max: 28 },
    { id: 'md', label: 'Interface size', min: 10, max: 32 },
    { id: 'lg', label: 'Reading size', min: 12, max: 48 },
    { id: 'xl', label: 'Display size', min: 14, max: 72 }
  ] as const;

  function roleValue(role: ThemeTypographyRoleId) {
    return role === 'display' ? typography.display ?? typography.ui : typography[role];
  }

  function resultStatus(result: ReturnType<ThemeAuthoringPort['editTypographyRole']>, success: string) {
    status = result.ok ? success : result.diagnostics?.[0]?.message ?? 'Typography could not be updated.';
  }

  function setFamily(role: ThemeTypographyRoleId, family: string) {
    const choice = theme.fontChoices[role].find((candidate) => candidate.family === family);
    if (!choice) {
      status = 'That bundled font is unavailable for this role.';
      return;
    }
    resultStatus(
      theme.editTypographyRole(role, { family: choice.family, fallbacks: [...choice.fallbacks] }),
      `${roleControls.find((control) => control.id === role)?.label ?? role} font updated for ${theme.authoring.applied.resolved.theme.label}.`
    );
  }

  function familyControl(node: HTMLSelectElement, role: ThemeTypographyRoleId) {
    const change = () => setFamily(role, node.value);
    node.addEventListener('change', change);
    return { destroy: () => node.removeEventListener('change', change) };
  }

  function setRoleNumber(role: ThemeTypographyRoleId, key: 'lineHeight' | 'trackingEm', value: number) {
    resultStatus(theme.editTypographyRole(role, { [key]: value }), 'Typography spacing updated.');
  }

  function setScale(step: ThemeTypographyScaleId, value: number) {
    resultStatus(theme.editTypographyScale(step, value), 'Typography scale updated.');
  }

  function scaleBounds(step: ThemeTypographyScaleId): { min: number; max: number } {
    const index = scaleControls.findIndex((control) => control.id === step);
    const control = scaleControls[index]!;
    const previous = index > 0 ? typography.scale[scaleControls[index - 1]!.id] : control.min;
    const next = index < scaleControls.length - 1 ? typography.scale[scaleControls[index + 1]!.id] : control.max;
    return { min: Math.max(control.min, previous), max: Math.min(control.max, next) };
  }

  function reset() {
    const result = theme.resetTypography();
    status = result.ok
      ? `${theme.authoring.applied.resolved.theme.label} typography reset to its preset.`
      : result.diagnostics?.[0]?.message ?? 'Typography could not be reset.';
  }

  async function save() {
    const result = await theme.saveDraft();
    status = result.ok
      ? `${theme.authoring.applied.resolved.theme.label} typography saved on this device.`
      : result.diagnostics?.[0]?.message ?? 'Typography could not be saved.';
  }
</script>

<div class="theme-authoring-element theme-typography" data-theme-authoring-element="typography">
  <header class="theme-typography-intro">
    <p class="theme-authoring-meta">This theme · bundled typography</p>
    <p><strong>{theme.authoring.applied.resolved.theme.label}</strong> keeps its own font and spacing choices. Switching themes reveals that theme’s settings.</p>
  </header>

  <section class="theme-typography-specimen" aria-label="Live typography preview">
    <small>DISPLAY · A LIVING THEME</small>
    <h3>A quiet page remembers every voice.</h3>
    <p>Prose stays comfortable across long scenes, while interface labels remain crisp and deliberate.</p>
    <code>scene.thread / turn-042</code>
  </section>

  <fieldset class="theme-typography-families">
    <legend>Font families</legend>
    <div>
      {#each roleControls as control (control.id)}
        <label>
          <span>{control.label}</span>
          <select
            data-pom-part="field.surface"
            aria-label={`${control.label} font`}
            value={roleValue(control.id).family}
            use:familyControl={control.id}
          >
            {#each theme.fontChoices[control.id] as choice (choice.family)}
              <option value={choice.family}>{choice.label}</option>
            {/each}
          </select>
        </label>
      {/each}
    </div>
  </fieldset>

  <fieldset class="theme-typography-scale">
    <legend>Semantic sizes</legend>
    <div>
      {#each scaleControls as control (control.id)}
        {@const bounds = scaleBounds(control.id)}
        <label>
          <span>{control.label}</span>
          <output>{typography.scale[control.id]}px</output>
          <input
            data-pom-part="slider.input"
            aria-label={control.label}
            type="range"
            min={bounds.min}
            max={bounds.max}
            step="1"
            value={typography.scale[control.id]}
            style={`--pom-slider-progress:${compileSliderProgress(typography.scale[control.id], bounds.min, bounds.max)}`}
            oninput={(event) => setScale(control.id, Number(event.currentTarget.value))}
          />
        </label>
      {/each}
    </div>
  </fieldset>

  <fieldset class="theme-typography-spacing">
    <legend>Line height and tracking</legend>
    <div>
      {#each roleControls as control (control.id)}
        <section aria-label={`${control.label} spacing`}>
          <strong>{control.label}</strong>
          <label>
            <span>Line height</span>
            <output>{roleValue(control.id).lineHeight.toFixed(2)}</output>
            <input
              data-pom-part="slider.input"
              aria-label={`${control.label} line height`}
              type="range"
              min="1"
              max="2.5"
              step="0.01"
              value={roleValue(control.id).lineHeight}
              style={`--pom-slider-progress:${compileSliderProgress(roleValue(control.id).lineHeight, 1, 2.5)}`}
              oninput={(event) => setRoleNumber(control.id, 'lineHeight', Number(event.currentTarget.value))}
            />
          </label>
          <label>
            <span>Tracking</span>
            <output>{roleValue(control.id).trackingEm.toFixed(3)}em</output>
            <input
              data-pom-part="slider.input"
              aria-label={`${control.label} tracking`}
              type="range"
              min="-0.1"
              max="0.25"
              step="0.005"
              value={roleValue(control.id).trackingEm}
              style={`--pom-slider-progress:${compileSliderProgress(roleValue(control.id).trackingEm, -0.1, 0.25)}`}
              oninput={(event) => setRoleNumber(control.id, 'trackingEm', Number(event.currentTarget.value))}
            />
          </label>
        </section>
      {/each}
    </div>
  </fieldset>

  {#if theme.authoring.diagnostics.length}
    <ul class="theme-authoring-diagnostics" aria-label="Theme diagnostics">
      {#each theme.authoring.diagnostics as diagnostic}<li>{diagnostic.message}</li>{/each}
    </ul>
  {/if}
  <p class="theme-authoring-status" role="status" aria-live="polite">{status}</p>
  <footer class="theme-authoring-actions">
    <button type="button" data-pom-part="button.surface" onclick={reset}>Reset typography</button>
    <button type="button" data-pom-part="button.surface" onclick={save} disabled={theme.authoring.diagnostics.length > 0 || theme.authoring.saving}>
      {theme.authoring.saving ? 'Saving…' : 'Save theme typography'}
    </button>
  </footer>
</div>
