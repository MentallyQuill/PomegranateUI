import type { ThemeDefinition, ThemeMaterialRole } from '@pomegranate-ui/contracts';
import { mergeTheme } from '@pomegranate-ui/theme';

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
  'pom-neutral': Object.freeze({ glassDensity: 50, barOpacity: 32, selectedStrength: 12, frostLevel: 70 }),
  bunny: Object.freeze({ glassDensity: 20, barOpacity: 60, selectedStrength: 6, frostLevel: 20 })
});

const GLASS_ROLES: readonly ThemeMaterialRole[] = Object.freeze([
  'panel', 'widget', 'menu', 'dialog', 'floating'
]);

export function defaultMaterialControls(id: LabThemeId): LabMaterialControls {
  return Object.freeze({ ...DEFAULTS[id] });
}

export function normalizeMaterialControl(value: number): number {
  return Math.round(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)));
}

export function projectMaterialControls(
  definition: ThemeDefinition,
  controls: LabMaterialControls
): ThemeDefinition {
  const glassOpacity = controls.glassDensity / 100;
  const barOpacity = controls.barOpacity / 100;
  const frostPx = Number((controls.frostLevel * 0.24).toFixed(1));
  const materials = Object.fromEntries([
    ['shelf', { opacity: barOpacity, blurPx: frostPx }],
    ...GLASS_ROLES.map((role) => [role, { opacity: glassOpacity, blurPx: frostPx }] as const)
  ]);
  return mergeTheme(definition, { materials });
}
