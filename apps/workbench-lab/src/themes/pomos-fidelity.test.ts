import { describe, expect, it } from 'vitest';

import { POM_NEUTRAL_THEME } from './pom-neutral.js';
import { POMOS_PRESENTATION_PROFILE } from './pomos-presentation.js';

describe('PomOS fidelity data', () => {
  it('uses a crisp structured blue canvas instead of a diffuse four-corner fog', () => {
    expect(POM_NEUTRAL_THEME.canvas.map((layer) => layer.kind)).not.toContain('four-corner');
    const gradients = POM_NEUTRAL_THEME.canvas.filter((layer) => 'stops' in layer);
    const hardTransitions = gradients.flatMap((layer) => layer.stops.slice(1).map((stop, index) => (
      stop.position - layer.stops[index]!.position
    ))).filter((distance) => distance <= 0.02);

    expect(gradients.length).toBeGreaterThanOrEqual(4);
    expect(hardTransitions.length).toBeGreaterThanOrEqual(6);
  });

  it('keeps grouped glass translucent while controls and slider rails use white target materials', () => {
    const pane = POM_NEUTRAL_THEME.materials.pane!;
    const button = POM_NEUTRAL_THEME.materials.button!;

    expect(pane.opacity).toBeLessThan(0.7);
    expect(pane.backdrop.blurPx).toBeGreaterThanOrEqual(20);
    expect(POM_NEUTRAL_THEME.materials.button).toMatchObject({ base: 'surfaceElevated' });
    expect(button.opacity).toBeGreaterThanOrEqual(0.72);
    expect(POM_NEUTRAL_THEME.materials.field).toMatchObject({ base: 'surfaceElevated' });
    expect(POM_NEUTRAL_THEME.materials.track).toMatchObject({ base: 'surfaceElevated' });
    expect(POM_NEUTRAL_THEME.materials.fill).toMatchObject({ base: 'surfaceElevated' });
    expect(POM_NEUTRAL_THEME.materials.thumb).toMatchObject({ base: 'surfaceElevated' });
  });

  it('suppresses only the thumb face while retaining native geometry and a 44px target', () => {
    expect(POMOS_PRESENTATION_PROFILE.slider).toEqual({
      trackVisibility: 'visible',
      fillVisibility: 'visible',
      thumbVisibility: 'hidden'
    });
    expect(POM_NEUTRAL_THEME.controls.slider).toEqual({
      trackPx: 4,
      thumbPx: 11,
      hitTargetPx: 44
    });
  });
});
