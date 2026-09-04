import { asWidgetInstanceId } from '@pomegranate-ui/contracts';
import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';

import {
  buildShelfRails,
  clampHeldRect,
  dockRevealSide,
  resolveDockIntent,
  stabilizeDockIntent,
  type DockIntent,
  type DockPoint,
  type DockRect,
  type DockTarget
} from './widget-docking.js';
import { dragActivationDecision, tabDragDecision } from './tab-reorder.js';

interface DragCandidate {
  readonly pointerId: number;
  readonly handle: HTMLElement;
  readonly root: HTMLElement;
  visualRoot: HTMLElement;
  readonly surface: HTMLElement;
  readonly startX: number;
  readonly startY: number;
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
  revealedDock: 'left' | 'right' | null;
  canFloat: boolean;
  committing: boolean;
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
  readonly onExpandDock?: ((edge: 'left' | 'right') => void) | undefined;
  readonly activation?: 'any' | 'vertical-tearoff';
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

function rectOf(rect: DOMRect): DockRect {
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

function visiblePlacement(frame: WidgetFrameProjection) {
  return frame.placement.kind === 'shelved' ? frame.placement.lastVisible : frame.placement;
}

export function createWidgetDragController(options: WidgetDragControllerOptions): WidgetDragController {
  let candidate: DragCandidate | null = null;

  function createHeldState(current: DragCandidate, event: PointerEvent) {
    const box = current.visualRoot.getBoundingClientRect();
    const themeRoot = current.surface.closest<HTMLElement>('main[data-pom-theme-root]');
    const overlayOwner = themeRoot ?? document.body;
    const width = Math.min(Math.max(180, box.width), 280, Math.max(160, window.innerWidth - 16));
    const height = Math.min(42, Math.max(32, window.innerHeight - 16));
    const held = document.createElement('div');
    held.className = 'widget-drag-preview';
    held.dataset.pomPart = 'widget.drag-preview';
    held.dataset.widgetDragType = options.getFrame().instance.type;
    held.setAttribute('aria-hidden', 'true');
    held.inert = true;
    const identity = document.createElement('span');
    identity.className = 'widget-drag-preview-identity';
    identity.textContent = current.visualRoot
      .querySelector<HTMLElement>('[data-pomegranate-widget]')
      ?.getAttribute('aria-label') ?? options.getFrame().title;
    held.append(identity);
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
    const frame = options.getFrame();
    const state = options.getStore().getState();
    const panel = state.panels.find((entry) => entry.id === frame.placement.panelId);
    const laneText = region.dataset.subPanelLane;
    const lane = laneText === undefined ? undefined : Number(laneText);
    return {
      panelId: frame.placement.panelId,
      ...(panel?.activeSubPanelId === undefined ? {} : { subPanelId: panel.activeSubPanelId }),
      ...(lane === undefined || !Number.isInteger(lane) ? {} : { lane }),
      regionId: region.dataset.pomegranateRegionSurface ?? ''
    };
  }

  function collectTargets(current: DragCandidate): DockTarget[] {
    const targets: DockTarget[] = [];
    const sourceId = options.getFrame().instanceId;
    for (const region of current.surface.querySelectorAll<HTMLElement>('[data-pomegranate-region-surface]')) {
      const owner = activeOwner(current, region);
      if (!owner.regionId) continue;
      const regionRect = rectOf(region.getBoundingClientRect());
      if (regionRect.width <= 0 || regionRect.height <= 0) continue;
      const shelves = [...region.querySelectorAll<HTMLElement>(':scope > .dock-shelf')].map((shelf, index) => ({
        id: shelf.dataset.pomegranateShelf ?? `shelf-${index}`,
        order: Number(shelf.dataset.pomegranateShelfOrder ?? index),
        rect: rectOf(shelf.getBoundingClientRect())
      }));
      targets.push(...buildShelfRails(regionRect, shelves, owner));

      let otherWidgets = 0;
      for (const wrapper of region.querySelectorAll<HTMLElement>('[data-widget-type]')) {
        const article = wrapper.querySelector<HTMLElement>('[data-pomegranate-widget]');
        const targetId = article?.dataset.pomegranateWidget;
        if (!article || !targetId || targetId === sourceId || wrapper === current.visualRoot) continue;
        otherWidgets += 1;
        const articleRect = rectOf(article.getBoundingClientRect());
        const header = article.querySelector<HTMLElement>(':scope > header[data-widget-drag-surface]');
        const content = article.querySelector<HTMLElement>(':scope > [data-pom-part="widget.content"]');
        const group = wrapper.closest<HTMLElement>('[data-widget-group]');
        const target: DockTarget = {
          ...owner,
          id: `widget:${targetId}`,
          kind: 'widget',
          rect: articleRect,
          ...(header ? { headerRect: rectOf(header.getBoundingClientRect()) } : {}),
          ...(content ? { bodyRect: rectOf(content.getBoundingClientRect()) } : {}),
          ...(wrapper.dataset.pomegranateShelf === undefined ? {} : { shelfId: wrapper.dataset.pomegranateShelf }),
          order: Number(wrapper.dataset.pomegranateOrder ?? 0),
          targetInstanceId: targetId,
          ...(group?.dataset.widgetGroupId === undefined ? {} : { groupId: group.dataset.widgetGroupId }),
          label: article.getAttribute('aria-label') ?? targetId
        };
        targets.push(target);
        if (group) {
          const tabs = group.querySelector<HTMLElement>(':scope > .widget-group-tabs');
          if (tabs) targets.push({
            ...target,
            id: `group:${group.dataset.widgetGroupId ?? targetId}`,
            kind: 'group-header',
            rect: rectOf(tabs.getBoundingClientRect())
          });
        }
      }
      if (otherWidgets === 0) targets.push({
        ...owner,
        id: `region:${owner.regionId}`,
        kind: 'region',
        rect: regionRect,
        empty: true,
        label: `Dock in ${region.getAttribute('aria-label') ?? owner.regionId}`
      });
    }
    return targets;
  }

  function regionForIntent(current: DragCandidate, intent: DockIntent) {
    return [...current.surface.querySelectorAll<HTMLElement>('[data-pomegranate-region-surface]')]
      .find((region) => region.dataset.pomegranateRegionSurface === intent.regionId) ?? null;
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
    const root = current.surface.closest<HTMLElement>('main[data-pom-theme-root]');
    if (!root) return;
    let revealedDock = current.revealedDock;
    if (revealedDock) {
      const revealedRegion = current.surface.querySelector<HTMLElement>(
        `[data-pomegranate-region-surface="${revealedDock}"]`
      );
      if (!revealedRegion || !pointInside(point, rectOf(revealedRegion.getBoundingClientRect()))) {
        revealedDock = null;
      }
    }
    if (!revealedDock) {
      const side = dockRevealSide(point, rectOf(current.surface.getBoundingClientRect()), 34);
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
  }

  function updateDropState(current: DragCandidate, event: PointerEvent) {
    const point = { x: event.clientX, y: event.clientY };
    syncCollapsedDockReveal(current, point);
    const targets = collectTargets(current);
    const next = resolveDockIntent(point, targets);
    current.intent = stabilizeDockIntent(point, current.intent, next, 10);
    current.intent = syncDockSlot(current, current.intent);
    current.canFloat = pointInside(point, rectOf(current.surface.getBoundingClientRect()));
    paintTargets(current, targets, current.intent);
    current.held?.toggleAttribute('data-float-ready', current.intent === null && current.canFloat);
  }

  function removeGlobalListeners(current: DragCandidate) {
    window.removeEventListener('keydown', escapeCancel);
    window.removeEventListener('blur', blurCancel);
    window.removeEventListener('pointerup', windowPointerUp);
    window.removeEventListener('pointercancel', windowPointerCancel);
    current.handle.removeEventListener('lostpointercapture', lostCapture);
  }

  function cleanup() {
    if (!candidate) return;
    const current = candidate;
    current.visualRoot.classList.remove('is-widget-dragging');
    delete current.visualRoot.dataset.widgetDragPlaceholder;
    current.held?.remove();
    current.overlay?.remove();
    removeSlot(current);
    const themeRoot = current.surface.closest<HTMLElement>('main[data-pom-theme-root]');
    themeRoot?.removeAttribute('data-drag-reveal-left');
    themeRoot?.removeAttribute('data-drag-reveal-right');
    document.body.classList.remove('pom-widget-drag-active');
    removeGlobalListeners(current);
    options.setDragging(false);
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
    if (current.revealedDock === current.intent.regionId) options.onExpandDock?.(current.revealedDock);
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

  function windowPointerCancel(event: PointerEvent) {
    finishPointerCancel(event);
  }

  function floatAt(current: DragCandidate, event: PointerEvent) {
    const frame = options.getFrame();
    const store = options.getStore();
    const state = store.getState();
    const surfaceBox = current.surface.getBoundingClientRect();
    const rootBox = current.visualRoot.getBoundingClientRect();
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
    store.dispatch({
      type: 'widget.place',
      instanceId: frame.instanceId,
      placement: {
        kind: 'floating',
        panelId: frame.placement.panelId,
        ...(visible.subPanelId === undefined ? {} : { subPanelId: visible.subPanelId }),
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
    const panel = state.panels.find((entry) => entry.id === options.getFrame().placement.panelId);
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
        panelId: frame.placement.panelId,
        regionId: intent.regionId,
        order,
        weight: 1
      },
      instanceId: frame.instanceId,
      placement: {
        kind: 'docked',
        panelId: frame.placement.panelId,
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
        shelf.panelId === frame.placement.panelId
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
      .filter((entry) => entry.panelId === frame.placement.panelId && entry.regionId === intent.regionId)
      .sort((left, right) => left.order - right.order)[0];
    if (!shelf) {
      const shelfId = 'primary';
      return store.dispatch({
        type: 'shelf.create-and-place',
        shelf: { id: shelfId, panelId: frame.placement.panelId, regionId: intent.regionId, order: 0, weight: 1 },
        instanceId: frame.instanceId,
        placement: {
          kind: 'docked',
          panelId: frame.placement.panelId,
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
        panelId: frame.placement.panelId,
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
        revealedDock: null,
        canFloat: false,
        committing: false
      };
      try { handle.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers need no capture. */ }
      handle.addEventListener('lostpointercapture', lostCapture);
      window.addEventListener('keydown', escapeCancel);
      window.addEventListener('blur', blurCancel);
      window.addEventListener('pointerup', windowPointerUp);
      window.addEventListener('pointercancel', windowPointerCancel);
      event.preventDefault();
    },

    pointerMove(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
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
      updateDropState(candidate, event);
    },

    pointerUp(event: PointerEvent) {
      finishPointerUp(event);
    },

    pointerCancel(event: PointerEvent) {
      finishPointerCancel(event);
    },

    destroy() {
      if (candidate?.committing) {
        removeGlobalListeners(candidate);
        return;
      }
      cleanup();
    }
  });
}
