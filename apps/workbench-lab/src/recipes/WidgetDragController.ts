import { asPanelId, asWidgetInstanceId } from '@pomegranate-ui/contracts';
import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';

import {
  clampHeldRect,
  dockRevealSide,
  resolveDockIntent,
  stabilizeDockIntent,
  type DockIntent,
  type DockPoint,
  type DockRect,
  type DockTarget
} from './widget-docking.js';
import { collectDockTargets } from './widget-docking-dom.js';
import { dragActivationDecision, tabDragDecision } from './tab-reorder.js';

interface DragCandidate {
  readonly pointerId: number;
  readonly handle: HTMLElement;
  readonly root: HTMLElement;
  visualRoot: HTMLElement;
  surface: HTMLElement;
  readonly startX: number;
  readonly startY: number;
  readonly originRect: DockRect;
  readonly pointerType: string;
  readonly startedAt: number;
  grabX: number;
  grabY: number;
  readonly origin: WidgetFrameProjection['placement'];
  active: boolean;
  held: HTMLElement | null;
  overlay: HTMLElement | null;
  slot: HTMLElement | null;
  slotIntentKey: string | null;
  intent: DockIntent | null;
  canFloat: boolean;
  committing: boolean;
  sourceMounted: boolean;
  switchingPanel: boolean;
  hoveredPanelTab: HTMLButtonElement | null;
  hoveredPanelTimer: number | null;
  lastPoint: DockPoint;
}

export interface WidgetDragController {
  pointerDown(event: PointerEvent): void;
  pointerMove(event: PointerEvent): void;
  pointerUp(event: PointerEvent): void;
  pointerCancel(event: PointerEvent): void;
  destroy(): void;
}

