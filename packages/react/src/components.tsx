import type { CSSProperties, ComponentType } from 'react';

import {
  type PanelId,
  type WidgetInstanceId,
  type WidgetPlacement
} from '@pomegranate-ui/contracts';

import { WidgetErrorBoundary } from './error-boundary.js';
import { useWorkbenchBinding, useWorkbenchState } from './provider.js';
import type { WidgetRendererProps } from './renderer-registry.js';

const EMPTY_CAPABILITIES: readonly string[] = Object.freeze([]);

function panelDomSuffix(panelId: PanelId): string {
  return encodeURIComponent(panelId).replaceAll('%', '_');
}

export interface PanelTabsProps {
  readonly className?: string;
}

export function PanelTabs({ className }: PanelTabsProps) {
  const state = useWorkbenchState();
  const { store } = useWorkbenchBinding();
  const panels = [...state.panels].sort((left, right) => left.order - right.order);

  return (
    <div role="tablist" aria-label="Panels" className={className}>
      {panels.map((panel, index) => {
        const suffix = panelDomSuffix(panel.id);
        return (
          <div key={panel.id} data-pomegranate-panel-tab={panel.id}>
            <button
              type="button"
              role="tab"
              id={`pomegranate-panel-tab-${suffix}`}
              aria-controls={`pomegranate-panel-${suffix}`}
              aria-selected={panel.id === state.activePanelId}
              onClick={() => store.dispatch({ type: 'panel.activate', panelId: panel.id })}
            >
              {panel.name}
            </button>
            <button
              type="button"
              aria-label={`Move ${panel.name} left`}
              disabled={index === 0}
              onClick={() => store.dispatch({ type: 'panel.reorder', panelId: panel.id, toIndex: index - 1 })}
            >
              ←
            </button>
            <button
              type="button"
              aria-label={`Move ${panel.name} right`}
              disabled={index === panels.length - 1}
              onClick={() => store.dispatch({ type: 'panel.reorder', panelId: panel.id, toIndex: index + 1 })}
            >
              →
            </button>
          </div>
        );
      })}
    </div>
  );
}

export interface WidgetFrameProps {
  readonly instanceId: WidgetInstanceId;
  readonly placement: WidgetPlacement;
  readonly className?: string | undefined;
}

export function WidgetFrame<THostContext = unknown>({
  instanceId,
  placement,
  className
}: WidgetFrameProps) {
  const state = useWorkbenchState();
  const { store, rendererRegistry, hostContext } = useWorkbenchBinding<THostContext>();
  const instance = state.widgets[instanceId];
  if (!instance) return null;

  const manifest = store.registry.get(instance.type);
  const title = manifest?.title ?? instance.type;
  const Renderer = rendererRegistry.get(instance.type) as ComponentType<WidgetRendererProps<THostContext>> | undefined;
  const floatingStyle: CSSProperties | undefined = placement.kind === 'floating'
    ? {
        position: 'absolute',
        left: placement.x,
        top: placement.y,
        width: placement.width,
        height: placement.height,
        zIndex: placement.z
      }
    : undefined;

  const dock = (edge: 'left' | 'right') => {
    const shelfId = placement.kind === 'docked'
      ? placement.shelfId
      : manifest?.defaultPlacement.kind === 'docked'
        ? manifest.defaultPlacement.shelfId
        : 'primary';
    store.dispatch({
      type: 'widget.place',
      instanceId,
      placement: {
        kind: 'docked',
        panelId: placement.panelId,
        edge,
        shelfId,
        order: Number.MAX_SAFE_INTEGER
      }
    });
  };
  const float = () => {
    const nextZ = Math.max(0, ...Object.values(state.placements).map((candidate) => (
      candidate.kind === 'floating' ? candidate.z : 0
    ))) + 1;
    const defaults = manifest?.defaultPlacement.kind === 'floating'
      ? manifest.defaultPlacement
      : { width: 360, height: 240 };
    store.dispatch({
      type: 'widget.place',
      instanceId,
      placement: placement.kind === 'floating'
        ? placement
        : {
            kind: 'floating',
            panelId: placement.panelId,
            x: 24,
            y: 24,
            width: defaults.width,
            height: defaults.height,
            z: nextZ
          }
    });
  };

  return (
    <article
      aria-label={title}
      className={className}
      data-pomegranate-widget={instanceId}
      data-pomegranate-placement={placement.kind}
      style={floatingStyle}
    >
      <header>{title}</header>
      <div role="group" aria-label={`${title} actions`}>
        <button type="button" onClick={() => dock('left')}>Dock left</button>
        <button type="button" onClick={() => dock('right')}>Dock right</button>
        <button type="button" onClick={float}>Float</button>
      </div>
      {Renderer
        ? (
            <WidgetErrorBoundary title={title}>
              <Renderer
                instance={instance}
                hostContext={hostContext}
                capabilities={manifest?.capabilities ?? EMPTY_CAPABILITIES}
                dispatch={store.dispatch}
              />
            </WidgetErrorBoundary>
          )
        : (
            <div role="status" aria-label={`${title} renderer unavailable`}>
              Renderer unavailable for {title}.
            </div>
          )}
    </article>
  );
}

