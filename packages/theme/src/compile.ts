import { THEME_COLOR_ROLES, THEME_PART_IDS, type ThemePartId, type ThemePartRecipeV2, type ThemeShapeV2 } from '@pomegranate-ui/contracts';
import { resolveMaterialContentColors } from './conformance.js';
import type { ResolvedMaterialV2, ResolvedThemeV2 } from './resolve.js';

export type ThemeBindings = Readonly<Record<string, string>>;

const GENERIC_FONT_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
  'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong'
]);

function partKey(part: ThemePartId): string {
  return part.replaceAll('.', '-');
}

function kebab(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

function rgba(color: string, opacity: number): string {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  const sourceAlpha = color.length === 9 ? Number.parseInt(color.slice(7, 9), 16) / 255 : 1;
  return `rgba(${red}, ${green}, ${blue}, ${formatNumber(sourceAlpha * opacity)})`;
}

function fontFamily(name: string): string {
  return GENERIC_FONT_FAMILIES.has(name.toLowerCase()) ? name : `"${name.replaceAll('"', '\\"')}"`;
}

function compileFont(theme: ResolvedThemeV2, recipe: ThemePartRecipeV2): string {
  const role = recipe.typography === 'display'
    ? theme.typography.display ?? theme.typography.ui
    : theme.typography[recipe.typography];
  return [role.family, ...role.fallbacks].map(fontFamily).join(', ');
}

function compileRadius(shape: ThemeShapeV2): string {
  if (shape.family === 'none' || shape.family === 'square') return '0px';
  const radius = shape.family === 'pill' ? '999px' : `${formatNumber(shape.radiusPx)}px`;
  const suppressed = new Set(shape.joinedEdges);
  const topLeft = suppressed.has('top') || suppressed.has('left') ? '0px' : radius;
  const topRight = suppressed.has('top') || suppressed.has('right') ? '0px' : radius;
  const bottomRight = suppressed.has('bottom') || suppressed.has('right') ? '0px' : radius;
  const bottomLeft = suppressed.has('bottom') || suppressed.has('left') ? '0px' : radius;
  return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
}

function compileClipPath(shape: ThemeShapeV2): string {
  if (shape.family !== 'chamfered' || shape.chamferPx === 0) return 'none';
  const horizontalCut = `${formatNumber(shape.chamferPx)}px`;
  const verticalCut = `${formatNumber(shape.chamferPx * Math.tan(shape.chamferAngleDeg * Math.PI / 180))}px`;
  return `polygon(${horizontalCut} 0, calc(100% - ${horizontalCut}) 0, 100% ${verticalCut}, 100% calc(100% - ${verticalCut}), calc(100% - ${horizontalCut}) 100%, ${horizontalCut} 100%, 0 calc(100% - ${verticalCut}), 0 ${verticalCut})`;
}

function compileJoinedBorderWidth(shape: ThemeShapeV2, widthPx: number): string {
  const joined = new Set(shape.joinedEdges);
  return ['top', 'right', 'bottom', 'left']
    .map((edge) => `${formatNumber(joined.has(edge as 'top' | 'right' | 'bottom' | 'left') ? 0 : widthPx)}px`)
    .join(' ');
}

function cssUrl(source: string): string {
  const escaped = source.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replace(/[\r\n\f]/g, '');
  return `url("${escaped}")`;
}

function compileTexture(theme: ResolvedThemeV2, material: ResolvedMaterialV2): {
  readonly image: string;
  readonly opacity: string;
  readonly blend: string;
} {
  if (!material.texture) return { image: 'none', opacity: '0', blend: 'normal' };
  const registration = theme.assets[material.texture.assetId];
  if (!registration || registration.kind !== 'texture') {
    throw new Error(`Resolved theme is missing texture '${material.texture.assetId}'.`);
  }
  const veil = rgba(material.base, Math.max(0, 1 - material.texture.opacity));
  return {
    image: `linear-gradient(${veil}, ${veil}), ${cssUrl(registration.source)}`,
    opacity: formatNumber(material.texture.opacity),
    blend: `normal, ${material.texture.blend}`
  };
}

function compileShadow(material: ResolvedMaterialV2): string {
  const angle = material.rim.angleDeg * Math.PI / 180;
  const rimX = formatNumber(Math.cos(angle));
  const rimY = formatNumber(Math.sin(angle));
  const layers = material.shadows.map((shadow) => [
    shadow.inset ? 'inset ' : '',
    `${formatNumber(shadow.x)}px ${formatNumber(shadow.y)}px ${formatNumber(shadow.blurPx)}px ${formatNumber(shadow.spreadPx)}px `,
    rgba(shadow.color, shadow.opacity)
  ].join(''));
  if (material.rim.opacity > 0) {
    layers.unshift(`inset ${rimX}px ${rimY}px 0 0 ${rgba(material.rim.color, material.rim.opacity)}`);
  }
  return layers.length > 0 ? layers.join(', ') : 'none';
}

function assignPartBindings(
  bindings: Record<string, string>,
  theme: ResolvedThemeV2,
  part: ThemePartId,
  recipe: ThemePartRecipeV2
): void {
  const key = partKey(part);
  const material = theme.materials[recipe.material];
  const shape = theme.shapes[recipe.shape];
  if (!material || !shape) throw new Error(`Resolved theme is missing dependencies for part '${part}'.`);
  const prefix = `--pom-part-${key}`;
  const content = resolveMaterialContentColors(theme, material);
  const texture = compileTexture(theme, material);
  bindings[`${prefix}-material-fill`] = rgba(material.base, material.opacity);
  bindings[`${prefix}-material-fallback`] = material.fallback;
  bindings[`${prefix}-material-border`] = `${formatNumber(material.border.widthPx)}px solid ${rgba(material.border.color, material.border.opacity)}`;
  bindings[`${prefix}-material-backdrop`] = material.backdrop.blurPx === 0
    ? 'none'
    : `blur(${formatNumber(material.backdrop.blurPx)}px) saturate(${formatNumber(material.backdrop.saturation)}) brightness(${formatNumber(material.backdrop.brightness)})`;
  bindings[`${prefix}-material-shadow`] = compileShadow(material);
  bindings[`${prefix}-radius`] = compileRadius(shape);
  bindings[`${prefix}-clip-path`] = compileClipPath(shape);
  bindings[`${prefix}-joined-border-width`] = compileJoinedBorderWidth(shape, material.border.widthPx);
  bindings[`${prefix}-foreground`] = content.normal;
  bindings[`${prefix}-foreground-large`] = content.large;
  bindings[`${prefix}-texture-image`] = texture.image;
  bindings[`${prefix}-texture-opacity`] = texture.opacity;
  bindings[`${prefix}-texture-blend`] = texture.blend;
  bindings[`${prefix}-font-family`] = compileFont(theme, recipe);
  bindings[`${prefix}-font-weight`] = String((recipe.typography === 'display' ? theme.typography.display ?? theme.typography.ui : theme.typography[recipe.typography]).weight);
  bindings[`${prefix}-spacing`] = `${formatNumber(theme.spacing[recipe.spacing])}px`;
  bindings[`${prefix}-overflow`] = recipe.overflow === 'scroll' ? 'auto' : recipe.overflow;
  bindings[`${prefix}-disabled-opacity`] = formatNumber(recipe.states.disabledOpacity);
  bindings[`${prefix}-elevation`] = String(recipe.elevation);
  bindings[`${prefix}-separator`] = recipe.separator;
  bindings[`${prefix}-separator-width`] = recipe.separator === 'hairline'
    ? '1px'
    : `${formatNumber(material.border.widthPx)}px`;
  bindings[`${prefix}-separator-color`] = rgba(material.border.color, material.border.opacity);
  bindings[`${prefix}-separator-space`] = recipe.separator === 'space' ? bindings[`${prefix}-spacing`]! : '0px';
  for (const state of ['hover', 'pressed', 'selected', 'focus', 'inactive'] as const) {
    const stateRecipe = recipe.states[state];
    const stateMaterial = theme.materials[stateRecipe?.material ?? recipe.material];
    if (!stateMaterial) throw new Error(`Resolved theme is missing the ${state} material for part '${part}'.`);
    bindings[`${prefix}-state-${state}-fill`] = rgba(stateMaterial.base, stateMaterial.opacity);
    bindings[`${prefix}-state-${state}-opacity`] = formatNumber(stateRecipe?.opacity ?? 1);
    bindings[`${prefix}-state-${state}-foreground`] = resolveMaterialContentColors(theme, stateMaterial).normal;
  }
}

export function compileSliderProgress(value: number, minimum: number, maximum: number): string {
  if (![value, minimum, maximum].every(Number.isFinite) || maximum <= minimum) return '0%';
  const progress = Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)));
  return `${formatNumber(progress * 100)}%`;
}

