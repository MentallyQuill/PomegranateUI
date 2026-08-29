import type { LabThemeId } from '../themes/presets.js';
import type { LabMaterialControlId, LabMaterialControls } from '../themes/material-controls.js';

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
  readonly activate: (id: string) => void;
  readonly setMaterialControl: (id: LabMaterialControlId, value: number) => void;
  readonly resetMaterialControls: () => void;
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
}

const LAB_STORY_CONTEXT = Object.freeze({
  storyId: 'story-lab-reservoir',
  storyTitle: 'The Reservoir at Blue Hour',
  frameLabel: 'Present frame · Turn 42',
  location: 'Reservoir Concourse',
  timeLabel: 'Blue hour · rain easing',
  systemStatus: 'Local fixture ready'
});

export function createLabHostContext(theme: LabThemeHostContext, surfaceState = 'ready'): LabHostContext {
  return { ...LAB_STORY_CONTEXT, surfaceState, theme };
}
