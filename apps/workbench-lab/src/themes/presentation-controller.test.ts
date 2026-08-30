import { describe, expect, it } from 'vitest';

import { createLabThemeController } from './controller.js';
import { DEEP_CURRENT_TARGET } from './deep-current.js';
import { POM_NEUTRAL_TARGET } from './pom-neutral.js';
import { POMOS_PRESENTATION_PROFILE } from './pomos-presentation.js';

describe('Lab presentation profile integration', () => {
  it('switches the profile bindings atomically with the target over one controller', () => {
    const controller = createLabThemeController({ initialId: 'deep-current' });
    const legacy = controller.getSnapshot();

    expect(legacy.presentation.id).toBe('default-presentation');
    expect(legacy.presentationBindings).toEqual({
      '--pom-presentation-slider-track-opacity': '1',
      '--pom-presentation-slider-fill-opacity': '1',
      '--pom-presentation-slider-thumb-opacity': '1',
      '--pom-presentation-action-icon-display': 'none',
      '--pom-presentation-action-label-display': 'inline'
    });

    const activation = controller.activate('pom-neutral');
    expect(activation.ok).toBe(true);
    if (!activation.ok) return;
    expect(activation.snapshot.presentation).toEqual(POMOS_PRESENTATION_PROFILE);
    expect(activation.snapshot.presentationBindings).toEqual({
      '--pom-presentation-slider-track-opacity': '1',
      '--pom-presentation-slider-fill-opacity': '1',
      '--pom-presentation-slider-thumb-opacity': '0',
      '--pom-presentation-action-icon-display': 'inline-grid',
      '--pom-presentation-action-label-display': 'none'
    });
    expect(activation.snapshot.cssText).toContain('--pom-presentation-slider-thumb-opacity:0');
    expect(controller.getSnapshot()).toBe(activation.snapshot);
  });

  it('keeps the current snapshot when a target has an invalid explicit profile', () => {
    const controller = createLabThemeController({
      initialId: 'deep-current',
      presets: [
        { id: 'deep-current', target: DEEP_CURRENT_TARGET },
        {
          id: 'pom-neutral',
          target: POM_NEUTRAL_TARGET,
          presentation: {
            ...POMOS_PRESENTATION_PROFILE,
            actions: { content: 'artwork' }
          }
        }
      ]
    });
    const before = controller.getSnapshot();
    const activation = controller.activate('pom-neutral');

    expect(activation).toEqual({
      ok: false,
      diagnostics: [{
        code: 'PRESENTATION_PROFILE_INVALID',
        path: ['profile', 'actions', 'content'],
        message: expect.any(String)
      }]
    });
    expect(controller.getSnapshot()).toBe(before);
    expect(controller.getSnapshot().activeId).toBe('deep-current');
  });
});
