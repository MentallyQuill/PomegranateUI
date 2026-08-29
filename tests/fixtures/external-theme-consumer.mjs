import { compileCanvasLayers, compileThemeBindings, compileThemeStyleSheet, resolveThemeV2 } from '@pomegranate-ui/theme';
import { EXTERNAL_THEME } from './external-theme.ts';

export function compileExternalThemeFixture() {
  const resolution = resolveThemeV2(EXTERNAL_THEME, {
    'icons.external-fixture': { kind: 'icon-pack', source: 'icons.external-fixture' }
  });
  if (!resolution.ok) throw new Error(resolution.diagnostics.map(({ message }) => message).join('; '));
  const canvas = compileCanvasLayers(resolution.theme, resolution.theme.assets);
  if (!canvas.ok) throw new Error(canvas.diagnostics.map(({ message }) => message).join('; '));
  return Object.freeze({
    id: resolution.theme.id,
    bindings: compileThemeBindings(resolution.theme),
    cssText: compileThemeStyleSheet(resolution.theme),
    canvasLayers: canvas.layers
  });
}
