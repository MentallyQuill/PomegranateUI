import {
  AmbientProfileSchema,
  ThemeDraftSchema,
  ThemeTargetBundleSchema,
  type AmbientProfile,
  type ThemeDraft,
  type ThemeTargetBundle
} from '@pomegranate-ui/contracts';

import { mixHex, bestContrastingText } from './color.js';
import type { ThemeAssetRegistry } from './assets.js';
import { resolveThemeTarget } from './resolve-target.js';
import type { ThemeDiagnostic } from './resolve.js';

export type ThemeDraftProjection =
  | { readonly ok: true; readonly target: ThemeTargetBundle; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemeDiagnostic[] };

function schemaDiagnostics(issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[]): readonly ThemeDiagnostic[] {
  return Object.freeze(issues.map((issue) => Object.freeze({
    code: 'THEME_SCHEMA_INVALID' as const,
    path: Object.freeze(issue.path.map((part) => typeof part === 'number' ? part : String(part))),
    message: issue.message
  })));
}

function percentage(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 100);
}

function materialOpacity(target: ThemeTargetBundle, id: string, fallback: number): number {
  return percentage(target.theme.materials[id]?.opacity ?? fallback / 100);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

export function createThemeDraft(target: ThemeTargetBundle): ThemeDraft {
  const parsed = ThemeTargetBundleSchema.parse(target);
  return deepFreeze({
    schemaVersion: 'pomegranate.ui.theme-draft.v1',
    baseTargetId: parsed.id,
    colors: {
      canvas: parsed.theme.colors.canvas.slice(0, 7),
      glass: parsed.theme.colors.surface.slice(0, 7),
      chrome: parsed.theme.colors.chrome.slice(0, 7),
      ambient: parsed.theme.colors.accent.slice(0, 7),
      text: parsed.theme.colors.text.slice(0, 7),
      source: parsed.theme.colors.warning.slice(0, 7)
    },
    materials: {
      glassDensity: materialOpacity(parsed, 'pane', 50),
      barOpacity: materialOpacity(parsed, 'shelf', 60),
      selectedStrength: materialOpacity(parsed, 'selected', 12),
      frostLevel: percentage((parsed.theme.materials.pane?.backdrop.blurPx ?? 20) / 40)
    }
  });
}

function localAssetRegistry(target: ThemeTargetBundle): ThemeAssetRegistry {
  return Object.freeze(Object.fromEntries(target.theme.assets.map((asset) => [asset.id, Object.freeze({
    kind: asset.kind,
    source: asset.id
  })])));
}

export function projectThemeDraft(
  base: ThemeTargetBundle,
  draft: ThemeDraft,
  ambient: AmbientProfile
): ThemeDraftProjection {
  const parsedBase = ThemeTargetBundleSchema.safeParse(base);
  const parsedDraft = ThemeDraftSchema.safeParse(draft);
  const parsedAmbient = AmbientProfileSchema.safeParse(ambient);
  const issues = [
    ...(parsedBase.success ? [] : parsedBase.error.issues),
    ...(parsedDraft.success ? [] : parsedDraft.error.issues),
    ...(parsedAmbient.success ? [] : parsedAmbient.error.issues)
  ];
  if (issues.length > 0 || !parsedBase.success || !parsedDraft.success || !parsedAmbient.success) {
    return { ok: false, diagnostics: schemaDiagnostics(issues) };
  }
  if (parsedDraft.data.baseTargetId !== parsedBase.data.id || parsedAmbient.data.id !== parsedBase.data.id) {
    return {
      ok: false,
      diagnostics: schemaDiagnostics([{ path: ['baseTargetId'], message: 'Draft, ambient, and base target IDs must match.' }])
    };
  }

  const colors = parsedDraft.data.colors;
  const candidate = ThemeTargetBundleSchema.parse({
    ...parsedBase.data,
    theme: {
      ...parsedBase.data.theme,
      colors: {
        ...parsedBase.data.theme.colors,
        canvas: colors.canvas,
        surface: colors.glass,
        surfaceElevated: mixHex(colors.glass, colors.text, 0.08),
        surfaceInset: mixHex(colors.glass, colors.canvas, 0.18),
        chrome: colors.chrome,
        text: colors.text,
        textMuted: mixHex(colors.text, colors.glass, 0.30),
        textFaint: mixHex(colors.text, colors.glass, 0.45),
        textOnAccent: bestContrastingText(colors.ambient),
        accent: colors.ambient,
        selection: colors.ambient,
        focus: mixHex(colors.ambient, colors.text, 0.18),
        warning: colors.source
      }
    },
    canvas: {
      ...parsedBase.data.canvas,
      layers: parsedBase.data.canvas.layers.map((layer, index) => (
        index === 0 && layer.kind === 'solid' ? { ...layer, color: colors.canvas } : layer
      ))
    },
    ambient: { ...parsedAmbient.data, colorRole: 'accent' }
  });
  const resolution = resolveThemeTarget(candidate, localAssetRegistry(candidate));
  if (!resolution.ok) return resolution;
  return { ok: true, target: deepFreeze(candidate), diagnostics: [] };
}
