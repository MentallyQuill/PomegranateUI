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
import { collectDockTargets, observeDockGeometry, createDockPreviewController, type DockPreviewController } from './widget-docking-dom.js';
import { dragActivationDecision, tabDragDecision } from './tab-reorder.js';
import { animateWidgetPlacement, captureWidgetRects, createDragVisual, finishWidgetMotion, floatingBounds } from './widget-drag-motion.js';

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
  heldOffset: DockPoint;
  floatSize: DockRect;
  stopMotion: (() => void) | null;
  preview: DockPreviewController | null;
  intent: DockIntent | null;
  revealedDock: 'left' | 'right' | null;
  canFloat: boolean;
  committing: boolean;
  sourceMounted: boolean;
  switchingPanel: boolean;
  hoveredPanelTab: HTMLButtonElement | null;
  hoveredPanelTimer: number | null;
  lastPoint: DockPoint;
  stopObserving: (() => void) | null;
}

export interface WidgetDragController {
  pointerDown(event: PointerEvent): void;
  activate(event: PointerEvent): void;
  pointerMove(event: PointerEvent): void;
  pointerUp(event: PointerEvent): void;
  pointerCancel(event: PointerEvent): void;
  destroy(): void;
}

interface WidgetDragControllerOptions {
  readonly getFrame: () => WidgetFrameProjection;
  readonly getStore: () => WorkbenchStore;
  readonly setDragging: (dragging: boolean) => void;
  readonly onExpandDock?: ((edge: 'left' | 'right') => void) | undefined;
  readonly activation?: 'any' | 'vertical-tearoff' | 'manual';
}

const panelHoverDelayMs = 350;

