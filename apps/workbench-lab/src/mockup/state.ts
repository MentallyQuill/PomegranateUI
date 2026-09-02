import {
  asPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type WorkbenchState
} from '@pomegranate-ui/contracts';
import {
  activateWidgetGroup,
  createInitialWorkbenchState,
  createPanel,
  createWidget,
  mergeWidgetGroup,
  type LayoutResult
} from '@pomegranate-ui/layout';

import { upgradeFlatSettingsPanel, upgradeThemeAuthoringWidgets } from './settings-sub-panels.js';

export const LAB_PANEL_IDS = Object.freeze({
  scene: asPanelId('scene'),
  library: asPanelId('library'),
  settings: asPanelId('settings')
});

export const LAB_WIDGET_TYPES = Object.freeze({
  characters: asWidgetType('story.characters'),
  transcript: asWidgetType('story.transcript'),
  composer: asWidgetType('story.composer'),
  worldState: asWidgetType('systems.world-state'),
  ambience: asWidgetType('story.room-ambience'),
  promiseLedger: asWidgetType('systems.promise-ledger'),
  personas: asWidgetType('story.personas'),
  providerCredentials: asWidgetType('settings.provider-credentials'),
  connections: asWidgetType('settings.connections'),
  modelAssignments: asWidgetType('settings.model-assignments'),
  defaultModel: asWidgetType('settings.default-model'),
  memorySearchModel: asWidgetType('settings.memory-search-model'),
  characterRelationships: asWidgetType('systems.character-relationships'),
  library: asWidgetType('library.workspace'),
  characterCard: asWidgetType('library.character-card'),
  loreEntries: asWidgetType('library.lore-entries'),
  themeLibrary: asWidgetType('settings.theme'),
  themeSettings: asWidgetType('settings.custom-theme'),
  themeColors: asWidgetType('settings.theme-colors'),
  themeMaterials: asWidgetType('settings.theme-materials'),
  themeCanvas: asWidgetType('settings.theme-canvas'),
  themeAmbient: asWidgetType('settings.theme-ambient'),
  readingLayout: asWidgetType('settings.reading-layout'),
  soundMotion: asWidgetType('settings.sound-motion'),
  accessibility: asWidgetType('settings.accessibility'),
  content: asWidgetType('settings.content'),
  narratorVoice: asWidgetType('settings.narrator-voice'),
  livingWorldControls: asWidgetType('settings.living-world-controls'),
  addOns: asWidgetType('settings.add-ons'),
  maintenance: asWidgetType('settings.maintenance'),
  promptEditor: asWidgetType('settings.prompt-editor'),
  rawStoryData: asWidgetType('settings.raw-story-data')
});

