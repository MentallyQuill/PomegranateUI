import type { PanelId, WidgetInstanceId } from './ids.js';

interface EventBase {
  readonly revision: number;
}

export type WorkbenchEvent =
  | (EventBase & { readonly type: 'panel.created'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.activated'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.reordered'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.dock-resized'; readonly panelId: PanelId; readonly edge: 'left' | 'right' })
  | (EventBase & { readonly type: 'widget.created'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.placed'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.grouped'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.group-activated'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.group-reordered'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.removed'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'layout.hydrated' });
