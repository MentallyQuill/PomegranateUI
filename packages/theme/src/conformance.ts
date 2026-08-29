import { THEME_MATERIAL_ROLES } from '@pomegranate-ui/contracts';

import type { ResolvedTheme, ResolvedThemeV2 } from './resolve.js';

function parseHex(color: string): readonly [number, number, number, number] {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(color);
  if (!match) throw new TypeError(`Expected a #RRGGBB or #RRGGBBAA color, received '${color}'.`);
  const rgb = match[1]!;
  return [
    Number.parseInt(rgb.slice(0, 2), 16) / 255,
    Number.parseInt(rgb.slice(2, 4), 16) / 255,
    Number.parseInt(rgb.slice(4, 6), 16) / 255,
    match[2] ? Number.parseInt(match[2], 16) / 255 : 1
  ];
}

function linearChannel(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(red: number, green: number, blue: number): number {
  return 0.2126 * linearChannel(red) + 0.7152 * linearChannel(green) + 0.0722 * linearChannel(blue);
}

export function contrastRatio(foreground: string, background: string): number {
  const [backgroundRed, backgroundGreen, backgroundBlue, backgroundAlpha] = parseHex(background);
  if (backgroundAlpha !== 1) throw new TypeError('Contrast backgrounds must be opaque.');
  const [foregroundRed, foregroundGreen, foregroundBlue, foregroundAlpha] = parseHex(foreground);
  const red = foregroundRed * foregroundAlpha + backgroundRed * (1 - foregroundAlpha);
  const green = foregroundGreen * foregroundAlpha + backgroundGreen * (1 - foregroundAlpha);
  const blue = foregroundBlue * foregroundAlpha + backgroundBlue * (1 - foregroundAlpha);
  const foregroundLuminance = luminance(red, green, blue);
  const backgroundLuminance = luminance(backgroundRed, backgroundGreen, backgroundBlue);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

function opaqueComposite(background: string, canvas: string): string {
  const [red, green, blue, alpha] = parseHex(background);
  if (alpha === 1) return background.slice(0, 7);
  const [canvasRed, canvasGreen, canvasBlue, canvasAlpha] = parseHex(canvas);
  const baseRed = canvasRed * canvasAlpha + (1 - canvasAlpha);
  const baseGreen = canvasGreen * canvasAlpha + (1 - canvasAlpha);
  const baseBlue = canvasBlue * canvasAlpha + (1 - canvasAlpha);
  const channel = (foreground: number, base: number) => Math.round((foreground * alpha + base * (1 - alpha)) * 255)
    .toString(16).padStart(2, '0');
  return `#${channel(red, baseRed)}${channel(green, baseGreen)}${channel(blue, baseBlue)}`;
}

function visibleLuminance(color: string): number {
  const [red, green, blue, alpha] = parseHex(color);
  return luminance(
    red * alpha + (1 - alpha),
    green * alpha + (1 - alpha),
    blue * alpha + (1 - alpha)
  );
}

export interface ThemeContentColors {
  readonly normal: string;
  readonly large: string;
  readonly normalContrast: number;
  readonly largeContrast: number;
}

export function resolveMaterialContentColors(
  theme: Pick<ResolvedThemeV2, 'colors' | 'accessibility'>,
  material: Pick<ResolvedThemeV2['materials'][string], 'fallback' | 'contentTone'>
): ThemeContentColors {
  const background = opaqueComposite(material.fallback, theme.colors.canvas);
  const primaryCandidates = [theme.colors.text, theme.colors.textOnAccent] as const;
  const ordered = material.contentTone === 'auto'
    ? [...primaryCandidates].sort((left, right) => contrastRatio(right, background) - contrastRatio(left, background))
    : [...primaryCandidates].sort((left, right) => visibleLuminance(left) - visibleLuminance(right));
  const normal = material.contentTone === 'light' ? ordered.at(-1)!
    : material.contentTone === 'dark' ? ordered[0]!
      : ordered[0]!;
  const mutedContrast = contrastRatio(theme.colors.textMuted, background);
  const large = mutedContrast >= theme.accessibility.largeTextContrast ? theme.colors.textMuted : normal;
  return Object.freeze({
    normal,
    large,
    normalContrast: contrastRatio(normal, background),
    largeContrast: contrastRatio(large, background)
  });
}

export function collectThemeAssetIds(theme: ResolvedTheme | ResolvedThemeV2): readonly string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  const add = (id: string | undefined) => {
    if (id && !seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  };

  add(theme.iconPackId);
  if (theme.schemaVersion === 'pomegranate.ui.theme.v2') {
    for (const id of Object.keys(theme.assets)) add(id);
    for (const material of Object.values(theme.materials)) add(material.texture?.assetId);
  } else {
    for (const asset of theme.assets) add(asset.id);
    for (const role of THEME_MATERIAL_ROLES) add(theme.materials[role].textureAssetId);
  }
  for (const layer of theme.canvas) {
    if (layer.kind === 'image' || layer.kind === 'texture') add(layer.assetId);
  }
  return Object.freeze(ordered);
}