export function compileThemeBindings(theme: ResolvedThemeV2): ThemeBindings {
  const bindings: Record<string, string> = {
    '--pom-color-text': theme.colors.text,
    '--pom-color-text-muted': theme.colors.textMuted,
    '--pom-color-focus': theme.colors.focus,
    '--pom-focus-width': '2px',
    '--pom-focus-offset': '2px',
    '--pom-widget-grouping': theme.recipes.widgetGrouping,
    '--pom-chrome-presentation': theme.recipes.chromePresentation,
    '--pom-action-presentation': theme.recipes.actionPresentation,
    '--pom-control-slider-track-size': `${formatNumber(theme.controls.slider.trackPx)}px`,
    '--pom-control-slider-thumb-size': `${formatNumber(theme.controls.slider.thumbPx)}px`,
    '--pom-control-slider-hit-size': `${formatNumber(theme.controls.slider.hitTargetPx)}px`
  };
  for (const role of THEME_COLOR_ROLES) bindings[`--pom-color-${kebab(role)}`] = theme.colors[role];
  for (const role of ['ui', 'prose', 'technical', 'display'] as const) {
    const typography = role === 'display' ? theme.typography.display ?? theme.typography.ui : theme.typography[role];
    bindings[`--pom-font-${role}`] = [typography.family, ...typography.fallbacks].map(fontFamily).join(', ');
    bindings[`--pom-font-${role}-weight`] = String(typography.weight);
    bindings[`--pom-font-${role}-strong-weight`] = String(typography.strongWeight);
    bindings[`--pom-font-${role}-line-height`] = formatNumber(typography.lineHeight);
    bindings[`--pom-font-${role}-tracking`] = `${formatNumber(typography.trackingEm)}em`;
  }
  for (const [step, size] of Object.entries(theme.typography.scale)) bindings[`--pom-type-${step}`] = `${formatNumber(size)}px`;
  for (const step of ['xs', 'sm', 'md', 'lg', 'xl'] as const) bindings[`--pom-space-${step}`] = `${formatNumber(theme.spacing[step])}px`;
  bindings['--pom-chrome-height'] = `${formatNumber(theme.spacing.chromeHeight)}px`;
  const fallbackShape = theme.shapes.pane ?? Object.values(theme.shapes)[0]!;
  bindings['--pom-radius-small'] = compileRadius(theme.shapes.row ?? theme.shapes.button ?? fallbackShape);
  bindings['--pom-radius-widget'] = compileRadius(theme.shapes.pane ?? fallbackShape);
  bindings['--pom-radius-large'] = compileRadius(theme.shapes.chrome ?? theme.shapes.pane ?? fallbackShape);
  bindings['--pom-radius-pill'] = compileRadius(theme.shapes.pill ?? fallbackShape);
  bindings['--pom-border-width'] = `${formatNumber(theme.materials.pane?.border.widthPx ?? 1)}px`;
  const solid = theme.canvas.find((layer) => layer.kind === 'solid');
  bindings['--pom-canvas-color'] = solid?.kind === 'solid' ? solid.color : theme.colors.canvas;
  bindings['--pom-canvas'] = 'none';
  bindings['--pom-atmosphere-one'] = theme.colors.danger;
  bindings['--pom-atmosphere-two'] = theme.colors.success;
  bindings['--pom-atmosphere-three'] = theme.colors.accent;
  const compatibilityMaterials = {
    shelf: 'shelf', panel: 'panel', widget: 'pane', field: 'field',
    button: 'button', menu: 'menu', dialog: 'dialog', floating: 'floating'
  } as const;
  const firstMaterial = Object.values(theme.materials)[0]!;
  for (const [legacy, materialId] of Object.entries(compatibilityMaterials)) {
    const material = theme.materials[materialId] ?? firstMaterial;
    bindings[`--pom-material-${legacy}`] = rgba(material.base, material.opacity);
    bindings[`--pom-material-${legacy}-fallback`] = material.fallback;
    bindings[`--pom-material-${legacy}-fallback-surface`] = rgba(material.fallback, Math.min(1, material.opacity + 0.04));
    bindings[`--pom-material-${legacy}-blur`] = `${formatNumber(material.backdrop.blurPx)}px`;
    bindings[`--pom-material-${legacy}-saturation`] = formatNumber(material.backdrop.saturation);
    bindings[`--pom-material-${legacy}-border`] = rgba(material.border.color, material.border.opacity);
    bindings[`--pom-material-${legacy}-shadow`] = compileShadow(material);
    bindings[`--pom-material-${legacy}-inset`] = material.rim.opacity > 0
      ? `inset 0 1px 0 ${rgba(material.rim.color, material.rim.opacity)}`
      : 'none';
  }
  const textRed = Number.parseInt(theme.colors.text.slice(1, 3), 16);
  const textGreen = Number.parseInt(theme.colors.text.slice(3, 5), 16);
  const textBlue = Number.parseInt(theme.colors.text.slice(5, 7), 16);
  const lightText = 0.2126 * textRed + 0.7152 * textGreen + 0.0722 * textBlue > 150;
  bindings['--pom-icon-filter'] = lightText ? 'invert(.72)' : 'none';
  bindings['--pom-icon-filter-hover'] = lightText ? 'invert(.9)' : 'none';
  for (const part of THEME_PART_IDS) assignPartBindings(bindings, theme, part, theme.recipes.parts[part]);
  return Object.freeze(bindings);
}

