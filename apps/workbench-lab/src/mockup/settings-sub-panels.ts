import {
  asPanelId,
  asSubPanelId,
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
      assignment('settings.reading-layout', 1, 0),
      assignment('settings.sound-motion', 1, 1),
      assignment('settings.accessibility', 2, 0)
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
