import { THEME_COLOR_ROLES, THEME_MATERIAL_ROLES, type ThemeCanvasLayer } from '@pomegranate-ui/contracts';
import type { ResolvedTheme } from '@pomegranate-ui/theme';

const GENERIC_FONT_FAMILIES = new Set([
  'cursive', 'fantasy', 'monospace', 'sans-serif', 'serif', 'system-ui',
  'ui-monospace', 'ui-rounded', 'ui-sans-serif', 'ui-serif'
]);

function kebab(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function decimal(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function percentage(value: number): string {
  return `${decimal(value * 100)}%`;
}

function withOpacity(color: string, opacity: number): string {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  const colorAlpha = color.length === 9 ? Number.parseInt(color.slice(7, 9), 16) / 255 : 1;
  return `rgb(${red} ${green} ${blue} / ${decimal(colorAlpha * opacity)})`;
}

function fontStack(family: string, fallbacks: readonly string[]): string {
  return [family, ...fallbacks].map((entry) => GENERIC_FONT_FAMILIES.has(entry)
    ? entry
    : `"${entry.replaceAll('"', '\\"')}"`).join(', ');
}

function stops(layer: Extract<ThemeCanvasLayer, { stops: unknown }>): string {
  return layer.stops.map((stop) => `${stop.color} ${percentage(stop.position)}`).join(', ');
}

function assetProperty(id: string): string {
  return `var(--pom-asset-${id.replaceAll('.', '-')})`;
}

function compileCanvasLayer(layer: ThemeCanvasLayer): string | null {
  switch (layer.kind) {
    case 'solid':
      return null;
    case 'linear-gradient':
      return `linear-gradient(${decimal(layer.angle)}deg, ${stops(layer)})`;
    case 'radial-gradient':
      return `radial-gradient(${layer.shape} at ${percentage(layer.x)} ${percentage(layer.y)}, ${stops(layer)})`;
    case 'conic-gradient':
      return `conic-gradient(from ${decimal(layer.angle)}deg at ${percentage(layer.x)} ${percentage(layer.y)}, ${stops(layer)})`;
    case 'four-corner':
      return [
        `radial-gradient(circle at 0% 0%, ${layer.topLeft}, transparent 62%)`,
        `radial-gradient(circle at 100% 0%, ${layer.topRight}, transparent 62%)`,
        `radial-gradient(circle at 0% 100%, ${layer.bottomLeft}, transparent 62%)`,
        `radial-gradient(circle at 100% 100%, ${layer.bottomRight}, transparent 62%)`
      ].join(', ');
    case 'image':
      return assetProperty(layer.assetId);
    case 'texture':
      return `linear-gradient(rgb(255 255 255 / ${decimal(layer.opacity)}), rgb(255 255 255 / ${decimal(layer.opacity)})), ${assetProperty(layer.assetId)}`;
    case 'veil':
      return layer.mode === 'vignette'
        ? `radial-gradient(ellipse at center, transparent 42%, ${withOpacity(layer.color, layer.opacity)} 100%)`
        : `linear-gradient(${withOpacity(layer.color, layer.opacity)}, ${withOpacity(layer.color, layer.opacity)})`;
  }
}

export function compileThemeBindings(theme: ResolvedTheme): string {
  const bindings: Array<readonly [string, string]> = [];
  const add = (name: string, value: string | number) => bindings.push([name, String(value)]);

  for (const role of THEME_COLOR_ROLES) add(`--pom-color-${kebab(role)}`, theme.colors[role]);

  for (const role of ['ui', 'prose', 'technical', 'display'] as const) {
    const typography = role === 'display' ? theme.typography.display ?? theme.typography.ui : theme.typography[role];
    add(`--pom-font-${role}`, fontStack(typography.family, typography.fallbacks));
    add(`--pom-font-${role}-weight`, typography.weight);
    add(`--pom-font-${role}-strong-weight`, typography.strongWeight);
    add(`--pom-font-${role}-line-height`, decimal(typography.lineHeight));
    add(`--pom-font-${role}-tracking`, `${decimal(typography.trackingEm)}em`);
  }
  for (const [step, size] of Object.entries(theme.typography.scale)) add(`--pom-type-${step}`, `${size}px`);

  add('--pom-radius-small', `${theme.geometry.cornerSm}px`);
  add('--pom-radius-widget', `${theme.geometry.cornerMd}px`);
  add('--pom-radius-large', `${theme.geometry.cornerLg}px`);
  add('--pom-radius-pill', `${theme.geometry.cornerPill}px`);
  add('--pom-border-width', `${theme.geometry.borderWidth}px`);
  add('--pom-focus-width', `${theme.geometry.focusWidth}px`);
  add('--pom-focus-offset', `${theme.geometry.focusOffset}px`);
  for (const step of ['xs', 'sm', 'md', 'lg', 'xl'] as const) add(`--pom-space-${step}`, `${theme.spacing[step]}px`);
  add('--pom-chrome-height', `${theme.spacing.chromeHeight}px`);

  for (const role of THEME_MATERIAL_ROLES) {
    const material = theme.materials[role];
    add(`--pom-material-${role}`, withOpacity(material.base, material.opacity));
    add(`--pom-material-${role}-fallback`, material.fallback);
    add(`--pom-material-${role}-blur`, `${material.blurPx}px`);
    add(`--pom-material-${role}-saturation`, decimal(material.saturation));
    add(`--pom-material-${role}-border`, material.border);
    add(`--pom-material-${role}-shadow`, `0 ${Math.max(6, Math.round(material.shadowBlurPx * 0.31))}px ${material.shadowBlurPx}px ${withOpacity(material.shadow, material.shadowOpacity)}`);
    add(`--pom-material-${role}-inset`, `inset 0 1px 0 rgb(255 255 255 / ${decimal(material.insetHighlight)})`);
  }

  const canvasColor = [...theme.canvas].reverse().find((layer) => layer.kind === 'solid');
  const canvasImages = theme.canvas.map(compileCanvasLayer).filter((layer): layer is string => layer !== null);
  add('--pom-canvas-color', canvasColor?.kind === 'solid' ? canvasColor.color : theme.colors.canvas);
  add('--pom-canvas', canvasImages.length > 0 ? canvasImages.join(', ') : 'none');

  return bindings
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value}`)
    .join(';');
}
