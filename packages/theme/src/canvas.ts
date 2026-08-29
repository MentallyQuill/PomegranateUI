import type { ThemeCanvasLayer } from '@pomegranate-ui/contracts';
import type { ThemeAssetRegistry } from './assets.js';

export interface CanvasPresentationLayer {
  readonly kind: ThemeCanvasLayer['kind'];
  readonly order: number;
  readonly style: Readonly<Record<string, string>>;
}

export interface CanvasDiagnostic {
  readonly code: 'THEME_CANVAS_ASSET_MISSING' | 'THEME_CANVAS_ASSET_KIND_MISMATCH';
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export type CanvasCompilationResult =
  | { readonly ok: true; readonly layers: readonly CanvasPresentationLayer[]; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly CanvasDiagnostic[] };

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

function percentage(value: number): string {
  return `${formatNumber(value * 100)}%`;
}

function stops(layer: Extract<ThemeCanvasLayer, { stops: unknown }>): string {
  return layer.stops.map((stop) => `${stop.color} ${percentage(stop.position)}`).join(', ');
}

function cssUrl(source: string): string {
  const escaped = source.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replace(/[\r\n\f]/g, '');
  return `url("${escaped}")`;
}

function baseStyle(): Record<string, string> {
  return {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none'
  };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

export function compileCanvasLayers(
  theme: { readonly canvas: readonly ThemeCanvasLayer[] },
  registry: ThemeAssetRegistry = {}
): CanvasCompilationResult {
  const diagnostics: CanvasDiagnostic[] = [];
  const layers = theme.canvas.map((layer, order): CanvasPresentationLayer | null => {
    const style = baseStyle();
    switch (layer.kind) {
      case 'solid':
        style.backgroundColor = layer.color;
        break;
      case 'linear-gradient':
        style.backgroundImage = `linear-gradient(${formatNumber(layer.angle)}deg, ${stops(layer)})`;
        break;
      case 'radial-gradient':
        style.backgroundImage = `radial-gradient(${layer.shape} at ${percentage(layer.x)} ${percentage(layer.y)}, ${stops(layer)})`;
        break;
      case 'conic-gradient':
        style.backgroundImage = `conic-gradient(from ${formatNumber(layer.angle)}deg at ${percentage(layer.x)} ${percentage(layer.y)}, ${stops(layer)})`;
        break;
      case 'four-corner':
        style.backgroundImage = [
          `radial-gradient(circle at 0% 0%, ${layer.topLeft}, transparent 62%)`,
          `radial-gradient(circle at 100% 0%, ${layer.topRight}, transparent 62%)`,
          `radial-gradient(circle at 0% 100%, ${layer.bottomLeft}, transparent 62%)`,
          `radial-gradient(circle at 100% 100%, ${layer.bottomRight}, transparent 62%)`
        ].join(', ');
        break;
      case 'image': {
        const asset = registry[layer.assetId];
        if (!asset) {
          diagnostics.push({
            code: 'THEME_CANVAS_ASSET_MISSING',
            path: ['canvas', order, 'assetId'],
            message: `Canvas image '${layer.assetId}' is not registered by the host.`
          });
          return null;
        }
        if (asset.kind !== 'image') {
          diagnostics.push({
            code: 'THEME_CANVAS_ASSET_KIND_MISMATCH',
            path: ['canvas', order, 'assetId'],
            message: `Canvas image '${layer.assetId}' is registered as ${asset.kind}.`
          });
          return null;
        }
        style.backgroundImage = cssUrl(asset.source);
        style.backgroundRepeat = 'no-repeat';
        style.backgroundSize = layer.fit;
        style.backgroundPosition = `${percentage(layer.x)} ${percentage(layer.y)}`;
        style.opacity = formatNumber(layer.opacity);
        style.filter = `blur(${formatNumber(layer.blurPx)}px) saturate(${formatNumber(layer.saturation)})`;
        style.mixBlendMode = layer.blend;
        style.transform = layer.blurPx > 0 ? `scale(${formatNumber(1 + Math.min(0.08, layer.blurPx / 500))})` : 'none';
        break;
      }
      case 'texture': {
        const asset = registry[layer.assetId];
        if (!asset) {
          diagnostics.push({
            code: 'THEME_CANVAS_ASSET_MISSING',
            path: ['canvas', order, 'assetId'],
            message: `Canvas texture '${layer.assetId}' is not registered by the host.`
          });
          return null;
        }
        if (asset.kind !== 'texture') {
          diagnostics.push({
            code: 'THEME_CANVAS_ASSET_KIND_MISMATCH',
            path: ['canvas', order, 'assetId'],
            message: `Canvas texture '${layer.assetId}' is registered as ${asset.kind}.`
          });
          return null;
        }
        style.backgroundImage = cssUrl(asset.source);
        style.backgroundRepeat = 'repeat';
        style.opacity = formatNumber(layer.opacity);
        style.mixBlendMode = layer.blend;
        break;
      }
      case 'veil':
        if (layer.mode === 'vignette') {
          style.backgroundImage = `radial-gradient(ellipse at center, transparent 42%, ${layer.color} 100%)`;
          style.opacity = formatNumber(layer.opacity);
        } else {
          style.backgroundColor = layer.color;
          style.opacity = formatNumber(layer.opacity);
        }
        break;
    }
    return { kind: layer.kind, order, style };
  });

  if (diagnostics.length > 0) return { ok: false, diagnostics: deepFreeze(diagnostics) };
  return { ok: true, layers: deepFreeze(layers.filter((layer): layer is CanvasPresentationLayer => layer !== null)), diagnostics: [] };
}
