import {
  asPanelId,
  asSubPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type PanelId,
  type SubPanelId,
  type SubPanelLayoutId,
  type SubPanelState,
  type VisibleWidgetPlacement,
  type WidgetPlacement,
  type WidgetType,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

export interface SettingsWidgetAssignment {
  readonly type: WidgetType;
  readonly lane: number;
  readonly order: number;
}

export interface SettingsSubPanelDefinition {
  readonly id: SubPanelId;
  readonly name: string;
  readonly layoutId: SubPanelLayoutId;
  readonly widgets: readonly SettingsWidgetAssignment[];
}

const assignment = (type: string, lane: number, order: number): SettingsWidgetAssignment => ({
  type: asWidgetType(type),
  lane,
  order
});

export const SETTINGS_SUB_PANELS: readonly SettingsSubPanelDefinition[] = Object.freeze([
  Object.freeze({
    id: asSubPanelId('settings-account-access'),
    name: 'Account and Access',
    layoutId: 'two-equal',
    widgets: Object.freeze([
      assignment('settings.provider-credentials', 0, 0),
      assignment('settings.connections', 1, 0)
    ])
  }),
  Object.freeze({
    id: asSubPanelId('settings-ai-models'),
    name: 'AI and Models',
    layoutId: 'two-equal',
    widgets: Object.freeze([
      assignment('settings.model-assignments', 0, 0),
      assignment('settings.default-model', 1, 0),
      assignment('settings.memory-search-model', 1, 1)
    ])
  }),
  Object.freeze({
    id: asSubPanelId('settings-appearance-accessibility'),
    name: 'Appearance and Accessibility',
    layoutId: 'three-equal',
    widgets: Object.freeze([
      assignment('settings.theme', 0, 0),
      assignment('settings.custom-theme', 0, 1),
      assignment('settings.reading-layout', 0, 2),
      assignment('settings.theme-colors', 1, 0),
      assignment('settings.theme-materials', 1, 1),
      assignment('settings.sound-motion', 1, 2),
      assignment('settings.theme-canvas', 2, 0),
      assignment('settings.theme-ambient', 2, 1),
      assignment('settings.accessibility', 2, 2)
    ])
  }),
  Object.freeze({
    id: asSubPanelId('settings-story-content'),
    name: 'Story Defaults and Content',
    layoutId: 'two-equal',
    widgets: Object.freeze([
      assignment('settings.content', 0, 0),
      assignment('settings.narrator-voice', 1, 0),
      assignment('settings.living-world-controls', 1, 1)
    ])
  }),
  Object.freeze({
    id: asSubPanelId('settings-data-extensions-maintenance'),
    name: 'Data, Extensions, and Maintenance',
    layoutId: 'wide-left',
    widgets: Object.freeze([
      assignment('settings.add-ons', 0, 0),
      assignment('settings.maintenance', 1, 0)
    ])
  }),
  Object.freeze({
    id: asSubPanelId('settings-advanced'),
    name: 'Advanced',
    layoutId: 'single',
    widgets: Object.freeze([
      assignment('settings.prompt-editor', 0, 0),
      assignment('settings.raw-story-data', 0, 1)
    ])
  })
]);

const DEFAULT_SETTINGS_PANEL_ID = asPanelId('settings');
const assignmentByType = new Map<string, { readonly subPanelId: SubPanelId; readonly lane: number; readonly order: number }>();
for (const subPanel of SETTINGS_SUB_PANELS) {
  for (const widget of subPanel.widgets) {
    assignmentByType.set(widget.type, { subPanelId: subPanel.id, lane: widget.lane, order: widget.order });
  }
}

function replaceVisible(placement: WidgetPlacement, visible: VisibleWidgetPlacement): WidgetPlacement {
  return placement.kind === 'shelved' ? { ...placement, lastVisible: visible } : visible;
}

export function upgradeFlatSettingsPanel(
  state: WorkbenchState,
  panelId: PanelId = DEFAULT_SETTINGS_PANEL_ID
): WorkbenchState {
  const panelIndex = state.panels.findIndex((panel) => panel.id === panelId);
  if (panelIndex < 0 || state.panels[panelIndex]!.subPanels) return state;

  const advanced = SETTINGS_SUB_PANELS[5]!;
  const extensions = SETTINGS_SUB_PANELS[4]!;
  const nextOrder = new Map<string, number>();
  for (const subPanel of SETTINGS_SUB_PANELS) {
    for (const widget of subPanel.widgets) {
      const key = `${subPanel.id}:${widget.lane}`;
      nextOrder.set(key, Math.max(nextOrder.get(key) ?? 0, widget.order + 1));
    }
  }

  const placements = { ...state.placements };
  for (const [instanceId, placement] of Object.entries(state.placements)) {
    const visible = placement.kind === 'shelved' ? placement.lastVisible : placement;
    if (visible.panelId !== panelId) continue;
    const widget = state.widgets[instanceId];
    if (!widget) continue;
    const known = assignmentByType.get(widget.type);
    const fallbackSubPanel = widget.type.startsWith('ext:') ? extensions : advanced;
    const subPanelId = known?.subPanelId ?? fallbackSubPanel.id;
    const lane = known?.lane ?? 0;
    const key = `${subPanelId}:${lane}`;
    const order = known?.order ?? nextOrder.get(key) ?? 0;
    if (!known) nextOrder.set(key, order + 1);
    const owned: VisibleWidgetPlacement = visible.kind === 'docked'
      ? {
          ...visible,
          subPanelId,
          lane,
          regionId: `column-${lane + 1}`,
          order
        }
      : { ...visible, subPanelId };
    placements[instanceId] = replaceVisible(placement, owned);
  }

  const subPanels: readonly SubPanelState[] = SETTINGS_SUB_PANELS.map((definition, order) => ({
    id: definition.id,
    name: definition.name,
    layoutId: definition.layoutId,
    order,
    scrollTop: 0,
    shipped: true
  }));
  const panels = [...state.panels];
  panels[panelIndex] = {
    ...panels[panelIndex]!,
    activeSubPanelId: subPanels[0]!.id,
    subPanels
  };
  return { ...state, panels, placements };
}

const THEME_ELEMENT_FIXTURES = Object.freeze([
  { id: 'settings-theme-colors', type: 'settings.theme-colors', lane: 1, order: 0 },
  { id: 'settings-theme-materials', type: 'settings.theme-materials', lane: 1, order: 1 },
  { id: 'settings-theme-canvas', type: 'settings.theme-canvas', lane: 2, order: 0 },
  { id: 'settings-theme-ambient', type: 'settings.theme-ambient', lane: 2, order: 1 }
] as const);

const LEGACY_APPEARANCE_FIXTURES = Object.freeze([
  { id: 'settings-reading-layout', type: 'settings.reading-layout', lane: 1, order: 0 },
  { id: 'settings-sound-motion', type: 'settings.sound-motion', lane: 1, order: 1 },
  { id: 'settings-accessibility', type: 'settings.accessibility', lane: 2, order: 0 }
] as const);

function visiblePlacement(placement: WidgetPlacement | undefined): VisibleWidgetPlacement | undefined {
  return placement?.kind === 'shelved' ? placement.lastVisible : placement;
}

export function upgradeThemeAuthoringWidgets(state: WorkbenchState): WorkbenchState {
  let changed = false;
  const widgets = { ...state.widgets };
  const placements = { ...state.placements };
  const legacyId = asWidgetInstanceId('scene-theme-settings');
  const legacy = widgets[legacyId];
  const legacyPlacement = visiblePlacement(placements[legacyId]);
  if (
    legacy?.type === asWidgetType('settings.custom-theme')
    && legacyPlacement?.panelId === asPanelId('scene')
    && legacy.configuration.presentation === 'compact'
  ) {
    widgets[legacyId] = {
      ...legacy,
      type: asWidgetType('settings.theme-materials'),
      configuration: {}
    };
    changed = true;
  }

  const settingsId = asPanelId('settings');
  const appearanceId = asSubPanelId('settings-appearance-accessibility');
  if (state.panels.some(({ id }) => id === settingsId)) {
    for (const fixture of LEGACY_APPEARANCE_FIXTURES) {
      const id = asWidgetInstanceId(fixture.id);
      const widget = widgets[id];
      const placement = placements[id];
      const visible = visiblePlacement(placement);
      const assignment = assignmentByType.get(asWidgetType(fixture.type));
      if (
        widget?.type !== asWidgetType(fixture.type)
        || !placement
        || visible?.kind !== 'docked'
        || visible.panelId !== settingsId
        || visible.subPanelId !== appearanceId
        || visible.lane !== fixture.lane
        || visible.order !== fixture.order
        || !assignment
      ) continue;
      placements[id] = replaceVisible(placement, {
        ...visible,
        lane: assignment.lane,
        regionId: `column-${assignment.lane + 1}`,
        order: assignment.order
      });
      changed = true;
    }
    for (const fixture of THEME_ELEMENT_FIXTURES) {
      const type = asWidgetType(fixture.type);
      const alreadyPlaced = Object.values(widgets).some((widget) => {
        const placement = visiblePlacement(placements[widget.id]);
        return widget.type === type && placement?.panelId === settingsId && placement.subPanelId === appearanceId;
      });
      if (alreadyPlaced) continue;
      const id = asWidgetInstanceId(fixture.id);
      if (widgets[id] || placements[id]) continue;
      widgets[id] = { id, type, manifestVersion: '1.0.0', configuration: {} };
      placements[id] = {
        kind: 'docked',
        panelId: settingsId,
        subPanelId: appearanceId,
        lane: fixture.lane,
        regionId: `column-${fixture.lane + 1}`,
        shelfId: 'primary',
        order: fixture.order
      };
      changed = true;
    }
  }

  return changed ? { ...state, widgets, placements } : state;
}

export function upgradeLabWorkbenchState(state: WorkbenchState): WorkbenchState {
  return upgradeThemeAuthoringWidgets(upgradeFlatSettingsPanel(state));
}
