import {
  PRESENTATION_PROFILE_SCHEMA_VERSION,
  type PresentationProfileDefinition
} from '@pomegranate-ui/contracts';

export const POMOS_PRESENTATION_PROFILE: PresentationProfileDefinition = Object.freeze({
  schemaVersion: PRESENTATION_PROFILE_SCHEMA_VERSION,
  id: 'pomos-controls',
  slider: Object.freeze({
    trackVisibility: 'visible',
    fillVisibility: 'visible',
    thumbVisibility: 'hidden'
  }),
  actions: Object.freeze({ content: 'icon' }),
  canvas: Object.freeze({ blurPolicy: 'forbid' })
});
