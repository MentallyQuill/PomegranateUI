import type {
  PanelState,
  ShelfState,
  WidgetInstance,
  WidgetPlacement
} from '@pomegranate-ui/contracts';

export type PanelCapability = 'rename' | 'duplicate' | 'reset' | 'clear' | 'delete';

export interface PanelResetState {
  readonly panel: PanelState;
  readonly shelves: readonly ShelfState[];
  readonly widgets: Readonly<Record<string, WidgetInstance>>;
  readonly placements: Readonly<Record<string, WidgetPlacement>>;
}

export interface PanelCapabilityPolicy {
  allows(panel: PanelState, capability: PanelCapability): boolean;
  resetState?(panel: PanelState): PanelResetState | null;
}

export const ALLOW_PANEL_CAPABILITIES: PanelCapabilityPolicy = Object.freeze({
  allows: () => true
});