function partRule(part: ThemePartId): string {
  const key = partKey(part);
  const selector = `[data-pom-theme-root] [data-pom-part="${part}"]`;
  const prefix = `--pom-part-${key}`;
  return `${selector} {
  color: var(${prefix}-foreground);
  background-color: var(${prefix}-material-fallback);
  background-color: var(${prefix}-material-fill);
  background-image: var(--pom-expression-${key}-background-image, var(${prefix}-texture-image));
  background-blend-mode: var(${prefix}-texture-blend);
  border: var(${prefix}-material-border);
  border-width: var(${prefix}-joined-border-width);
  border-block-end-width: var(${prefix}-separator-width);
  border-block-end-color: var(${prefix}-separator-color);
  margin-block-end: var(${prefix}-separator-space);
  border-radius: var(--pom-expression-${key}-radius, var(${prefix}-radius));
  -webkit-backdrop-filter: var(${prefix}-material-backdrop);
  backdrop-filter: var(${prefix}-material-backdrop);
  box-shadow: var(${prefix}-material-shadow);
  clip-path: var(${prefix}-clip-path);
  font-family: var(${prefix}-font-family);
  font-weight: var(${prefix}-font-weight);
  overflow: var(${prefix}-overflow);
  z-index: var(${prefix}-elevation);
}
:where(${selector}) {
  font-size: var(--pom-expression-${key}-font-size, inherit);
  line-height: var(--pom-expression-${key}-line-height, inherit);
  letter-spacing: var(--pom-expression-${key}-letter-spacing, inherit);
  text-transform: var(--pom-expression-${key}-text-transform, inherit);
}
${selector}[data-pom-spacing="recipe"] { gap: var(${prefix}-spacing); padding: var(${prefix}-spacing); }
${selector}:hover { color: var(${prefix}-state-hover-foreground); background-color: var(${prefix}-state-hover-fill); opacity: var(${prefix}-state-hover-opacity); }
${selector}:active { color: var(${prefix}-state-pressed-foreground); background-color: var(${prefix}-state-pressed-fill); opacity: var(${prefix}-state-pressed-opacity); }
${selector}[aria-selected="true"], ${selector}[aria-pressed="true"], ${selector}[aria-current]:not([aria-current="false"]), ${selector}[data-pom-selected="true"] { color: var(${prefix}-state-selected-foreground); background-color: var(${prefix}-state-selected-fill); opacity: var(${prefix}-state-selected-opacity); }
${selector}:focus-visible { color: var(${prefix}-state-focus-foreground); background-color: var(${prefix}-state-focus-fill); opacity: var(${prefix}-state-focus-opacity); outline: var(--pom-focus-width) solid var(--pom-color-focus); outline-offset: var(--pom-focus-offset); }
${selector}[inert], ${selector}[data-pom-inactive="true"] { color: var(${prefix}-state-inactive-foreground); background-color: var(${prefix}-state-inactive-fill); opacity: var(${prefix}-state-inactive-opacity); }
${selector}:disabled, ${selector}[aria-disabled="true"] { opacity: var(${prefix}-disabled-opacity); }`;
}

