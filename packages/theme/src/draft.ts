import {
  AmbientProfileSchema,
  ThemeDraftSchema,
  ThemeTargetBundleSchema,
  type AmbientProfile,
  type ThemeCanvasDraft,
  type ThemeDraft,
  type ThemeTargetBundle
} from '@pomegranate-ui/contracts';

import { mixHex, bestContrastingText } from './color.js';
import { contrastRatio } from './conformance.js';
import type { ThemeAssetRegistry } from './assets.js';
import { resolveThemeTarget } from './resolve-target.js';
import type { ThemeDiagnostic } from './resolve.js';
import {
  resolveThemeCanvasAuthoringProfile,
  type ThemeCanvasAuthoringProfile,
  type ThemeCanvasAvailability
} from './semantic-canvas.js';

export type ThemeDraftProjection =
  | { readonly ok: true; readonly target: ThemeTargetBundle; readonly canvasAvailability: ThemeCanvasAvailability; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemeDiagnostic[] };

export const DEFAULT_THEME_CANVAS_DRAFT: ThemeCanvasDraft = Object.freeze({
  imageStrength: 100,
  overlayStrength: 100,
  gradientAngle: 0,
  vignetteStrength: 100
});

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

export function createThemeDraft(
  target: ThemeTargetBundle,
  canvas: ThemeCanvasDraft = DEFAULT_THEME_CANVAS_DRAFT
): ThemeDraft {
  const parsed = ThemeTargetBundleSchema.parse(target);
  return deepFreeze({
    schemaVersion: 'pomegranate.ui.theme-draft.v2',
    baseTargetId: parsed.id,
    colors: {
      canvas: parsed.theme.colors.canvas.slice(0, 7),
      glass: parsed.theme.colors.surface.slice(0, 7),
      chrome: parsed.theme.colors.chrome.slice(0, 7),
      ambient: parsed.theme.colors[parsed.ambient.colorRole].slice(0, 7),
      text: parsed.theme.colors.text.slice(0, 7),
      source: parsed.theme.colors.warning.slice(0, 7)
    },
    materials: {
      glassDensity: materialOpacity(parsed, 'pane', 50),
      barOpacity: materialOpacity(parsed, 'shelf', 60),
      selectedStrength: materialOpacity(parsed, 'selected', 12),
      frostLevel: percentage((parsed.theme.materials.pane?.backdrop.blurPx ?? 20) / 40)
    },
    canvas,
    toolbarTogglePresentation: parsed.theme.recipes.toolbarTogglePresentation ?? 'edge-labels'
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
  ambient: AmbientProfile,
  canvasProfile?: ThemeCanvasAuthoringProfile
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
  const seedColors = createThemeDraft(parsedBase.data).colors;
  const changed = Object.fromEntries(Object.keys(colors).map((role) => [
    role,
    colors[role as keyof typeof colors].toLowerCase() !== seedColors[role as keyof typeof seedColors].toLowerCase()
  ])) as Record<keyof typeof colors, boolean>;
  const ambientRole = parsedAmbient.data.colorRole;
  const ambientColorOverrides = (changed.ambient || changed.text) && ambientRole === 'accent'
    ? {
        textOnAccent: bestContrastingText(colors.ambient),
        accent: colors.ambient,
        selection: colors.ambient,
        focus: mixHex(colors.ambient, colors.text, 0.18)
      }
    : changed.ambient ? { [ambientRole]: colors.ambient } : {};
  const projectedColors = {
    ...parsedBase.data.theme.colors,
    ...(changed.canvas ? { canvas: colors.canvas } : {}),
    ...(changed.glass ? { surface: colors.glass } : {}),
    ...(changed.glass || changed.text ? { surfaceElevated: mixHex(colors.glass, colors.text, 0.08) } : {}),
    ...(changed.glass || changed.canvas ? { surfaceInset: mixHex(colors.glass, colors.canvas, 0.18) } : {}),
    ...(changed.chrome ? { chrome: colors.chrome } : {}),
    ...(changed.text ? { text: colors.text } : {}),
    ...(changed.text || changed.glass ? {
      textMuted: mixHex(colors.text, colors.glass, 0.30),
      textFaint: mixHex(colors.text, colors.glass, 0.45)
    } : {}),
    ...(changed.source ? { warning: colors.source } : {}),
    ...ambientColorOverrides
  };
  const canvasProjection = canvasProfile
    ? resolveThemeCanvasAuthoringProfile(projectedColors, canvasProfile, parsedDraft.data.canvas)
    : null;
  if (canvasProjection && !canvasProjection.ok) {
    return {
      ok: false,
      diagnostics: Object.freeze(canvasProjection.diagnostics.map((entry) => Object.freeze({
        code: 'THEME_SCHEMA_INVALID' as const,
        path: Object.freeze(['canvas', ...entry.path]),
        message: entry.message
      })))
    };
  }
  const canvasAvailability: ThemeCanvasAvailability = canvasProjection
    ? canvasProjection.availability
    : Object.freeze({ image: false, overlay: false, gradient: false, vignette: false });
  const candidate = ThemeTargetBundleSchema.parse({
    ...parsedBase.data,
    theme: {
      ...parsedBase.data.theme,
      colors: projectedColors,
      recipes: {
        ...parsedBase.data.theme.recipes,
        toolbarTogglePresentation: parsedDraft.data.toolbarTogglePresentation
          ?? parsedBase.data.theme.recipes.toolbarTogglePresentation
          ?? 'edge-labels'
      }
    },
    canvas: {
      ...parsedBase.data.canvas,
      layers: canvasProjection?.layers ?? parsedBase.data.canvas.layers.map((layer, index) => (
        index === 0 && layer.kind === 'solid' ? { ...layer, color: colors.canvas } : layer
      ))
    },
    ambient: parsedAmbient.data
  });
  const unsafeBackgrounds = [
    { role: 'canvas', background: colors.canvas, changed: changed.canvas },
    { role: 'glass', background: colors.glass, changed: changed.glass },
    { role: 'chrome', background: colors.chrome, changed: changed.chrome }
  ].filter(({ background, changed: backgroundChanged }) => (
    (changed.text || backgroundChanged)
    &&
    contrastRatio(colors.text, background) < candidate.theme.accessibility.minimumContrast
  ));
  if (unsafeBackgrounds.length > 0) {
    return {
      ok: false,
      diagnostics: Object.freeze([Object.freeze({
        code: 'THEME_CONTRAST_UNSAFE' as const,
        path: Object.freeze(['colors', 'text']),
        message: `Authored text does not meet the ${candidate.theme.accessibility.minimumContrast}:1 contrast floor against ${unsafeBackgrounds.map(({ role }) => role).join(', ')}.`
      })])
    };
  }
  const resolution = resolveThemeTarget(candidate, localAssetRegistry(candidate));
  if (!resolution.ok) return resolution;
  return { ok: true, target: deepFreeze(candidate), canvasAvailability, diagnostics: [] };
}