interface WidgetDragControllerOptions {
  readonly getFrame: () => WidgetFrameProjection;
  readonly getStore: () => WorkbenchStore;
  readonly setDragging: (dragging: boolean) => void;
  readonly activation?: 'any' | 'vertical-tearoff';
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
const panelHoverDelayMs = 350;

function rectOf(rect: DOMRectReadOnly): DockRect {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

function pointInside(point: DockPoint, rect: DockRect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width
    && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function positionFixed(element: HTMLElement, rect: DockRect) {
  element.style.left = `${rect.x}px`;
  element.style.top = `${rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}

function makeVisualClone(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('style');
  for (const element of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
    element.removeAttribute('id');
    element.removeAttribute('name');
    element.removeAttribute('for');
    element.removeAttribute('aria-controls');
    element.removeAttribute('aria-labelledby');
    element.removeAttribute('data-pomegranate-widget');
    element.removeAttribute('data-widget-drag-root');
    element.removeAttribute('data-widget-drag-surface');
    element.setAttribute('tabindex', '-1');
    if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement
      || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
      element.disabled = true;
    }
  }
  return clone;
}

function visiblePlacement(frame: WidgetFrameProjection) {
  return frame.placement.kind === 'shelved' ? frame.placement.lastVisible : frame.placement;
}

export function createWidgetDragController(options: WidgetDragControllerOptions): WidgetDragController {
  let candidate: DragCandidate | null = null;
  let handledPointerMove: PointerEvent | null = null;

  function themeRoot(current: DragCandidate) {
    return current.overlay?.closest<HTMLElement>('main[data-pom-theme-root]')
      ?? current.surface.closest<HTMLElement>('main[data-pom-theme-root]')
      ?? document.querySelector<HTMLElement>('main[data-pom-theme-root]');
  }

  function syncSourcePlaceholder(current: DragCandidate, surface: HTMLElement) {
    const sourceId = options.getFrame().instanceId;
    const article = surface.querySelector<HTMLElement>(
      `[data-pomegranate-widget="${CSS.escape(sourceId)}"]`
    );
    const visualRoot = article?.closest<HTMLElement>('[data-widget-type]');
    if (!visualRoot || visualRoot === current.visualRoot) return;
    current.visualRoot.classList.remove('is-widget-dragging');
    delete current.visualRoot.dataset.widgetDragPlaceholder;
    current.visualRoot = visualRoot;
    visualRoot.classList.add('is-widget-dragging');
    visualRoot.dataset.widgetDragPlaceholder = 'true';
  }

  function activeSurface(current: DragCandidate): HTMLElement | null {
    const panelId = options.getStore().getState().activePanelId;
    const root = themeRoot(current);
    if (!panelId || !root) return null;
    const surface = root.querySelector<HTMLElement>(
      `[data-pomegranate-panel="${CSS.escape(panelId)}"]`
    );
    if (surface) {
      current.surface = surface;
      syncSourcePlaceholder(current, surface);
    }
    return surface;
  }

  function clearPanelHover(current: DragCandidate) {
    if (current.hoveredPanelTimer !== null) window.clearTimeout(current.hoveredPanelTimer);
    current.hoveredPanelTimer = null;
    current.hoveredPanelTab?.removeAttribute('data-widget-drag-hover');
    current.hoveredPanelTab = null;
  }

  function panelTabAtPoint(current: DragCandidate, point: DockPoint): HTMLButtonElement | null {
    const root = themeRoot(current);
    if (!root) return null;
    for (const tab of root.querySelectorAll<HTMLButtonElement>('[data-pomegranate-panel-tab] > [role="tab"]')) {
      const rect = rectOf(tab.getBoundingClientRect());
      if (rect.width > 0 && rect.height > 0 && pointInside(point, rect)) return tab;
    }
    return null;
  }

  function finishPanelSwitch(current: DragCandidate, panelId: string) {
    if (candidate !== current) return;
    const surface = activeSurface(current);
    current.switchingPanel = false;
    if (!surface || surface.dataset.pomegranatePanel !== panelId) return;
    updateDropState(current, current.lastPoint);
  }

  function activateHoveredPanel(current: DragCandidate, tab: HTMLButtonElement) {
    if (candidate !== current || !current.active || current.hoveredPanelTab !== tab) return;
    const panelId = tab.closest<HTMLElement>('[data-pomegranate-panel-tab]')?.dataset.pomegranatePanelTab;
    if (!panelId || options.getStore().getState().activePanelId === panelId) {
      clearPanelHover(current);
      return;
    }
    current.switchingPanel = true;
    current.intent = null;
    current.canFloat = false;
    removeSlot(current);
    paintTargets(current, [], null);
    clearPanelHover(current);
    const result = options.getStore().dispatch({ type: 'panel.activate', panelId: asPanelId(panelId) });
    if (!result.ok) {
      current.switchingPanel = false;
      return;
    }
    window.requestAnimationFrame(() => finishPanelSwitch(current, panelId));
  }

  function syncPanelHover(current: DragCandidate, point: DockPoint) {
    const tab = panelTabAtPoint(current, point);
    const targetPanelId = tab?.closest<HTMLElement>('[data-pomegranate-panel-tab]')?.dataset.pomegranatePanelTab;
    if (!tab || !targetPanelId || targetPanelId === options.getStore().getState().activePanelId) {
      clearPanelHover(current);
      return;
    }
    if (current.hoveredPanelTab === tab) return;
    clearPanelHover(current);
    current.hoveredPanelTab = tab;
    tab.dataset.widgetDragHover = 'true';
    current.hoveredPanelTimer = window.setTimeout(
      () => activateHoveredPanel(current, tab),
      panelHoverDelayMs
    );
  }

  function createHeldState(current: DragCandidate, event: PointerEvent) {
    const box = current.visualRoot.getBoundingClientRect();
    const themeRoot = current.surface.closest<HTMLElement>('main[data-pom-theme-root]');
    const overlayOwner = themeRoot ?? document.body;
    const width = Math.min(Math.max(230, box.width), 360, Math.max(180, window.innerWidth - 16));
    const height = Math.min(Math.max(120, box.height), 340, Math.max(120, window.innerHeight - 16));
    const held = document.createElement('div');
    held.className = 'widget-drag-preview';
    held.dataset.pomPart = 'widget.drag-preview';
    held.setAttribute('aria-hidden', 'true');
    held.inert = true;
    held.append(makeVisualClone(current.visualRoot));
    held.style.width = `${width}px`;
    held.style.height = `${height}px`;
    overlayOwner.append(held);

    const overlay = document.createElement('div');
    overlay.className = 'widget-drop-overlay';
    overlay.dataset.pomPart = 'widget.drop-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlayOwner.append(overlay);

    current.held = held;
    current.overlay = overlay;
    current.visualRoot.classList.add('is-widget-dragging');
    current.visualRoot.dataset.widgetDragPlaceholder = 'true';
    document.body.classList.add('pom-widget-drag-active');
    options.setDragging(true);
    updateHeldPosition(current, event);
  }

  function updateHeldPosition(current: DragCandidate, event: PointerEvent) {
    if (!current.held) return;
    const width = Number.parseFloat(current.held.style.width);
    const height = Number.parseFloat(current.held.style.height);
    const original = current.visualRoot.getBoundingClientRect();
    const scaleX = original.width > 0 ? width / original.width : 1;
    const scaleY = original.height > 0 ? height / original.height : 1;
    const next = clampHeldRect(
      { x: event.clientX, y: event.clientY },
      { x: current.grabX * scaleX, y: current.grabY * scaleY },
      { width, height },
      { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }
    );
    current.held.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
  }

  function activeOwner(current: DragCandidate, region: HTMLElement) {
    const state = options.getStore().getState();
    const panelId = region.closest<HTMLElement>('[data-pomegranate-panel]')?.dataset.pomegranatePanel;
    const panel = state.panels.find((entry) => entry.id === panelId);
    const laneText = region.dataset.subPanelLane;
    const lane = laneText === undefined ? undefined : Number(laneText);
    return {
      panelId: panel?.id ?? state.activePanelId ?? options.getFrame().placement.panelId,
      ...(panel?.activeSubPanelId === undefined ? {} : { subPanelId: panel.activeSubPanelId }),
      ...(lane === undefined || !Number.isInteger(lane) ? {} : { lane }),
      regionId: region.dataset.pomegranateRegionSurface ?? ''
    };
  }

  function collectTargets(current: DragCandidate): DockTarget[] {
    const surface = activeSurface(current);
    if (!surface) return [];
    return [...collectDockTargets(surface, {
      sourceInstanceId: options.getFrame().instanceId,
      sourceElement: current.visualRoot,
      ownerForRegion: (region) => activeOwner(current, region)
    })];
  }

  function regionForIntent(current: DragCandidate, intent: DockIntent) {
    const surface = activeSurface(current);
    if (!surface || surface.dataset.pomegranatePanel !== intent.panelId) return null;
    return [...surface.querySelectorAll<HTMLElement>('[data-pomegranate-region-surface]')]
      .find((region) => {
        const owner = activeOwner(current, region);
        return owner.panelId === intent.panelId
          && owner.subPanelId === intent.subPanelId
          && owner.lane === intent.lane
          && owner.regionId === intent.regionId;
      }) ?? null;
  }

  function shelfForTarget(region: HTMLElement, intent: DockIntent) {
    if (intent.shelfId) {
      const direct = [...region.querySelectorAll<HTMLElement>(':scope > .dock-shelf')]
        .find((shelf) => shelf.dataset.pomegranateShelf === intent.shelfId);
      if (direct) return direct;
    }
    if (!intent.targetInstanceId) return null;
    return region.querySelector<HTMLElement>(`[data-pomegranate-widget="${CSS.escape(intent.targetInstanceId)}"]`)
      ?.closest<HTMLElement>('.dock-shelf') ?? null;
  }

  function removeSlot(current: DragCandidate) {
    current.slot?.remove();
    current.slot = null;
    current.slotIntentKey = null;
  }

  function syncDockSlot(current: DragCandidate, intent: DockIntent | null): DockIntent | null {
    if (!intent || intent.kind === 'tab') {
      removeSlot(current);
      return intent;
    }
    const region = regionForIntent(current, intent);
    if (!region) {
      removeSlot(current);
      return intent;
    }
    if (!current.slot) {
      const slot = document.createElement('div');
      slot.className = 'widget-dock-preview-slot';
      slot.dataset.pomPart = 'widget.dock-slot';
      slot.setAttribute('aria-hidden', 'true');
      current.slot = slot;
    }
    const slot = current.slot;
    slot.dataset.dropIntent = intent.kind;
    slot.dataset.dropRegion = intent.regionId;
    slot.style.setProperty('--pom-dock-preview-size', `${Math.max(72, Math.min(112, intent.previewRect.height))}px`);

    if (current.slotIntentKey !== intent.key || !slot.isConnected) {
      const shelves = [...region.querySelectorAll<HTMLElement>(':scope > .dock-shelf')];
      if (intent.kind === 'shelf') {
        const before = shelves[intent.insertOrder ?? shelves.length];
        if (before) region.insertBefore(slot, before);
        else region.append(slot);
      } else if (intent.kind === 'insert-before' || intent.kind === 'insert-after') {
        const shelf = shelfForTarget(region, intent);
        if (shelf && intent.kind === 'insert-before') region.insertBefore(slot, shelf);
        else if (shelf) {
          const resizeHandle = shelf.nextElementSibling?.classList.contains('shelf-resize-handle')
            ? shelf.nextElementSibling
            : null;
          (resizeHandle ?? shelf).after(slot);
        } else region.append(slot);
      } else region.append(slot);
      current.slotIntentKey = intent.key;
    }
    const slotRect = rectOf(slot.getBoundingClientRect());
    return slotRect.width > 0 && slotRect.height > 0 ? { ...intent, previewRect: slotRect } : intent;
  }

  function syncCollapsedDockReveal(current: DragCandidate, point: DockPoint) {
    const root = themeRoot(current);
    if (!root) return;
    const surface = activeSurface(current);
    if (!surface) return;
    const side = dockRevealSide(point, rectOf(surface.getBoundingClientRect()), 34);
    const revealLeft = side === 'left' && root.classList.contains('left-collapsed');
    const revealRight = side === 'right' && root.classList.contains('right-collapsed');
    const changed = root.hasAttribute('data-drag-reveal-left') !== revealLeft
      || root.hasAttribute('data-drag-reveal-right') !== revealRight;
    if (revealLeft) root.dataset.dragRevealLeft = 'true';
    else root.removeAttribute('data-drag-reveal-left');
    if (revealRight) root.dataset.dragRevealRight = 'true';
    else root.removeAttribute('data-drag-reveal-right');
    if (changed) {
      removeSlot(current);
      void root.offsetWidth;
    }
  }

  function paintTargets(current: DragCandidate, targets: readonly DockTarget[], intent: DockIntent | null) {
    const overlay = current.overlay;
    if (!overlay) return;
    overlay.replaceChildren();
    for (const target of targets) {
      if (target.kind !== 'rail') continue;
      const rail = document.createElement('div');
      rail.className = 'widget-drop-rail';
      rail.dataset.pomPart = 'widget.drop-rail';
      rail.dataset.dropRegion = target.regionId;
      rail.dataset.dropRailKind = target.railKind;
      rail.dataset.dropInsertOrder = String(target.insertOrder ?? 0);
      rail.dataset.active = String(intent?.targetId === target.id);
      positionFixed(rail, target.rect);
      const label = document.createElement('span');
      label.textContent = target.label ?? 'New shelf';
      rail.append(label);
      overlay.append(rail);
    }
    if (!intent) return;
    const snap = document.createElement('div');
    snap.className = 'widget-snap-preview';
    snap.dataset.pomPart = 'widget.snap-preview';
    snap.dataset.dropIntent = intent.kind;
    snap.dataset.dropRegion = intent.regionId;
    positionFixed(snap, intent.previewRect);
    overlay.append(snap);
    if (intent.kind === 'tab') {
      const marker = document.createElement('div');
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
    const label = document.createElement('div');
    label.className = 'widget-drop-intent-label';
    label.textContent = intent.label;
    positionFixed(label, {
      x: intent.previewRect.x + 12,
      y: intent.previewRect.y + 8,
      width: Math.max(120, Math.min(240, intent.previewRect.width - 24)),
      height: 26
    });
    overlay.append(label);
  }

  function updateDropState(current: DragCandidate, point: DockPoint) {
    syncCollapsedDockReveal(current, point);
    const targets = collectTargets(current);
    const next = resolveDockIntent(point, targets);
    current.intent = stabilizeDockIntent(point, current.intent, next, 10);
    current.intent = syncDockSlot(current, current.intent);
    const surface = activeSurface(current);
    current.canFloat = surface ? pointInside(point, rectOf(surface.getBoundingClientRect())) : false;
    paintTargets(current, targets, current.intent);
    current.held?.toggleAttribute('data-float-ready', current.intent === null && current.canFloat);
  }

  function removeGlobalListeners(current: DragCandidate) {
    window.removeEventListener('keydown', escapeCancel);
    window.removeEventListener('blur', blurCancel);
    window.removeEventListener('pointermove', windowPointerMove);
    window.removeEventListener('pointerup', windowPointerUp);
    window.removeEventListener('pointercancel', windowPointerCancel);
    current.handle.removeEventListener('lostpointercapture', lostCapture);
  }

  function cleanup() {
    if (!candidate) return;
    const current = candidate;
    const root = themeRoot(current);
    clearPanelHover(current);
    current.visualRoot.classList.remove('is-widget-dragging');
    delete current.visualRoot.dataset.widgetDragPlaceholder;
    current.held?.remove();
    current.overlay?.remove();
    removeSlot(current);
    root?.removeAttribute('data-drag-reveal-left');
    root?.removeAttribute('data-drag-reveal-right');
    document.body.classList.remove('pom-widget-drag-active');
    removeGlobalListeners(current);
    if (current.sourceMounted) options.setDragging(false);
    candidate = null;
  }

  function escapeCancel(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    cleanup();
  }

  function lostCapture() {
    // Pointer capture can be released when the source becomes visually vacant.
    // Window-level pointer completion remains authoritative for commit/cancel.
  }

  function blurCancel() {
    if (candidate && !candidate.committing) cleanup();
  }

  function commitIntent(current: DragCandidate) {
    if (!current.intent) return;
    current.committing = true;
    const held = current.held;
    const target = current.slot?.getBoundingClientRect() ?? current.intent.previewRect;
    const accepted = acceptIntent(current.intent);
    if (!accepted) {
      cleanup();
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!held || reduceMotion) {
      cleanup();
      return;
    }
    held.dataset.dropCommitting = 'true';
    const heldRect = held.getBoundingClientRect();
    const scaleX = Math.max(.08, target.width / Math.max(1, heldRect.width));
    const scaleY = Math.max(.08, target.height / Math.max(1, heldRect.height));
    const animation = held.animate([
      { transform: getComputedStyle(held).transform, opacity: .9 },
      { transform: `translate3d(${target.x}px, ${target.y}px, 0) scale(${scaleX}, ${scaleY})`, opacity: .42 }
    ], { duration: 150, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    void animation.finished.catch(() => undefined).then(() => {
      if (candidate !== current) return;
      cleanup();
    });
  }

  function finishPointerUp(event: PointerEvent) {
    if (!candidate || candidate.pointerId !== event.pointerId || candidate.committing) return;
    const current = candidate;
    if (current.active) {
      if (current.intent) {
        commitIntent(current);
        return;
      }
      if (current.canFloat) floatAt(current, event);
    }
    cleanup();
  }

  function finishPointerCancel(event: PointerEvent) {
    if (!candidate || candidate.pointerId !== event.pointerId || candidate.committing) return;
    cleanup();
  }

  function windowPointerUp(event: PointerEvent) {
    finishPointerUp(event);
  }

  function windowPointerMove(event: PointerEvent) {
    movePointer(event);
  }

  function windowPointerCancel(event: PointerEvent) {
    finishPointerCancel(event);
  }

  function movePointer(event: PointerEvent) {
    if (handledPointerMove === event) return;
    handledPointerMove = event;
    if (!candidate || candidate.pointerId !== event.pointerId) return;
    candidate.lastPoint = { x: event.clientX, y: event.clientY };
    const dx = event.clientX - candidate.startX;
    const dy = event.clientY - candidate.startY;
    const decision = options.activation === 'vertical-tearoff'
      ? tabDragDecision({
        dx,
        dy,
        pointerType: candidate.pointerType,
        elapsedMs: event.timeStamp - candidate.startedAt,
        allowTearOff: true
      })
      : dragActivationDecision({
        dx,
        dy,
        pointerType: candidate.pointerType,
        elapsedMs: event.timeStamp - candidate.startedAt
      });
    if (decision === 'cancelled') {
      cleanup();
      return;
    }
    const shouldActivate = decision === 'tear-off' || decision === 'ready';
    if (!candidate.active && shouldActivate) {
      const currentVisualRoot = candidate.root.closest<HTMLElement>('[data-widget-type]')
        ?? candidate.root.closest<HTMLElement>('[data-widget-group]')?.querySelector<HTMLElement>('[data-widget-type]');
      if (currentVisualRoot) {
        const box = currentVisualRoot.getBoundingClientRect();
        candidate.visualRoot = currentVisualRoot;
        candidate.grabX = candidate.startX - box.left;
        candidate.grabY = candidate.startY - box.top;
      }
      candidate.active = true;
      createHeldState(candidate, event);
    }
    if (!candidate.active) return;
    updateHeldPosition(candidate, event);
    syncPanelHover(candidate, candidate.lastPoint);
    updateDropState(candidate, candidate.lastPoint);
  }

  function floatAt(current: DragCandidate, event: PointerEvent) {
    const frame = options.getFrame();
    const store = options.getStore();
    const state = store.getState();
    const surface = activeSurface(current);
    const panelId = surface?.dataset.pomegranatePanel;
    if (!surface || !panelId) return;
    const panel = state.panels.find((entry) => entry.id === panelId);
    if (!panel) return;
    const surfaceBox = surface.getBoundingClientRect();
    const rootBox = current.visualRoot.isConnected
      ? rectOf(current.visualRoot.getBoundingClientRect())
      : current.originRect;
    const width = frame.placement.kind === 'floating' ? frame.placement.width : Math.min(420, Math.max(320, rootBox.width));
    const height = frame.placement.kind === 'floating' ? frame.placement.height : Math.min(520, Math.max(240, rootBox.height));
    const maxX = Math.max(8, surfaceBox.width - width - 8);
    const maxY = Math.max(8, surfaceBox.height - height - 8);
    const x = clamp(event.clientX - surfaceBox.left - current.grabX, 8, maxX);
    const y = clamp(event.clientY - surfaceBox.top - current.grabY, 8, maxY);
    const z = Math.max(0, ...Object.values(state.placements).map((placement) => (
      placement.kind === 'floating' ? placement.z : 0
    ))) + 1;
    const visible = visiblePlacement(frame);
    const subPanelId = panel.activeSubPanelId
      ?? (panel.id === visible.panelId ? visible.subPanelId : undefined);
    store.dispatch({
      type: 'widget.place',
      instanceId: frame.instanceId,
      placement: {
        kind: 'floating',
        panelId: panel.id,
        ...(subPanelId === undefined ? {} : { subPanelId }),
        x,
        y,
        width,
        height,
        z
      }
    });
  }

  function ownerFields(intent: DockIntent) {
    const state = options.getStore().getState();
    const panel = state.panels.find((entry) => entry.id === intent.panelId);
    return panel?.activeSubPanelId === undefined || intent.lane === undefined
      ? {}
      : { subPanelId: panel.activeSubPanelId, lane: intent.lane };
  }

  function createShelfAndPlace(intent: DockIntent, order: number): boolean {
    const frame = options.getFrame();
    const store = options.getStore();
    const shelfId = `${intent.regionId}-shelf-${store.getState().revision + 1}`;
    return store.dispatch({
      type: 'shelf.create-and-place',
      shelf: {
        id: shelfId,
        panelId: asPanelId(intent.panelId),
        regionId: intent.regionId,
        order,
        weight: 1
      },
      instanceId: frame.instanceId,
      placement: {
        kind: 'docked',
        panelId: asPanelId(intent.panelId),
        ...ownerFields(intent),
        regionId: intent.regionId,
        shelfId,
        order: 0
      }
    }).ok;
  }

  function acceptIntent(intent: DockIntent): boolean {
    const frame = options.getFrame();
    const store = options.getStore();
    if (intent.kind === 'tab' && intent.targetInstanceId) {
      const targetId = asWidgetInstanceId(intent.targetInstanceId);
      const target = store.getState().placements[targetId];
      if (target?.kind !== 'docked') return false;
      const source = visiblePlacement(frame);
      if (source.kind !== 'docked'
        || source.panelId !== target.panelId
        || source.subPanelId !== target.subPanelId) {
        const placed = store.dispatch({
          type: 'widget.place',
          instanceId: frame.instanceId,
          placement: {
            kind: 'docked',
            panelId: target.panelId,
            ...(target.subPanelId === undefined || target.lane === undefined ? {} : { subPanelId: target.subPanelId, lane: target.lane }),
            regionId: target.regionId,
            shelfId: target.shelfId,
            order: target.order + 1
          }
        });
        if (!placed.ok) return false;
      }
      return store.dispatch({
        type: 'widget.group',
        instanceId: frame.instanceId,
        targetInstanceId: targetId,
        groupId: target.group?.id ?? intent.groupId ?? `group-${targetId}`
      }).ok;
    }

    if (intent.kind === 'insert-before' || intent.kind === 'insert-after') {
      const state = store.getState();
      const targetShelf = state.shelves.find((shelf) => (
        shelf.panelId === intent.panelId
        && shelf.regionId === intent.regionId
        && shelf.id === intent.shelfId
      ));
      if (!targetShelf) return false;
      return createShelfAndPlace(intent, targetShelf.order + (intent.kind === 'insert-after' ? 1 : 0));
    }

    if (intent.kind === 'shelf') {
      return createShelfAndPlace(intent, intent.insertOrder ?? 0);
    }

    const state = store.getState();
    let shelf = state.shelves
      .filter((entry) => entry.panelId === intent.panelId && entry.regionId === intent.regionId)
      .sort((left, right) => left.order - right.order)[0];
    if (!shelf) {
      const shelfId = 'primary';
      return store.dispatch({
        type: 'shelf.create-and-place',
        shelf: { id: shelfId, panelId: asPanelId(intent.panelId), regionId: intent.regionId, order: 0, weight: 1 },
        instanceId: frame.instanceId,
        placement: {
          kind: 'docked',
          panelId: asPanelId(intent.panelId),
          ...ownerFields(intent),
          regionId: intent.regionId,
          shelfId,
          order: 0
        }
      }).ok;
    }
    if (!shelf) return false;
    return store.dispatch({
      type: 'widget.place',
      instanceId: frame.instanceId,
      placement: {
        kind: 'docked',
        panelId: asPanelId(intent.panelId),
        ...ownerFields(intent),
        regionId: intent.regionId,
        shelfId: shelf.id,
        order: Number.MAX_SAFE_INTEGER
      }
    }).ok;
  }

  return Object.freeze({
    pointerDown(event: PointerEvent) {
      if (event.button !== 0 || candidate) return;
      if (event.pointerType === 'touch'
        && (!(event.target instanceof Element) || !event.target.closest('[data-widget-touch-drag-grip]'))) return;
      const handle = event.currentTarget as HTMLElement;
      const root = handle.closest<HTMLElement>('[data-widget-drag-root], [data-widget-type]');
      const visualRoot = root?.closest<HTMLElement>('[data-widget-type]')
        ?? root?.closest<HTMLElement>('[data-widget-group]')?.querySelector<HTMLElement>('[data-widget-type]')
        ?? root;
      const surface = handle.closest<HTMLElement>('[data-pomegranate-panel]');
      if (!root || !visualRoot || !surface) return;
      const box = visualRoot.getBoundingClientRect();
      candidate = {
        pointerId: event.pointerId,
        handle,
        root,
        visualRoot,
        surface,
        startX: event.clientX,
        startY: event.clientY,
        originRect: rectOf(box),
        pointerType: event.pointerType,
        startedAt: event.timeStamp,
        grabX: event.clientX - box.left,
        grabY: event.clientY - box.top,
        origin: options.getFrame().placement,
        active: false,
        held: null,
        overlay: null,
        slot: null,
        slotIntentKey: null,
        intent: null,
        canFloat: false,
        committing: false,
        sourceMounted: true,
        switchingPanel: false,
        hoveredPanelTab: null,
        hoveredPanelTimer: null,
        lastPoint: { x: event.clientX, y: event.clientY }
      };
      handledPointerMove = null;
      try { handle.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers need no capture. */ }
      handle.addEventListener('lostpointercapture', lostCapture);
      window.addEventListener('keydown', escapeCancel);
      window.addEventListener('blur', blurCancel);
      window.addEventListener('pointermove', windowPointerMove);
      window.addEventListener('pointerup', windowPointerUp);
      window.addEventListener('pointercancel', windowPointerCancel);
      event.preventDefault();
    },

    pointerMove(event: PointerEvent) {
      movePointer(event);
    },

    pointerUp(event: PointerEvent) {
      finishPointerUp(event);
    },

    pointerCancel(event: PointerEvent) {
      finishPointerCancel(event);
    },

    destroy() {
      if (candidate?.switchingPanel) {
        candidate.sourceMounted = false;
        return;
      }
      if (candidate?.committing) {
        removeGlobalListeners(candidate);
        return;
      }
      cleanup();
    }
  });
}
