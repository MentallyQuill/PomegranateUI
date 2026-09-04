import type { ThemeDefinitionV2 } from '@pomegranate-ui/contracts';

export function themePreviewStyle(theme: Pick<ThemeDefinitionV2, 'colors' | 'shapes'>): string {
  const radius = Math.max(0, Math.min(18, theme.shapes.field?.radiusPx ?? theme.shapes.button?.radiusPx ?? 0));
  return [
    `background:linear-gradient(145deg, ${theme.colors.canvas} 0 48%, ${theme.colors.accent} 49% 53%, ${theme.colors.surfaceElevated} 54%)`,
    `border-radius:${radius}px`
  ].join(';');
}
