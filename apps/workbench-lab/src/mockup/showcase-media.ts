import ashAmberCharacterAtlas from '../assets/ash-amber-character-atlas.webp';
import bunnyCharacterAtlas from '../assets/bunny-character-atlas.webp';
import pomosCharacterAtlas from '../assets/pomos-character-atlas.webp';
import type { LabThemeId } from '../themes/presets.js';

export interface LabCharacterPortraitAtlas {
  readonly source: string;
  readonly columns: 2;
  readonly rows: 2;
}

export interface LabShowcaseMediaProfile {
  readonly characterPortraitAtlas?: LabCharacterPortraitAtlas;
}

const EMPTY_MEDIA_PROFILE = Object.freeze({}) satisfies LabShowcaseMediaProfile;

const MEDIA_PROFILES: Readonly<Partial<Record<LabThemeId, LabShowcaseMediaProfile>>> = Object.freeze({
  'pom-neutral': Object.freeze({
    characterPortraitAtlas: Object.freeze({ source: pomosCharacterAtlas, columns: 2, rows: 2 })
  }),
  bunny: Object.freeze({
    characterPortraitAtlas: Object.freeze({ source: bunnyCharacterAtlas, columns: 2, rows: 2 })
  }),
  'ash-amber': Object.freeze({
    characterPortraitAtlas: Object.freeze({ source: ashAmberCharacterAtlas, columns: 2, rows: 2 })
  })
});

export function resolveLabShowcaseMediaProfile(id: LabThemeId): LabShowcaseMediaProfile {
  return MEDIA_PROFILES[id] ?? EMPTY_MEDIA_PROFILE;
}
