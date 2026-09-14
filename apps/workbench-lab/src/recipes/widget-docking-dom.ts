import {
  buildShelfRails,
  dockTargetKey,
  type DockIntent,
  type DockOwner,
  type DockRect,
  type DockTarget
} from './widget-docking.js';

export interface DockTargetCollectionOptions {
  readonly regions?: readonly HTMLElement[];
  readonly sourceInstanceId?: string;
  readonly sourceElement?: HTMLElement;
  readonly ownerForRegion: (region: HTMLElement) => DockOwner | null;
}

export interface DockPreviewController {
  sync(targets: readonly DockTarget[], intent: DockIntent | null): DockIntent | null;
  clearSlot(): void;
  getSlotRect(): DOMRect | null;
  destroy(): void;
}

export function dockRectOf(rect: DOMRectReadOnly): DockRect {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

/** Widget insertion marks the item boundary; shelf rails reserve a new shelf. */
export function positionWidgetInsertion(slot: HTMLElement, region: HTMLElement, intent: DockIntent): DockIntent {
  const article = intent.targetInstanceId
    ? region.querySelector<HTMLElement>(`[data-pomegranate-widget="${CSS.escape(intent.targetInstanceId)}"]`)
    : null;
  const item = article?.closest<HTMLElement>('[data-widget-group]')
    ?? article?.closest<HTMLElement>('[data-widget-type]') ?? article;
  if (!item) return intent;
  slot.style.position = 'fixed';
  const rect = item.getBoundingClientRect();
  const previewRect = { x: rect.x, y: (intent.kind === 'insert-before' ? rect.y : rect.bottom) - 2, width: rect.width, height: 4 };
  slot.dataset.dropWidgetBoundary = 'true';
  slot.style.cssText = `position:fixed;left:${previewRect.x}px;top:${previewRect.y}px;width:${previewRect.width}px;height:4px;min-height:4px;`;
  // Filtered dock surfaces establish containing blocks for fixed children.
  // Keep viewport coordinates in the same portal as the overlay.
  const portal = region.closest<HTMLElement>('main[data-pom-theme-root]') ?? region.ownerDocument.body;
  if (slot.parentElement !== portal) portal.append(slot);
  return { ...intent, previewRect };
}

export function collectDockTargets(
  root: ParentNode,
  options: DockTargetCollectionOptions
): readonly DockTarget[] {
  // A reservation may move or shrink its neighbours. Measure their underlying
  // layout, never the layout produced by our own previous hover decision.
  // Taking the slot out of flow preserves its identity and running animation.
  const slots = [...root.querySelectorAll<HTMLElement>('[data-pom-part="widget.dock-slot"]')];
  const positions = slots.map((slot) => ({
    slot,
    value: slot.style.getPropertyValue('position'),
    priority: slot.style.getPropertyPriority('position')
  }));
  for (const { slot } of positions) slot.style.setProperty('position', 'absolute', 'important');
  try {
    return readDockTargets(root, options);
  } finally {
    for (const { slot, value, priority } of positions) {
      if (value) slot.style.setProperty('position', value, priority);
      else slot.style.removeProperty('position');
    }
  }
}

/** Refresh held feedback when geometry changes without a new pointer event. */
export function observeDockGeometry(root: HTMLElement, changed: () => void): () => void {
  const view = root.ownerDocument.defaultView;
  if (!view) return () => undefined;
  let frame: number | null = null;
  const schedule = () => {
    if (frame !== null) return;
    frame = view.requestAnimationFrame(() => {
      frame = null;
      changed();
    });
  };
  const resize = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : null;
  const refreshElements = () => {
    resize?.disconnect();
    resize?.observe(root);
    for (const element of root.querySelectorAll<HTMLElement>('[data-pomegranate-region-surface], .dock-shelf, .widget-frame')) {
      if (!element.closest('[data-catalog-placement-proxy], .widget-drag-preview')) resize?.observe(element);
    }
  };
  refreshElements();
  const mutation = new view.MutationObserver((records) => {
    if (!records.some(({ target }) => {
      const element = target instanceof Element ? target : target.parentElement;
      return !element?.closest('.widget-drop-overlay, .widget-drag-preview, [data-catalog-placement-proxy]');
    })) return;
    refreshElements();
    schedule();
  });
  mutation.observe(root, { childList: true, subtree: true });
  view.addEventListener('resize', schedule);
  root.ownerDocument.addEventListener('scroll', schedule, true);
  return () => {
    if (frame !== null) view.cancelAnimationFrame(frame);
    resize?.disconnect();
    mutation.disconnect();
    view.removeEventListener('resize', schedule);
    root.ownerDocument.removeEventListener('scroll', schedule, true);
  };
}

function readDockTargets(
  root: ParentNode,
  options: DockTargetCollectionOptions
): readonly DockTarget[] {
  const targets: DockTarget[] = [];
  const regions = options.regions
    ?? [...root.querySelectorAll<HTMLElement>('[data-pomegranate-region-surface]')];
  for (const region of regions) {
    const owner = options.ownerForRegion(region);
    if (!owner?.regionId) continue;
    const regionRect = dockRectOf(region.getBoundingClientRect());
    if (regionRect.width <= 0 || regionRect.height <= 0) continue;
    let regionDepth = 0;
    let ancestor = region.parentElement?.closest<HTMLElement>('[data-pomegranate-region-surface]') ?? null;
    while (ancestor) {
      regionDepth += 1;
      ancestor = ancestor.parentElement?.closest<HTMLElement>('[data-pomegranate-region-surface]') ?? null;
    }
    const shelves = [...region.querySelectorAll<HTMLElement>(':scope > .dock-shelf')].map((shelf, index) => ({
      id: shelf.dataset.pomegranateShelf ?? `shelf-${index}`,
      order: Number(shelf.dataset.pomegranateShelfOrder ?? index),
      rect: dockRectOf(shelf.getBoundingClientRect())
    }));
    targets.push(...buildShelfRails(regionRect, shelves, owner).map((target) => ({
      ...target,
      regionRect,
      regionDepth
    })));

    let otherWidgets = 0;
    for (const wrapper of region.querySelectorAll<HTMLElement>('[data-widget-type]')) {
      if (wrapper.closest<HTMLElement>('[data-pomegranate-region-surface]') !== region) continue;
      const article = wrapper.querySelector<HTMLElement>('[data-pomegranate-widget]');
      const targetId = article?.dataset.pomegranateWidget;
      if (!article
        || !targetId
        || targetId === options.sourceInstanceId
        || wrapper === options.sourceElement) continue;
      otherWidgets += 1;
      const header = article.querySelector<HTMLElement>(':scope > header[data-widget-drag-surface]');
      const content = article.querySelector<HTMLElement>(':scope > [data-pom-part="widget.content"]');
      const group = wrapper.closest<HTMLElement>('[data-widget-group]');
      const target: DockTarget = {
        ...owner,
        id: dockTargetKey(owner, 'widget', targetId),
        kind: 'widget',
        rect: dockRectOf(article.getBoundingClientRect()),
        regionRect,
        regionDepth,
        ...(header ? { headerRect: dockRectOf(header.getBoundingClientRect()) } : {}),
        ...(content ? { bodyRect: dockRectOf(content.getBoundingClientRect()) } : {}),
        ...(wrapper.dataset.pomegranateShelf === undefined ? {} : { shelfId: wrapper.dataset.pomegranateShelf }),
        order: Number(wrapper.dataset.pomegranateOrder ?? 0),
        targetInstanceId: targetId,
        ...(group?.dataset.widgetGroupId === undefined ? {} : { groupId: group.dataset.widgetGroupId }),
        label: article.getAttribute('aria-label') ?? targetId
      };
      targets.push(target);
      if (group) {
        const tabs = group.querySelector<HTMLElement>(
          ':scope > .widget-group-tabs, :scope > [data-widget-group-header] > .widget-group-tabs'
        );
        if (tabs) targets.push({
          ...target,
          id: dockTargetKey(owner, 'group-header', group.dataset.widgetGroupId ?? targetId),
          kind: 'group-header',
          rect: dockRectOf(tabs.getBoundingClientRect())
        });
      }
    }
    if (otherWidgets === 0) targets.push({
      ...owner,
      id: dockTargetKey(owner, 'region'),
      kind: 'region',
      rect: regionRect,
      regionRect,
      regionDepth,
      empty: true,
      label: `Dock in ${region.getAttribute('aria-label') ?? owner.regionId}`
    });
  }
  return targets;
}

function positionFixed(element: HTMLElement, rect: DockRect) {
  element.style.left = `${rect.x}px`;
  element.style.top = `${rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}

function ownerMatches(region: HTMLElement, intent: DockIntent): boolean {
  const panelId = region.closest<HTMLElement>('[data-pomegranate-panel]')?.dataset.pomegranatePanel;
  if (panelId !== intent.panelId || region.dataset.pomegranateRegionSurface !== intent.regionId) return false;
  const subPanelId = region.closest<HTMLElement>('[data-sub-panel]')?.dataset.subPanel;
  if (subPanelId !== intent.subPanelId) return false;
  const laneText = region.dataset.subPanelLane;
  const lane = laneText === undefined ? undefined : Number(laneText);
  if (lane !== intent.lane) return false;
  const columnText = region.dataset.dockColumn;
  const dockColumn = columnText === undefined ? undefined : Number(columnText);
  return dockColumn === intent.dockColumn;
}

export function createDockPreviewController(surface: HTMLElement): DockPreviewController {
  const ownerDocument = surface.ownerDocument;
  const overlayOwner = surface.closest<HTMLElement>('main[data-pom-theme-root]') ?? ownerDocument.body;
  const overlay = ownerDocument.createElement('div');
  overlay.className = 'widget-drop-overlay';
  overlay.dataset.pomPart = 'widget.drop-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlayOwner.append(overlay);
  let slot: HTMLElement | null = null;
  let slotIntentKey: string | null = null;

  const regionForIntent = (intent: DockIntent) => (
    [...surface.querySelectorAll<HTMLElement>('[data-pomegranate-region-surface]')]
      .find((region) => ownerMatches(region, intent)) ?? null
  );

  const clearSlot = () => {
    slot?.remove();
    slot = null;
    slotIntentKey = null;
  };

  const syncSlot = (intent: DockIntent | null): DockIntent | null => {
    if (!intent || intent.kind === 'tab') {
      clearSlot();
      return intent;
    }
    const region = regionForIntent(intent);
    if (!region) {
      clearSlot();
      return intent;
    }
    if (!slot) {
      slot = ownerDocument.createElement('div');
      slot.className = 'widget-dock-preview-slot';
      slot.dataset.pomPart = 'widget.dock-slot';
      slot.setAttribute('aria-hidden', 'true');
    }
    slot.dataset.dropIntent = intent.kind;
    slot.dataset.dropRegion = intent.regionId;
    if (intent.kind === 'insert-before' || intent.kind === 'insert-after') {
      slotIntentKey = intent.key;
      return positionWidgetInsertion(slot, region, intent);
    }
    delete slot.dataset.dropWidgetBoundary;
    slot.style.cssText = '';
    slot.style.setProperty('--pom-dock-preview-size', `${Math.max(72, Math.min(112, intent.previewRect.height))}px`);

    if (slotIntentKey !== intent.key || !slot.isConnected) {
      const shelves = [...region.querySelectorAll<HTMLElement>(':scope > .dock-shelf')];
      if (intent.kind === 'shelf') {
        const before = shelves.find(shelf => Number(shelf.dataset.pomegranateShelfOrder) >= (intent.insertOrder ?? Infinity));
        if (before) region.insertBefore(slot, before);
        else region.append(slot);
      } else region.append(slot);
      slotIntentKey = intent.key;
    }
    const slotRect = dockRectOf(slot.getBoundingClientRect());
    return slotRect.width > 0 && slotRect.height > 0 ? { ...intent, previewRect: slotRect } : intent;
  };

  const paint = (targets: readonly DockTarget[], intent: DockIntent | null) => {
    overlay.replaceChildren();
    for (const target of targets) {
      if (target.kind !== 'rail') continue;
      const rail = ownerDocument.createElement('div');
      rail.className = 'widget-drop-rail';
      rail.dataset.pomPart = 'widget.drop-rail';
      rail.dataset.dropRegion = target.regionId;
      rail.dataset.dropRailKind = target.railKind ?? 'append';
      rail.dataset.dropInsertOrder = String(target.insertOrder ?? 0);
      if (target.dockColumn !== undefined) rail.dataset.dropColumn = String(target.dockColumn);
      rail.dataset.active = String(intent?.targetId === target.id);
      positionFixed(rail, target.rect);
      const label = ownerDocument.createElement('span');
      label.textContent = target.label ?? 'New shelf';
      rail.append(label);
      overlay.append(rail);
    }
    if (!intent) return;
    const snap = ownerDocument.createElement('div');
    snap.className = 'widget-snap-preview';
    snap.dataset.pomPart = 'widget.snap-preview';
    snap.dataset.dropIntent = intent.kind;
    snap.dataset.dropRegion = intent.regionId;
    if (intent.dockColumn !== undefined) snap.dataset.dropColumn = String(intent.dockColumn);
    positionFixed(snap, intent.previewRect);
    overlay.append(snap);
    if (intent.kind === 'tab') {
      const marker = ownerDocument.createElement('div');
      marker.className = 'widget-tab-insertion';
      marker.dataset.pomPart = 'widget.tab-insertion';
      positionFixed(marker, {
        x: intent.previewRect.x + 8,
        y: intent.previewRect.y + 4,
        width: 2,
        height: Math.max(20, Math.min(32, intent.previewRect.height - 8))
      });
      overlay.append(marker);
    }
    const label = ownerDocument.createElement('div');
    label.className = 'widget-drop-intent-label';
    label.textContent = intent.label;
    positionFixed(label, {
      x: intent.previewRect.x + 12,
      y: intent.previewRect.y + 8,
      width: Math.max(120, Math.min(240, intent.previewRect.width - 24)),
      height: 26
    });
    overlay.append(label);
  };

  return Object.freeze({
    sync(targets: readonly DockTarget[], intent: DockIntent | null) {
      const synced = syncSlot(intent);
      paint(targets, synced);
      return synced;
    },
    clearSlot,
    getSlotRect: () => slot?.getBoundingClientRect() ?? null,
    destroy() {
      clearSlot();
      overlay.remove();
    }
  });
}
