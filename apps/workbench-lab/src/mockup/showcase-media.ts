import ashAmberCharacterAtlas from '../assets/ash-amber-character-atlas.webp';
import bunnyCharacterAtlas from '../assets/bunny-character-atlas.webp';
import deepCurrentAvenRook from '../assets/deep-current-aven-rook.webp';
import deepCurrentIlex from '../assets/deep-current-ilex.webp';
import deepCurrentMaraVenn from '../assets/deep-current-mara-venn.webp';
import deepCurrentQuietDiver from '../assets/deep-current-quiet-diver.webp';
import pomosCharacterAtlas from '../assets/pomos-character-atlas.webp';
import type { LabThemeId } from '../themes/presets.js';

export interface LabCharacterPortraitAtlas {
  readonly source: string;
  readonly columns: 2;
  readonly rows: 2;
}

export interface LabShowcaseMediaProfile {
  readonly characterPortraitAtlas?: LabCharacterPortraitAtlas;
  readonly characterPortraits?: readonly [string, string, string, string];
}

const EMPTY_MEDIA_PROFILE = Object.freeze({}) satisfies LabShowcaseMediaProfile;

const MEDIA_PROFILES: Readonly<Partial<Record<LabThemeId, LabShowcaseMediaProfile>>> = Object.freeze({
  'deep-current': Object.freeze({
    characterPortraits: Object.freeze([
      deepCurrentAvenRook,
      deepCurrentMaraVenn,
      deepCurrentIlex,
      deepCurrentQuietDiver
    ] as [string, string, string, string])
  }),
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
