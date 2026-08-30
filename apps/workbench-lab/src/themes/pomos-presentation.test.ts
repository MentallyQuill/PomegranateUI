import { describe, expect, it } from 'vitest';

import { compilePresentationProfile } from '@pomegranate-ui/theme';
import { POM_NEUTRAL_TARGET } from './pom-neutral.js';
import { POMOS_PRESENTATION_PROFILE } from './pomos-presentation.js';

describe('POMOS_PRESENTATION_PROFILE', () => {
  it('opts into a sharp canvas, visible knobless rails, and eligible icon actions', () => {
    const result = compilePresentationProfile(POMOS_PRESENTATION_PROFILE, POM_NEUTRAL_TARGET.canvas);

    expect(result).toEqual({
      ok: true,
      profile: POMOS_PRESENTATION_PROFILE,
      bindings: {
        '--pom-presentation-slider-track-opacity': '1',
        '--pom-presentation-slider-fill-opacity': '1',
        '--pom-presentation-slider-thumb-opacity': '0',
        '--pom-presentation-action-icon-display': 'inline-grid',
        '--pom-presentation-action-label-display': 'none'
      },
      diagnostics: []
    });
    expect(POM_NEUTRAL_TARGET.theme.controls.slider.hitTargetPx).toBeGreaterThanOrEqual(44);
  });
});