export const POM_SEMANTIC_PART_STYLE_SHEET = `${THEME_PART_IDS.map(partRule).join('\n\n')}

[data-pom-theme-root] [data-pom-part="slider.input"] {
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  min-height: var(--pom-control-slider-hit-size);
  background-color: transparent;
  background-image: linear-gradient(to right, color-mix(in srgb, var(--pom-part-slider-fill-material-fill) calc(var(--pom-presentation-slider-fill-opacity, 1) * 100%), transparent) 0 var(--pom-slider-progress, 0%), color-mix(in srgb, var(--pom-part-slider-track-material-fill) calc(var(--pom-presentation-slider-track-opacity, 1) * 100%), transparent) var(--pom-slider-progress, 0%) 100%);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% var(--pom-control-slider-track-size);
  border: 0;
  box-shadow: none;
}
[data-pom-theme-root] [data-pom-part="slider.input"]:hover,
[data-pom-theme-root] [data-pom-part="slider.input"]:active,
[data-pom-theme-root] [data-pom-part="slider.input"]:focus-visible {
  background-color: transparent;
}
[data-pom-theme-root] [data-pom-part="slider.input"]::-webkit-slider-runnable-track {
  height: var(--pom-control-slider-track-size);
  background: transparent;
  border: var(--pom-part-slider-track-material-border);
  border-radius: var(--pom-part-slider-track-radius);
}
[data-pom-theme-root] [data-pom-part="slider.input"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: var(--pom-control-slider-thumb-size);
  height: var(--pom-control-slider-thumb-size);
  margin-top: calc((var(--pom-control-slider-track-size) - var(--pom-control-slider-thumb-size)) / 2);
  background: var(--pom-part-slider-thumb-material-fill);
  border: var(--pom-part-slider-thumb-material-border);
  border-radius: var(--pom-part-slider-thumb-radius);
  box-shadow: var(--pom-part-slider-thumb-material-shadow);
  opacity: var(--pom-presentation-slider-thumb-opacity, 1);
}
[data-pom-theme-root] [data-pom-part="slider.input"]::-moz-range-track {
  height: var(--pom-control-slider-track-size);
  background: color-mix(in srgb, var(--pom-part-slider-track-material-fill) calc(var(--pom-presentation-slider-track-opacity, 1) * 100%), transparent);
  border: var(--pom-part-slider-track-material-border);
  border-radius: var(--pom-part-slider-track-radius);
}
[data-pom-theme-root] [data-pom-part="slider.input"]::-moz-range-progress {
  height: var(--pom-control-slider-track-size);
  background: color-mix(in srgb, var(--pom-part-slider-fill-material-fill) calc(var(--pom-presentation-slider-fill-opacity, 1) * 100%), transparent);
  border-radius: var(--pom-part-slider-fill-radius);
}
[data-pom-theme-root] [data-pom-part="slider.input"]::-moz-range-thumb {
  width: var(--pom-control-slider-thumb-size);
  height: var(--pom-control-slider-thumb-size);
  background: var(--pom-part-slider-thumb-material-fill);
  border: var(--pom-part-slider-thumb-material-border);
  border-radius: var(--pom-part-slider-thumb-radius);
  box-shadow: var(--pom-part-slider-thumb-material-shadow);
  opacity: var(--pom-presentation-slider-thumb-opacity, 1);
}`;

export function compileThemeStyleSheet(theme: ResolvedThemeV2): string {
  const declarations = Object.entries(compileThemeBindings(theme))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');
  return `[data-pom-theme-root] {\n${declarations}\n}\n\n${POM_SEMANTIC_PART_STYLE_SHEET}\n`;
}
