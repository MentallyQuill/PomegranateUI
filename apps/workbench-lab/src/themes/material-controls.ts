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
  'deep-current': Object.freeze({ glassDensity: 30, barOpacity: 60, selectedStrength: 6, frostLevel: 30 }),
  'pom-neutral': Object.freeze({ glassDensity: 42, barOpacity: 30, selectedStrength: 56, frostLevel: 70 }),
  bunny: Object.freeze({ glassDensity: 24, barOpacity: 28, selectedStrength: 62, frostLevel: 54 })
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