function rectOf(rect: DOMRectReadOnly): DockRect {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

function pointInside(point: DockPoint, rect: DockRect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width
    && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function visiblePlacement(frame: WidgetFrameProjection) {
  return frame.placement.kind === 'shelved' ? frame.placement.lastVisible : frame.placement;
}

export function createWidgetDragController(options: WidgetDragControllerOptions): WidgetDragController {
  let candidate: DragCandidate | null = null;
  let handledPointerMove: PointerEvent | null = null;

  function themeRoot(current: DragCandidate) {
    return current.held?.closest<HTMLElement>('main[data-pom-theme-root]')
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
      if (surface !== current.surface || !current.stopObserving) {
        current.stopObserving?.();
        current.stopObserving = observeDockGeometry(surface, () => {
          if (candidate === current && current.active && !current.committing) updateDropState(current, current.lastPoint);
        });
      }
      current.surface = surface;
      current.preview?.setSurface(surface);
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
    current.preview?.sync([], null);
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
    finishWidgetMotion(document);
    const source = current.visualRoot.closest<HTMLElement>('[data-widget-group]') ?? current.visualRoot;
    const box = source.getBoundingClientRect();
    const themeRoot = current.surface.closest<HTMLElement>('main[data-pom-theme-root]');
    const overlayOwner = themeRoot ?? document.body;
    const scale = Math.min(1, 320 / box.width, 280 / box.height, (window.innerWidth - 16) / box.width, (window.innerHeight - 16) / box.height);
    const width = box.width * scale, height = box.height * scale;
    current.grabX = current.startX - box.x;
    current.grabY = current.startY - box.y;
    current.heldOffset = { x: current.grabX * scale, y: current.grabY * scale };
    const origin = current.origin.kind === 'shelved' ? current.origin.lastVisible : current.origin;
    current.floatSize = { x: 0, y: 0,
      width: origin.kind === 'floating' ? origin.width : Math.min(420, Math.max(320, box.width)),
      height: origin.kind === 'floating' ? origin.height : Math.min(520, Math.max(240, box.height)) };
    const held = document.createElement('div');
    held.className = 'widget-drag-preview';
    held.dataset.pomPart = 'widget.drag-preview';
    held.dataset.widgetDragType = options.getFrame().instance.type;
    held.setAttribute('aria-hidden', 'true');
    held.inert = true;
    const visual = createDragVisual(source, box.width, box.height);
    visual.style.transform = `scale(${scale})`;
    held.append(visual);
    held.style.width = `${width}px`;
    held.style.height = `${height}px`;
    overlayOwner.append(held);

    current.held = held;
    current.preview = createDockPreviewController(current.surface);
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
    const next = clampHeldRect(
      { x: event.clientX, y: event.clientY },
      current.heldOffset,
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
    const columnText = region.dataset.dockColumn;
    const dockColumn = columnText === undefined ? undefined : Number(columnText);
    return {
      panelId: panel?.id ?? state.activePanelId ?? options.getFrame().placement.panelId,
      ...(panel?.activeSubPanelId === undefined ? {} : { subPanelId: panel.activeSubPanelId }),
      ...(lane === undefined || !Number.isInteger(lane) ? {} : { lane }),
      ...(dockColumn === undefined || !Number.isInteger(dockColumn) ? {} : { dockColumn }),
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

  function removeSlot(current: DragCandidate) { current.preview?.clearSlot(); }

  function syncCollapsedDockReveal(current: DragCandidate, point: DockPoint) {
    const root = themeRoot(current);
    if (!root) return;
    const surface = activeSurface(current);
    if (!surface) return;
    let revealedDock = current.revealedDock;
    if (revealedDock) {
      const revealedRegion = surface.querySelector<HTMLElement>(
        `[data-pomegranate-region-surface="${revealedDock}"]`
      );
      if (!revealedRegion || !pointInside(point, rectOf(revealedRegion.getBoundingClientRect()))) {
        revealedDock = null;
      }
    }
    if (!revealedDock) {
      const side = dockRevealSide(point, rectOf(surface.getBoundingClientRect()), 34);
      if (side === 'left' && root.classList.contains('left-collapsed')) revealedDock = 'left';
      if (side === 'right' && root.classList.contains('right-collapsed')) revealedDock = 'right';
    }
    current.revealedDock = revealedDock;
    const revealLeft = revealedDock === 'left';
    const revealRight = revealedDock === 'right';
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

  function updateDropState(current: DragCandidate, point: DockPoint) {
    syncCollapsedDockReveal(current, point);
    const targets = collectTargets(current);
    const next = resolveDockIntent(point, targets);
    current.intent = stabilizeDockIntent(point, current.intent, next, 10);
    const surface = activeSurface(current);
    current.canFloat = surface ? pointInside(point, rectOf(surface.getBoundingClientRect())) : false;
    let floatingRect: DockRect | undefined;
    if (!current.intent && current.canFloat && surface) {
      const surfaceBox = rectOf(surface.getBoundingClientRect());
      const bounds = floatingBounds(surfaceBox, current.floatSize, { x: current.grabX, y: current.grabY }, point);
      floatingRect = { ...bounds, x: bounds.x + surfaceBox.x, y: bounds.y + surfaceBox.y };
    }
    current.intent = current.preview?.sync(targets, current.intent, {
      ...(current.held ? { heldRect: rectOf(current.held.getBoundingClientRect()) } : {}),
      ...(floatingRect ? { floatingRect } : {})
    }) ?? current.intent;
  }

  function removeGlobalListeners(current: DragCandidate) {
    current.stopObserving?.();
    current.stopObserving = null;
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
    candidate = null;
    current.stopMotion?.();
    const root = themeRoot(current);
    clearPanelHover(current);
    current.visualRoot.classList.remove('is-widget-dragging');
    delete current.visualRoot.dataset.widgetDragPlaceholder;
    current.held?.remove();
    current.preview?.destroy();
    removeSlot(current);
    root?.removeAttribute('data-drag-reveal-left');
    root?.removeAttribute('data-drag-reveal-right');
    if (!document.querySelector('.widget-drag-preview:not([data-drop-committing])')) document.body.classList.remove('pom-widget-drag-active');
    removeGlobalListeners(current);
    if (current.sourceMounted) options.setDragging(false);
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

  function commitPlacement(current: DragCandidate, commit: () => boolean) {
    current.committing = true;
    const held = current.held;
    const id = options.getFrame().instanceId;
    const before = captureWidgetRects(document);
    removeGlobalListeners(current);
    clearPanelHover(current);
    removeSlot(current);
    current.preview?.destroy();
    if (!commit()) { cleanup(); return; }
    if (!held) { cleanup(); return; }
    current.stopMotion = animateWidgetPlacement({
      document, held, before,
      destination: () => document.querySelector<HTMLElement>(`[data-pomegranate-widget="${CSS.escape(id)}"]`),
      finished: () => { if (candidate === current) cleanup(); }
    });
  }

  function commitIntent(current: DragCandidate) {
    if (!current.intent) return;
    const intent = current.intent;
    commitPlacement(current, () => {
      const accepted = acceptIntent(intent);
      if (accepted && current.revealedDock === intent.regionId) options.onExpandDock?.(current.revealedDock);
      return accepted;
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
      if (current.canFloat) {
        commitPlacement(current, () => floatAt(current, event));
        return;
      }
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

  function activateCandidate(current: DragCandidate, event: PointerEvent) {
    if (current.active) return;
    const currentVisualRoot = current.root.closest<HTMLElement>('[data-widget-type]')
      ?? current.root.closest<HTMLElement>('[data-widget-group]')?.querySelector<HTMLElement>('[data-widget-type]');
    if (currentVisualRoot) {
      const box = currentVisualRoot.getBoundingClientRect();
      current.visualRoot = currentVisualRoot;
      current.grabX = current.startX - box.left;
      current.grabY = current.startY - box.top;
    }
    current.active = true;
    createHeldState(current, event);
  }

  function updateActiveCandidate(current: DragCandidate, event: PointerEvent) {
    updateHeldPosition(current, event);
    syncPanelHover(current, current.lastPoint);
    updateDropState(current, current.lastPoint);
  }

  function movePointer(event: PointerEvent) {
    if (handledPointerMove === event) return;
    handledPointerMove = event;
    if (!candidate || candidate.committing || candidate.pointerId !== event.pointerId) return;
    candidate.lastPoint = { x: event.clientX, y: event.clientY };
    const dx = event.clientX - candidate.startX;
    const dy = event.clientY - candidate.startY;
    const decision = options.activation === 'manual'
      ? 'pending'
      : options.activation === 'vertical-tearoff'
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
    if (!candidate.active && shouldActivate) activateCandidate(candidate, event);
    if (!candidate.active) return;
    updateActiveCandidate(candidate, event);
  }

  function floatAt(current: DragCandidate, event: PointerEvent) {
    const frame = options.getFrame();
    const store = options.getStore();
    const state = store.getState();
    const surface = activeSurface(current);
    const panelId = surface?.dataset.pomegranatePanel;
    if (!surface || !panelId) return false;
    const panel = state.panels.find((entry) => entry.id === panelId);
    if (!panel) return false;
    const surfaceBox = surface.getBoundingClientRect();
    const { x, y, width, height } = floatingBounds(rectOf(surfaceBox), current.floatSize,
      { x: current.grabX, y: current.grabY }, { x: event.clientX, y: event.clientY });
    const z = Math.max(0, ...Object.values(state.placements).map((placement) => (
      placement.kind === 'floating' ? placement.z : 0
    ))) + 1;
    const visible = visiblePlacement(frame);
    const subPanelId = panel.activeSubPanelId
      ?? (panel.id === visible.panelId ? visible.subPanelId : undefined);
    return store.dispatch({
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
    }).ok;
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
        ...(intent.dockColumn === undefined ? {} : { dockColumn: intent.dockColumn }),
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
    if ((intent.kind === 'tab' || intent.kind === 'insert-before' || intent.kind === 'insert-after') && intent.targetInstanceId) {
      return store.dispatch({
        type: 'widget.place-relative',
        instanceId: frame.instanceId,
        targetInstanceId: asWidgetInstanceId(intent.targetInstanceId),
        relation: intent.kind === 'tab' ? 'tab' : intent.kind === 'insert-before' ? 'before' : 'after'
      }).ok;
    }
    if (intent.kind === 'shelf') {
      return createShelfAndPlace(intent, intent.insertOrder ?? 0);
    }

    const state = store.getState();
    let shelf = state.shelves
      .filter((entry) => entry.panelId === intent.panelId
        && entry.regionId === intent.regionId
        && (entry.dockColumn ?? 0) === (intent.dockColumn ?? 0))
      .sort((left, right) => left.order - right.order)[0];
    if (!shelf) {
      const shelfId = 'primary';
      return store.dispatch({
        type: 'shelf.create-and-place',
        shelf: {
          id: shelfId,
          panelId: asPanelId(intent.panelId),
          regionId: intent.regionId,
          ...(intent.dockColumn === undefined ? {} : { dockColumn: intent.dockColumn }),
          order: 0,
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
      finishWidgetMotion(document);
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
        heldOffset: { x: 0, y: 0 },
        floatSize: rectOf(box),
        stopMotion: null,
        preview: null,
        intent: null,
        revealedDock: null,
        canFloat: false,
        committing: false,
        sourceMounted: true,
        switchingPanel: false,
        hoveredPanelTab: null,
        hoveredPanelTimer: null,
        lastPoint: { x: event.clientX, y: event.clientY },
        stopObserving: null
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

    activate(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      candidate.lastPoint = { x: event.clientX, y: event.clientY };
      activateCandidate(candidate, event);
      updateActiveCandidate(candidate, event);
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
        candidate.sourceMounted = false;
        removeGlobalListeners(candidate);
        return;
      }
      cleanup();
    }
  });
}