function requireState(result: LayoutResult): WorkbenchState {
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

export function createLabState(): WorkbenchState {
  let state = createInitialWorkbenchState();
  for (const panel of [
    { id: LAB_PANEL_IDS.scene, name: 'Scene', templateId: 'story-stage.v1', order: 0, configuration: { columns: 3, dockWidths: { left: 286, right: 286 } } },
    { id: LAB_PANEL_IDS.library, name: 'Library', templateId: 'focus-support.v1', order: 1, configuration: { columns: 2 } },
    { id: LAB_PANEL_IDS.settings, name: 'Settings', templateId: 'columns.v1', order: 2, configuration: { columns: 3 } }
  ]) state = requireState(createPanel(state, panel));
  state = {
    ...state,
    shelves: [
      { id: 'primary', panelId: LAB_PANEL_IDS.scene, regionId: 'left', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.scene, regionId: 'stage', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.scene, regionId: 'composer', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.scene, regionId: 'right', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.library, regionId: 'focus', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.library, regionId: 'support', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.settings, regionId: 'column-1', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.settings, regionId: 'column-2', order: 0, weight: 1 },
      { id: 'primary', panelId: LAB_PANEL_IDS.settings, regionId: 'column-3', order: 0, weight: 1 }
    ]
  };

  const fixtures = [
    ['scene-characters', LAB_WIDGET_TYPES.characters, LAB_PANEL_IDS.scene, 'left', 0, { presentation: 'recording' }],
    ['scene-theme-materials', LAB_WIDGET_TYPES.themeMaterials, LAB_PANEL_IDS.scene, 'left', 1, {}],
    ['scene-transcript', LAB_WIDGET_TYPES.transcript, LAB_PANEL_IDS.scene, 'stage', 0, {}],
    ['scene-composer', LAB_WIDGET_TYPES.composer, LAB_PANEL_IDS.scene, 'composer', 0, {}],
    ['scene-world', LAB_WIDGET_TYPES.worldState, LAB_PANEL_IDS.scene, 'right', 0, { presentation: 'atmospheric' }],
    ['scene-ambience', LAB_WIDGET_TYPES.ambience, LAB_PANEL_IDS.scene, 'right', 1, { presentation: 'atmospheric' }],
    ['scene-promises', LAB_WIDGET_TYPES.promiseLedger, LAB_PANEL_IDS.scene, 'right', 2, { presentation: 'atmospheric' }],
    ['library-main', LAB_WIDGET_TYPES.library, LAB_PANEL_IDS.library, 'focus', 0, {}],
    ['library-character', LAB_WIDGET_TYPES.characterCard, LAB_PANEL_IDS.library, 'support', 0, { fixtureMode: 'failure' }],
    ['library-lore', LAB_WIDGET_TYPES.loreEntries, LAB_PANEL_IDS.library, 'support', 1, {}],
    ['settings-provider-credentials', LAB_WIDGET_TYPES.providerCredentials, LAB_PANEL_IDS.settings, 'column-1', 0, {}],
    ['settings-connections', LAB_WIDGET_TYPES.connections, LAB_PANEL_IDS.settings, 'column-2', 0, {}],
    ['settings-model-assignments', LAB_WIDGET_TYPES.modelAssignments, LAB_PANEL_IDS.settings, 'column-1', 0, {}],
    ['settings-default-model', LAB_WIDGET_TYPES.defaultModel, LAB_PANEL_IDS.settings, 'column-2', 0, {}],
    ['settings-memory-search-model', LAB_WIDGET_TYPES.memorySearchModel, LAB_PANEL_IDS.settings, 'column-2', 1, {}],
    ['settings-theme-library', LAB_WIDGET_TYPES.themeLibrary, LAB_PANEL_IDS.settings, 'column-1', 0, {}],
    ['settings-theme-settings', LAB_WIDGET_TYPES.themeSettings, LAB_PANEL_IDS.settings, 'column-1', 1, {}],
    ['settings-theme-colors', LAB_WIDGET_TYPES.themeColors, LAB_PANEL_IDS.settings, 'column-2', 0, {}],
    ['settings-theme-materials', LAB_WIDGET_TYPES.themeMaterials, LAB_PANEL_IDS.settings, 'column-2', 1, {}],
    ['settings-theme-canvas', LAB_WIDGET_TYPES.themeCanvas, LAB_PANEL_IDS.settings, 'column-3', 0, {}],
    ['settings-theme-ambient', LAB_WIDGET_TYPES.themeAmbient, LAB_PANEL_IDS.settings, 'column-3', 1, {}],
    ['settings-reading-layout', LAB_WIDGET_TYPES.readingLayout, LAB_PANEL_IDS.settings, 'column-2', 0, {}],
    ['settings-sound-motion', LAB_WIDGET_TYPES.soundMotion, LAB_PANEL_IDS.settings, 'column-2', 1, {}],
    ['settings-accessibility', LAB_WIDGET_TYPES.accessibility, LAB_PANEL_IDS.settings, 'column-3', 0, {}],
    ['settings-content', LAB_WIDGET_TYPES.content, LAB_PANEL_IDS.settings, 'column-1', 0, {}],
    ['settings-narrator-voice', LAB_WIDGET_TYPES.narratorVoice, LAB_PANEL_IDS.settings, 'column-2', 0, {}],
    ['settings-living-world-controls', LAB_WIDGET_TYPES.livingWorldControls, LAB_PANEL_IDS.settings, 'column-2', 1, {}],
    ['settings-add-ons', LAB_WIDGET_TYPES.addOns, LAB_PANEL_IDS.settings, 'column-1', 0, {}],
    ['settings-maintenance', LAB_WIDGET_TYPES.maintenance, LAB_PANEL_IDS.settings, 'column-2', 0, {}],
    ['settings-prompt-editor', LAB_WIDGET_TYPES.promptEditor, LAB_PANEL_IDS.settings, 'column-1', 0, {}],
    ['settings-raw-story-data', LAB_WIDGET_TYPES.rawStoryData, LAB_PANEL_IDS.settings, 'column-1', 1, {}]
  ] as const;
  for (const [id, type, panelId, regionId, order, configuration] of fixtures) {
    state = requireState(createWidget(state, {
      id: asWidgetInstanceId(id),
      type,
      manifestVersion: '1.0.0',
      configuration
    }, {
      kind: 'docked', panelId, regionId, shelfId: 'primary', order
    }));
  }
  const ambienceId = asWidgetInstanceId('scene-ambience');
  state = requireState(mergeWidgetGroup(
    state,
    asWidgetInstanceId('scene-promises'),
    ambienceId,
    'scene-ambience-ledger'
  ));
  state = requireState(activateWidgetGroup(state, ambienceId));
  return { ...upgradeThemeAuthoringWidgets(upgradeFlatSettingsPanel(state)), revision: 0 };
}
