import type { ThemePartId, ThemePartRecipeV2 } from '@pomegranate-ui/contracts';
import type { ResolvedMaterialV2, ResolvedThemeV2 } from './resolve.js';

export interface ThemeMaterialOverrides {
  readonly materialOpacity?: Readonly<Record<string, number>>;
  readonly materialBlurPx?: Readonly<Record<string, number>>;
}

export interface ThemeUserPreferences extends ThemeMaterialOverrides {
  readonly reducedTransparency?: boolean;
}

export interface ThemeDevicePolicy {
  readonly reducedTransparency?: boolean;
  readonly backdropFilterSupported?: boolean;
  readonly maximumBlurPx?: number;
  readonly coarsePointer?: boolean;
}

export interface ThemePolicy {
  readonly runtime?: ThemeMaterialOverrides;
  readonly user?: ThemeUserPreferences;
  readonly device?: ThemeDevicePolicy;
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

function applyMaterialOverrides(
  id: string,
  source: ResolvedMaterialV2,
  policy: ThemePolicy
): ResolvedMaterialV2 {
  const runtimeOpacity = policy.runtime?.materialOpacity?.[id];
  const userOpacity = policy.user?.materialOpacity?.[id];
  const runtimeBlur = policy.runtime?.materialBlurPx?.[id];
  const userBlur = policy.user?.materialBlurPx?.[id];
  const opacity = userOpacity ?? runtimeOpacity;
  let blurPx = userBlur ?? runtimeBlur ?? source.backdrop.blurPx;
  if (policy.device?.maximumBlurPx !== undefined) {
    blurPx = Math.min(blurPx, clamp(policy.device.maximumBlurPx, 0, 80));
  }
  return {
    ...source,
    opacity: opacity === undefined ? source.opacity : clamp(opacity, 0, 1),
    backdrop: { ...source.backdrop, blurPx: clamp(blurPx, 0, 80) }
  };
}

export function applyThemePolicy(theme: ResolvedThemeV2, policy: ThemePolicy = {}): ResolvedThemeV2 {
  const materials = Object.fromEntries(Object.entries(theme.materials).map(([id, material]) => [
    id,
    applyMaterialOverrides(id, material, policy)
  ])) as Record<string, ResolvedMaterialV2>;
  const parts = Object.fromEntries(Object.entries(theme.recipes.parts).map(([id, recipe]) => [
    id,
    { ...recipe, states: { ...recipe.states } }
  ])) as ResolvedThemeV2['recipes']['parts'];

  const reduceTransparency = policy.user?.reducedTransparency === true
    || policy.device?.reducedTransparency === true
    || policy.device?.backdropFilterSupported === false;

  if (reduceTransparency) {
    const opaqueMaterial = (materialId: string): string => {
      const material = materials[materialId];
      if (!material || (material.opacity >= 1 && material.backdrop.blurPx === 0)) return materialId;
      const fallbackId = material.reducedTransparency;
      const fallback = materials[fallbackId];
      if (!fallback) return materialId;
      materials[fallbackId] = {
        ...fallback,
        opacity: 1,
        backdrop: { ...fallback.backdrop, blurPx: 0, saturation: 1, brightness: 1 }
      };
      return fallbackId;
    };

    for (const [partId, recipe] of Object.entries(parts) as [ThemePartId, typeof parts[ThemePartId]][]) {
      const states: ThemePartRecipeV2['states'] = { ...recipe.states };
      for (const state of ['hover', 'pressed', 'selected', 'focus', 'inactive'] as const) {
        const stateRecipe = states[state];
        if (stateRecipe) states[state] = {
          ...stateRecipe,
          ...(stateRecipe.material ? { material: opaqueMaterial(stateRecipe.material) } : {}),
          opacity: 1
        };
      }
      parts[partId] = {
        ...recipe,
        material: opaqueMaterial(recipe.material),
        states: { ...states, disabledOpacity: 1 }
      };
    }
  }

  const sliderHitTarget = policy.device?.coarsePointer
    ? Math.max(44, theme.accessibility.coarsePointerMinimum, theme.controls.slider.hitTargetPx)
    : theme.controls.slider.hitTargetPx;

  return deepFreeze({
    ...theme,
    materials,
    recipes: { ...theme.recipes, parts },
    controls: {
      ...theme.controls,
      slider: { ...theme.controls.slider, hitTargetPx: sliderHitTarget }
    }
  });
}
