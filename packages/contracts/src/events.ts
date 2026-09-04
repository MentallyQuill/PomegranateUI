import type { PanelId, SubPanelId, WidgetInstanceId } from './ids.js';

interface EventBase {
  readonly revision: number;
}

export type WorkbenchEvent =
  | (EventBase & { readonly type: 'panel.created'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.renamed'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.duplicated'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.reset'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.cleared'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.deleted'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.activated'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.reordered'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'panel.dock-resized'; readonly panelId: PanelId; readonly edge: 'left' | 'right' })
  | (EventBase & { readonly type: 'panel.story-measure-changed'; readonly panelId: PanelId; readonly measure: number })
  | (EventBase & {
      readonly type: 'panel.toolbar-column-added';
      readonly panelId: PanelId;
      readonly edge: 'left' | 'right';
      readonly columnCount: number;
    })
  | (EventBase & {
      readonly type: 'panel.toolbar-column-removed';
      readonly panelId: PanelId;
      readonly edge: 'left' | 'right';
      readonly columnCount: number;
      readonly removedWidgetIds: readonly WidgetInstanceId[];
    })
  | (EventBase & { readonly type: 'panel.columns-resized'; readonly panelId: PanelId })
  | (EventBase & { readonly type: 'sub-panel.activated'; readonly panelId: PanelId; readonly subPanelId: SubPanelId })
  | (EventBase & { readonly type: 'sub-panel.created'; readonly panelId: PanelId; readonly subPanelId: SubPanelId })
  | (EventBase & { readonly type: 'sub-panel.renamed'; readonly panelId: PanelId; readonly subPanelId: SubPanelId })
  | (EventBase & { readonly type: 'sub-panel.duplicated'; readonly panelId: PanelId; readonly subPanelId: SubPanelId })
  | (EventBase & { readonly type: 'sub-panel.reordered'; readonly panelId: PanelId; readonly subPanelId: SubPanelId })
  | (EventBase & { readonly type: 'sub-panel.layout-changed'; readonly panelId: PanelId; readonly subPanelId: SubPanelId })
  | (EventBase & { readonly type: 'sub-panel.columns-resized'; readonly panelId: PanelId; readonly subPanelId: SubPanelId })
  | (EventBase & { readonly type: 'sub-panel.scroll-retained'; readonly panelId: PanelId; readonly subPanelId: SubPanelId })
  | (EventBase & {
      readonly type: 'sub-panel.widgets-moved';
      readonly panelId: PanelId;
      readonly subPanelId: SubPanelId;
      readonly targetSubPanelId: SubPanelId;
    })
  | (EventBase & { readonly type: 'sub-panel.deleted'; readonly panelId: PanelId; readonly subPanelId: SubPanelId })
  | (EventBase & { readonly type: 'shelf.created'; readonly panelId: PanelId; readonly shelfId: string })
  | (EventBase & {
      readonly type: 'shelf.created-with-widget';
      readonly panelId: PanelId;
      readonly shelfId: string;
      readonly instanceId: WidgetInstanceId;
    })
  | (EventBase & { readonly type: 'shelf.resized'; readonly panelId: PanelId; readonly shelfId: string })
  | (EventBase & { readonly type: 'widget.created'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.placed'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.grouped'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.group-activated'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.group-reordered'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.group-separated'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.row-resized'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.shelved'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.restored'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.deleted'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'widget.removed'; readonly instanceId: WidgetInstanceId })
  | (EventBase & { readonly type: 'layout.hydrated' })
  | (EventBase & { readonly type: 'layout.undone' });
