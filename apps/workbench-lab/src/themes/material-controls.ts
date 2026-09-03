import type { ThemePolicy } from '@pomegranate-ui/theme';

import type { LabThemeId } from './presets.js';

export const LAB_MATERIAL_CONTROL_IDS = [
  'glassDensity',
  'barOpacity',
  'selectedStrength',
  'frostLevel'
] as const;

export type LabMaterialControlId = (typeof LAB_MATERIAL_CONTROL_IDS)[number];

export interface LabMaterialControls {
  readonly glassDensity: number;
  readonly barOpacity: number;
  readonly selectedStrength: number;
  readonly frostLevel: number;
}

const DEFAULTS: Readonly<Record<LabThemeId, LabMaterialControls>> = Object.freeze({
  'deep-current': Object.freeze({ glassDensity: 20, barOpacity: 60, selectedStrength: 6, frostLevel: 50 }),
  'pom-neutral': Object.freeze({ glassDensity: 42, barOpacity: 30, selectedStrength: 56, frostLevel: 70 }),
  bunny: Object.freeze({ glassDensity: 24, barOpacity: 72, selectedStrength: 62, frostLevel: 24 }),
  'ash-amber': Object.freeze({ glassDensity: 20, barOpacity: 60, selectedStrength: 6, frostLevel: 50 })
});

const GLASS_MATERIALS = ['pane', 'menu', 'dialog', 'floating'] as const;
const BAR_MATERIALS = ['shelf', 'context'] as const;
const FROSTED_MATERIALS = [...GLASS_MATERIALS, ...BAR_MATERIALS] as const;

export function defaultMaterialControls(id: LabThemeId): LabMaterialControls {
  return Object.freeze({ ...DEFAULTS[id] });
}

export function normalizeMaterialControl(value: number): number {
  return Math.round(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)));
}

export function materialControlPolicy(controls: LabMaterialControls): ThemePolicy {
  const opacity = (ids: readonly string[], value: number) => Object.fromEntries(ids.map((id) => [id, value / 100]));
  const blur = Object.fromEntries(FROSTED_MATERIALS.map((id) => [id, Number((controls.frostLevel * 0.4).toFixed(1))]));
  return {
    runtime: {
      materialOpacity: {
        ...opacity(GLASS_MATERIALS, controls.glassDensity),
        ...opacity(BAR_MATERIALS, controls.barOpacity),
        selected: controls.selectedStrength / 100
      },
      materialBlurPx: blur
    }
  };
}

function calibratedValue(value: number, authoredInput: number, authoredOutput: number, maximumOutput: number): number {
  const normalized = normalizeMaterialControl(value);
  if (normalized <= authoredInput) return authoredInput === 0 ? authoredOutput : authoredOutput * normalized / authoredInput;
  return authoredOutput + (maximumOutput - authoredOutput) * (normalized - authoredInput) / (100 - authoredInput);
}

function concise(value: number): string {
  return String(Number(value.toFixed(4)));
}

function parseHexColor(value: string): readonly [number, number, number] {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (!match) return [36, 76, 74];
  const [, red = '24', green = '4c', blue = '4a'] = match;
  return [Number.parseInt(red, 16), Number.parseInt(green, 16), Number.parseInt(blue, 16)];
}

function selectedFill(strength: number, selectionColor: string, authoredAlpha: number): string {
  const normalized = normalizeMaterialControl(strength);
  const authoredStrength = DEFAULTS['deep-current'].selectedStrength;
  const base = [17, 28, 27] as const;
  if (normalized <= authoredStrength) {
    return `rgb(${base.join(' ')} / ${concise(authoredAlpha * normalized / authoredStrength)})`;
  }
  const target = parseHexColor(selectionColor);
  const progress = (normalized - authoredStrength) / (100 - authoredStrength);
  const channels = base.map((channel, index) => concise(channel + ((target[index] ?? channel) - channel) * progress));
  const alpha = authoredAlpha + (1 - authoredAlpha) * progress;
  return `rgb(${channels.join(' ')} / ${concise(alpha)})`;
}

export function materialControlPresentationStyle(controls: LabMaterialControls, selectionColor: string): string {
  const defaults = DEFAULTS['deep-current'];
  const wideFrost = calibratedValue(controls.frostLevel, defaults.frostLevel, 12, 40);
  const mobileFrost = calibratedValue(controls.frostLevel, defaults.frostLevel, 18, 40);
  const mobileGlass = calibratedValue(controls.glassDensity, defaults.glassDensity, 0.88, 1);
  return [
    `--pom-presentation-instrumented-glass-fill:rgb(4 7 8 / ${concise(normalizeMaterialControl(controls.glassDensity) / 100)})`,
    `--pom-presentation-instrumented-mobile-glass-fill:rgb(4 7 8 / ${concise(mobileGlass)})`,
    `--pom-presentation-instrumented-bar-fill:rgb(11 18 19 / ${concise(normalizeMaterialControl(controls.barOpacity) / 100)})`,
    `--pom-presentation-instrumented-selected-fill:${selectedFill(controls.selectedStrength, selectionColor, 1)}`,
    `--pom-presentation-instrumented-mobile-selected-fill:${selectedFill(controls.selectedStrength, selectionColor, 0.82)}`,
    `--pom-presentation-instrumented-frost-backdrop:blur(${concise(wideFrost)}px) saturate(.82)`,
    `--pom-presentation-instrumented-mobile-frost-backdrop:blur(${concise(mobileFrost)}px) saturate(.82)`
  ].join(';');
}
