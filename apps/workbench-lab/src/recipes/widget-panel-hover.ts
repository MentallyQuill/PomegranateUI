import type { DockPoint, DockRect } from './widget-docking.js';

export const panelHoverDelayMs = 350;
export interface PanelHoverHint { readonly label: string; readonly rect: DockRect }
export interface WidgetPanelHover {
  update(point: DockPoint): void;
  clear(): void;
  getHint(): PanelHoverHint | undefined;
}

export function createWidgetPanelHover(getRoot: () => HTMLElement | null, activate: (panelId: string) => void): WidgetPanelHover {
  let tab: HTMLButtonElement | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const clear = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    tab?.removeAttribute('data-widget-drag-hover');
    tab = null;
  };
  return {
    clear,
    update(point) {
      const next = [...getRoot()?.querySelectorAll<HTMLButtonElement>('[data-pomegranate-panel-tab] > [role="tab"]') ?? []]
        .find(node => {
          if (node.disabled || node.getAttribute('aria-selected') === 'true') return false;
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
        }) ?? null;
      if (next === tab) return;
      clear();
      tab = next;
      if (!next) return;
      next.dataset.widgetDragHover = 'true';
      timer = setTimeout(() => {
        const id = tab?.closest<HTMLElement>('[data-pomegranate-panel-tab]')?.dataset.pomegranatePanelTab;
        const connected = tab?.isConnected;
        clear();
        if (id && connected) activate(id);
      }, panelHoverDelayMs);
    },
    getHint() {
      return tab ? { label: `Hold to open ${tab.textContent?.trim() ?? 'Panel'}`, rect: tab.getBoundingClientRect() } : undefined;
    }
  };
}
