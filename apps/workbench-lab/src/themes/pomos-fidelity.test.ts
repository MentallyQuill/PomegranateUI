import { describe, expect, it } from 'vitest';

import { POM_NEUTRAL_THEME } from './pom-neutral.js';
import { POMOS_PRESENTATION_PROFILE } from './pomos-presentation.js';

describe('PomOS fidelity data', () => {
  it('uses a crisp local Tahoe-inspired image without procedural fog or canvas blur', () => {
    expect(POM_NEUTRAL_THEME.canvas.map((layer) => layer.kind)).not.toContain('four-corner');
    expect(POM_NEUTRAL_THEME.canvas.map((layer) => layer.kind)).not.toContain('radial-gradient');
    expect(POM_NEUTRAL_THEME.canvas.find((layer) => layer.kind === 'image')).toMatchObject({
      assetId: 'image.pomos-tahoe',
      fit: 'cover',
      opacity: 1,
      blurPx: 0
    });
    const gradients = POM_NEUTRAL_THEME.canvas.filter((layer) => 'stops' in layer);
    const hardTransitions = gradients.flatMap((layer) => layer.stops.slice(1).map((stop, index) => (
      stop.position - layer.stops[index]!.position
    ))).filter((distance) => distance <= 0.02);

    expect(gradients).toHaveLength(1);
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