export interface WorkbenchViewProps {
  readonly className?: string;
  readonly widgetClassName?: string;
}

export function WorkbenchView({ className, widgetClassName }: WorkbenchViewProps) {
  const state = useWorkbenchState();
  const activePanel = state.panels.find((panel) => panel.id === state.activePanelId);
  if (!activePanel) return <div className={className} data-pomegranate-empty-workbench />;

  const placements = Object.entries(state.placements)
    .filter(([, placement]) => placement.panelId === activePanel.id)
    .map(([instanceId, placement]) => ({ instanceId: instanceId as WidgetInstanceId, placement }));
  const docked = (edge: 'left' | 'main' | 'right') => placements
    .filter((entry) => entry.placement.kind === 'docked' && entry.placement.edge === edge)
    .sort((left, right) => {
      const leftPlacement = left.placement.kind === 'docked' ? left.placement : null;
      const rightPlacement = right.placement.kind === 'docked' ? right.placement : null;
      return (leftPlacement?.order ?? 0) - (rightPlacement?.order ?? 0)
        || left.instanceId.localeCompare(right.instanceId);
    });
  const floating = placements
    .filter((entry) => entry.placement.kind === 'floating')
    .sort((left, right) => {
      const leftPlacement = left.placement.kind === 'floating' ? left.placement : null;
      const rightPlacement = right.placement.kind === 'floating' ? right.placement : null;
      return (leftPlacement?.z ?? 0) - (rightPlacement?.z ?? 0)
        || left.instanceId.localeCompare(right.instanceId);
    });
  const suffix = panelDomSuffix(activePanel.id);

  return (
    <section
      role="tabpanel"
      id={`pomegranate-panel-${suffix}`}
      aria-labelledby={`pomegranate-panel-tab-${suffix}`}
      className={className}
      data-pomegranate-panel={activePanel.id}
    >
      {(['left', 'main', 'right'] as const).map((edge) => (
        <div
          key={edge}
          data-testid={`pomegranate-dock-${edge}`}
          data-pomegranate-dock={edge}
        >
          {docked(edge).map(({ instanceId, placement }) => (
            <WidgetFrame
              key={instanceId}
              instanceId={instanceId}
              placement={placement}
              className={widgetClassName}
            />
          ))}
        </div>
      ))}
      <div data-testid="pomegranate-floating-layer" data-pomegranate-floating-layer>
        {floating.map(({ instanceId, placement }) => (
          <WidgetFrame
            key={instanceId}
            instanceId={instanceId}
            placement={placement}
            className={widgetClassName}
          />
        ))}
      </div>
    </section>
  );
}
