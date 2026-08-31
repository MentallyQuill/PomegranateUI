import type { LabThemeId } from '../themes/presets.js';
import type { LabMaterialControlId, LabMaterialControls } from '../themes/material-controls.js';
import type { LabThemeAuthoringSnapshot, ThemeDraftEditResult, ThemeDraftSaveResult } from '../themes/controller.js';
import type { LabShowcaseMediaProfile } from './showcase-media.js';

export interface LabThemeInspector {
  readonly colors: Readonly<Record<string, string>>;
  readonly typography: readonly string[];
  readonly geometry: string;
  readonly density: string;
  readonly iconPackId: string;
}

export interface LabThemeHostContext {
  activeId: LabThemeId;
  readonly presets: readonly {
    readonly id: LabThemeId;
    readonly label: string;
    readonly description: string;
  }[];
  inspector: LabThemeInspector;
  materialControls: LabMaterialControls;
  authoring: LabThemeAuthoringSnapshot;
  readonly activate: (id: string) => void;
  readonly setMaterialControl: (id: LabMaterialControlId, value: number) => void;
  readonly resetMaterialControls: () => void;
  readonly openSettings: () => void;
  readonly editDraft: (next: unknown) => ThemeDraftEditResult;
  readonly resetDraft: () => ThemeDraftEditResult;
  readonly saveDraft: () => Promise<ThemeDraftSaveResult>;
}

export interface LabHostContext {
  readonly storyId: string;
  readonly storyTitle: string;
  readonly frameLabel: string;
  readonly location: string;
  readonly timeLabel: string;
  readonly systemStatus: string;
  surfaceState: string;
  readonly theme: LabThemeHostContext;
  visualMedia: LabShowcaseMediaProfile;
}

const LAB_STORY_CONTEXT = Object.freeze({
  storyId: 'STORY / 7E-19',
  storyTitle: 'The Water Remembers',
  frameLabel: 'Present frame · Turn 42',
  location: 'Reservoir Concourse',
  timeLabel: 'Blue hour · rain easing',
  systemStatus: 'Local fixture ready'
});

export function createLabHostContext(
  theme: LabThemeHostContext,
  surfaceState = 'ready',
  visualMedia: LabShowcaseMediaProfile = {}
): LabHostContext {
  return { ...LAB_STORY_CONTEXT, surfaceState, theme, visualMedia };
}
