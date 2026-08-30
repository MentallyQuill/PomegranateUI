import { describe, expect, it } from 'vitest';

import {
  PRESENTATION_PROFILE_SCHEMA_VERSION,
  PresentationProfileDefinitionSchema
} from './index.js';

describe('PresentationProfileDefinitionSchema', () => {
  it('parses the standalone v1 presentation owner without changing a theme or canvas artifact', () => {
    expect(PresentationProfileDefinitionSchema.parse({
      schemaVersion: PRESENTATION_PROFILE_SCHEMA_VERSION,
      id: 'pomos-controls',
      slider: {
        trackVisibility: 'visible',
        fillVisibility: 'visible',
        thumbVisibility: 'hidden'
      },
      actions: { content: 'icon' },
      canvas: { blurPolicy: 'forbid' }
    })).toEqual({
      schemaVersion: 'pomegranate.ui.presentation-profile.v1',
      id: 'pomos-controls',
      slider: {
        trackVisibility: 'visible',
        fillVisibility: 'visible',
        thumbVisibility: 'hidden'
      },
      actions: { content: 'icon' },
      canvas: { blurPolicy: 'forbid' }
    });
  });

  it('rejects a slider profile that hides both the track and fill', () => {
    expect(() => PresentationProfileDefinitionSchema.parse({
      schemaVersion: PRESENTATION_PROFILE_SCHEMA_VERSION,
      id: 'invisible-slider',
      slider: {
        trackVisibility: 'hidden',
        fillVisibility: 'hidden',
        thumbVisibility: 'visible'
      },
      actions: { content: 'text' },
      canvas: { blurPolicy: 'allow' }
    })).toThrow(/Slider track or fill must remain visible/);
  });
});
