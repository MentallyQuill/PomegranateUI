import { describe, expect, it } from 'vitest';

import { POM_NEUTRAL_THEME } from './pom-neutral.js';
import { POMOS_PRESENTATION_PROFILE } from './pomos-presentation.js';

describe('PomOS fidelity data', () => {
  it('uses a crisp curved blue canvas instead of four-corner fog or hard polygon seams', () => {
    expect(POM_NEUTRAL_THEME.canvas.map((layer) => layer.kind)).not.toContain('four-corner');
    const gradients = POM_NEUTRAL_THEME.canvas.filter((layer) => 'stops' in layer);
    const curvedFields = POM_NEUTRAL_THEME.canvas.filter((layer) => layer.kind === 'radial-gradient');
    const alpha = (color: string) => color.length === 9 ? Number.parseInt(color.slice(7), 16) / 255 : 1;
    const luminousRings = curvedFields.filter((layer) => {
      const alphas = layer.stops.map((stop) => alpha(stop.color));
      return alphas[0]! <= 0.08 && alphas.at(-1)! <= 0.08 && Math.max(...alphas.slice(1, -1)) >= 0.6;
    });
    const luminousEdgeWidths = luminousRings.map((layer) => {
      const alphas = layer.stops.map((stop) => alpha(stop.color));
      const peakIndex = alphas.indexOf(Math.max(...alphas));
      return layer.stops[peakIndex]!.position - layer.stops[peakIndex - 1]!.position;
    });
    const hardTransitions = gradients.flatMap((layer) => layer.stops.slice(1).map((stop, index) => (
      stop.position - layer.stops[index]!.position
    ))).filter((distance) => distance <= 0.02);

    expect(gradients.length).toBeGreaterThanOrEqual(4);
    expect(curvedFields.length).toBeGreaterThanOrEqual(3);
    expect(luminousRings.length).toBeGreaterThanOrEqual(3);
    expect(luminousEdgeWidths.every((width) => width <= 0.08)).toBe(true);
    expect(hardTransitions).toHaveLength(0);
    expect(POMOS_PRESENTATION_PROFILE.canvas.blurPolicy).toBe('forbid');
  });

  it('layers translucent groups beneath brighter white controls and slider rails', () => {
    const pane = POM_NEUTRAL_THEME.materials.pane!;
    const header = POM_NEUTRAL_THEME.materials.header!;
    const content = POM_NEUTRAL_THEME.materials.content!;
    const row = POM_NEUTRAL_THEME.materials.row!;
    const field = POM_NEUTRAL_THEME.materials.field!;
    const button = POM_NEUTRAL_THEME.materials.button!;

    expect(pane.opacity).toBeGreaterThanOrEqual(0.24);
    expect(pane.opacity).toBeLessThanOrEqual(0.36);
    expect(pane.backdrop.blurPx).toBeGreaterThanOrEqual(28);
    expect(pane.shadows[0]?.opacity).toBeGreaterThanOrEqual(0.24);
    expect(header.opacity).toBeGreaterThan(content.opacity);
    expect(header.rim.opacity).toBeGreaterThanOrEqual(0.48);
    expect(content.opacity).toBeLessThanOrEqual(0.1);
    expect(row.opacity).toBeGreaterThan(content.opacity);
    expect(field.opacity).toBeGreaterThan(row.opacity);
    expect(button.opacity).toBeGreaterThan(field.opacity);
    expect(POM_NEUTRAL_THEME.materials.button).toMatchObject({ base: 'surfaceElevated' });
    expect(button.opacity).toBeGreaterThanOrEqual(0.68);
    expect(POM_NEUTRAL_THEME.materials.field).toMatchObject({ base: 'surfaceElevated' });
    expect(POM_NEUTRAL_THEME.materials.track).toMatchObject({ base: 'surfaceElevated' });
    expect(POM_NEUTRAL_THEME.materials.fill).toMatchObject({ base: 'surfaceElevated' });
    expect(POM_NEUTRAL_THEME.materials.thumb).toMatchObject({ base: 'surfaceElevated' });
    expect(POM_NEUTRAL_THEME.recipes.parts['group.surface']).toMatchObject({ material: 'pane', overflow: 'clip', elevation: 2 });
  });

  it('uses one continuous rounded geometry family for grouped controls', () => {
    const shapeNames = ['chrome', 'pane', 'header', 'content', 'group', 'row', 'field', 'button'] as const;
    for (const name of shapeNames) expect(POM_NEUTRAL_THEME.shapes[name]?.family).toBe('continuous-rounded');
    expect(POM_NEUTRAL_THEME.shapes.row?.radiusPx).toBe(POM_NEUTRAL_THEME.shapes.field?.radiusPx);
    expect(POM_NEUTRAL_THEME.shapes.field?.radiusPx).toBe(POM_NEUTRAL_THEME.shapes.button?.radiusPx);
    expect(POM_NEUTRAL_THEME.shapes.chrome?.radiusPx).toBeGreaterThan(POM_NEUTRAL_THEME.shapes.pane?.radiusPx ?? 0);
  });

  it('suppresses only the thumb face while retaining native geometry and a 44px target', () => {
    expect(POMOS_PRESENTATION_PROFILE.slider).toEqual({
      trackVisibility: 'visible',
      fillVisibility: 'visible',
      thumbVisibility: 'hidden'
    });
    expect(POMOS_PRESENTATION_PROFILE.actions).toEqual({ content: 'icon' });
    expect(POM_NEUTRAL_THEME.controls.slider).toEqual({
      trackPx: 4,
      thumbPx: 11,
      hitTargetPx: 44
    });
  });
});
