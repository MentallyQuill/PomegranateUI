import type { WidgetManifest } from '@pomegranate-ui/contracts';

import {
  dockRevealSide,
  resolveDockIntent,
  stabilizeDockIntent,
  type DockIntent,
  type DockPoint,
  type DockTarget
} from './widget-docking.js';
import {
  collectDockTargets,
  createDockPreviewController,
  dockRectOf,
  type DockPreviewController
} from './widget-docking-dom.js';

export type CatalogPlacementInput = 'pointer' | 'keyboard';
export type CatalogPlacementPhase = 'idle' | 'pressing' | 'lifted';

export interface CatalogPlacementTargetIdentity {
  readonly id: string;
  readonly panelId: string;
  readonly regionId: string;
  readonly regionRole: string;
  readonly shelfId: string;
  readonly subPanelId?: string;
  readonly lane?: number;
  readonly dockColumn?: number;
}

export interface CatalogPlacementTarget {
  readonly identity: CatalogPlacementTargetIdentity;
  readonly rect: DOMRectReadOnly;
  readonly element: HTMLElement;
}

export interface CatalogPlacementProxyState {
  readonly input: CatalogPlacementInput;
  readonly manifestType: string;
  readonly title: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export interface CatalogPlacementState {
  readonly phase: CatalogPlacementPhase;
  readonly input: CatalogPlacementInput | null;
  readonly proxy: CatalogPlacementProxyState | null;
  readonly targets: readonly CatalogPlacementTarget[];
  readonly selectedTargetId: string | null;
  readonly instruction: string;
}

export interface CatalogPlacementCatalog {
  suspend(): void;
  resume(): void;
}

export interface CatalogPlacementControllerOptions {
  readonly catalog: CatalogPlacementCatalog;
  readonly getTargetRoot: () => ParentNode | null;
  readonly getInstanceCount: (manifest: WidgetManifest) => number;
  readonly isCompatibleTarget: (manifest: WidgetManifest, target: HTMLElement) => boolean;
  readonly isPotentialDockTarget?: (manifest: WidgetManifest, target: HTMLElement) => boolean;
  readonly onCommit: (manifest: WidgetManifest, target: CatalogPlacementTarget) => void;
  readonly onDockCommit?: (manifest: WidgetManifest, intent: DockIntent) => void;
  readonly onAnnounce?: (message: string) => void;
  readonly captureScrollAnchor?: () => unknown;
  readonly restoreScrollAnchor?: (anchor: unknown) => void;
  readonly restoreOriginFocus?: (origin: HTMLElement) => void;
  readonly requestTargetFocus?: (target: HTMLElement) => void;
}

export interface CatalogPlacementController {
  getState(): CatalogPlacementState;
  subscribe(listener: (state: CatalogPlacementState) => void): () => void;
  pointerDown(event: PointerEvent, manifest: WidgetManifest, origin: HTMLElement): boolean;
  keyDown(event: KeyboardEvent, manifest: WidgetManifest, origin: HTMLElement): boolean;
  cancel(): void;
  consumeClick(): boolean;
  destroy(): void;
}

interface PointerCandidate {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly startX: number;
  readonly startY: number;
  readonly manifest: WidgetManifest;
  readonly origin: HTMLElement;
  readonly document: Document;
  holdTimer: ReturnType<typeof setTimeout> | null;
  captured: boolean;
}

const TARGET_SELECTOR = '[data-pomegranate-region-surface]';
const POINTER_LIFT_THRESHOLD = 6;
const CLICK_SUPPRESSION_MS = 400;

const IDLE_STATE: CatalogPlacementState = Object.freeze({
  phase: 'idle',
  input: null,
  proxy: null,
  targets: Object.freeze([]),
  selectedTargetId: null,
  instruction: ''
});

function targetIdentity(element: HTMLElement, manifest: WidgetManifest): CatalogPlacementTargetIdentity | null {
  const panel = element.closest<HTMLElement>('[data-pomegranate-panel]');
  const panelId = panel?.dataset.pomegranatePanel;
  const regionId = element.dataset.pomegranateRegionSurface;
  const regionRole = element.dataset.pomegranateRegionRole
    ?? element.closest<HTMLElement>('[data-pomegranate-region-role]')?.dataset.pomegranateRegionRole;
  if (!panelId || !regionId || !regionRole) return null;
  const subPanel = element.closest<HTMLElement>('[data-sub-panel]')?.dataset.subPanel;
  const rawLane = element.dataset.subPanelLane;
  const lane = rawLane === undefined ? undefined : Number(rawLane);
  const rawDockColumn = element.dataset.dockColumn;
  const dockColumn = rawDockColumn === undefined ? undefined : Number(rawDockColumn);
  const shelfId = manifest.defaultPlacement.kind === 'docked' ? manifest.defaultPlacement.shelfId : 'primary';
  const validLane = typeof lane === 'number' && Number.isInteger(lane) && lane >= 0 ? lane : undefined;
  const validDockColumn = typeof dockColumn === 'number' && Number.isInteger(dockColumn) && dockColumn >= 0
    ? dockColumn
    : undefined;
  const identity = {
    id: JSON.stringify([
      panelId,
      subPanel ?? null,
      regionId,
      validLane ?? null,
      ...(validDockColumn === undefined ? [] : [validDockColumn]),
      shelfId
    ]),
    panelId,
    regionId,
    regionRole,
    shelfId,
    ...(subPanel ? { subPanelId: subPanel } : {}),
    ...(validDockColumn === undefined ? {} : { dockColumn: validDockColumn })
  };
  return validLane !== undefined
    ? Object.freeze({ ...identity, lane: validLane })
    : Object.freeze(identity);
}

function rectSnapshot(rect: DOMRectReadOnly): DOMRectReadOnly {
  return Object.freeze({
    x: rect.x,
    y: rect.y,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    toJSON: () => ({
      x: rect.x,
      y: rect.y,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height
    })
  });
}

export function createCatalogPlacementController(
  options: CatalogPlacementControllerOptions
): CatalogPlacementController {
  let state = IDLE_STATE;
  let candidate: PointerCandidate | null = null;
  let suspended = false;
  let suppressNextClick = false;
  let clickSuppressionTimer: ReturnType<typeof setTimeout> | null = null;
  let savedScrollAnchor: unknown;
  let dockTargets: readonly DockTarget[] = Object.freeze([]);
  let dockIntent: DockIntent | null = null;
  let dockPreview: DockPreviewController | null = null;
  const listeners = new Set<(state: CatalogPlacementState) => void>();
  const targetAttributes = new Map<HTMLElement, {
    readonly placementTarget: string | null;
    readonly tabindex: string | null;
    readonly role: string | null;
    readonly ariaLabel: string | null;
    readonly placementClass: boolean;
    readonly activeClass: boolean;
  }>();

  const publish = (next: CatalogPlacementState) => {
    state = next;
    for (const listener of [...listeners]) {
      try {
        listener(state);
      } catch {
        // A presentation listener cannot interrupt placement cleanup or siblings.
      }
    }
  };

  const clearClickSuppression = () => {
    if (clickSuppressionTimer !== null) clearTimeout(clickSuppressionTimer);
    clickSuppressionTimer = null;
    suppressNextClick = false;
  };

  const suppressClickBriefly = () => {
    clearClickSuppression();
    suppressNextClick = true;
    clickSuppressionTimer = setTimeout(() => {
      clickSuppressionTimer = null;
      suppressNextClick = false;
    }, CLICK_SUPPRESSION_MS);
  };

  const removePointerListeners = () => {
    const activeCandidate = candidate;
    const ownerDocument = activeCandidate?.document;
    if (!ownerDocument) return;
    if (activeCandidate.holdTimer !== null) clearTimeout(activeCandidate.holdTimer);
    activeCandidate.holdTimer = null;
    ownerDocument.removeEventListener('pointermove', handlePointerMove);
    ownerDocument.removeEventListener('pointerup', handlePointerEnd);
    ownerDocument.removeEventListener('pointercancel', handlePointerEnd);
    ownerDocument.removeEventListener('touchmove', handleTouchMove);
    ownerDocument.removeEventListener('scroll', handleScroll, true);
    ownerDocument.removeEventListener('keydown', handleDocumentKeyDown);
    activeCandidate.origin.removeEventListener('lostpointercapture', handleLostPointerCapture);
    activeCandidate.origin.ownerDocument.defaultView?.removeEventListener('blur', handleWindowBlur);
    if (activeCandidate.captured) {
      try {
        if (!activeCandidate.origin.hasPointerCapture || activeCandidate.origin.hasPointerCapture(activeCandidate.pointerId)) {
          activeCandidate.origin.releasePointerCapture?.(activeCandidate.pointerId);
        }
      } catch {
        // Capture may already have been released by the user agent.
      }
      activeCandidate.captured = false;
    }
  };

  const clearTargets = () => {
    for (const target of state.targets) {
      const previous = targetAttributes.get(target.element);
      if (!previous) continue;
      for (const [attribute, value] of [
        ['data-catalog-placement-target', previous?.placementTarget ?? null],
        ['tabindex', previous?.tabindex ?? null],
        ['role', previous?.role ?? null],
        ['aria-label', previous?.ariaLabel ?? null]
      ] as const) {
        if (value === null) target.element.removeAttribute(attribute);
        else target.element.setAttribute(attribute, value);
      }
      target.element.classList.toggle('is-catalog-placement-target', previous?.placementClass ?? false);
      target.element.classList.toggle('is-catalog-target-active', previous?.activeClass ?? false);
      targetAttributes.delete(target.element);
    }
  };

  const releasePointerCaptureBeforeLift = () => {
    const activeCandidate = candidate;
    if (!activeCandidate?.captured || activeCandidate.pointerType !== 'touch') return;
    activeCandidate.origin.removeEventListener('lostpointercapture', handleLostPointerCapture);
    try {
      if (!activeCandidate.origin.hasPointerCapture || activeCandidate.origin.hasPointerCapture(activeCandidate.pointerId)) {
        activeCandidate.origin.releasePointerCapture?.(activeCandidate.pointerId);
      }
    } catch {
      // The user agent may already have released capture while the hold settled.
    }
    activeCandidate.captured = false;
  };

  const reset = () => {
    const origin = candidate?.origin ?? null;
    const ownerDocument = candidate?.document ?? null;
    const targetRoot = options.getTargetRoot();
    const themeRoot = targetRoot instanceof HTMLElement
      ? targetRoot.closest<HTMLElement>('main[data-pom-theme-root]')
      : null;
    const input = state.input;
    const anchor = savedScrollAnchor;
    removePointerListeners();
    clearTargets();
    dockPreview?.destroy();
    dockPreview = null;
    dockTargets = Object.freeze([]);
    dockIntent = null;
    ownerDocument?.body.classList.remove('pom-widget-drag-active');
    themeRoot?.removeAttribute('data-drag-reveal-left');
    themeRoot?.removeAttribute('data-drag-reveal-right');
    origin?.classList.remove('is-catalog-drag-origin');
    candidate = null;
    publish(IDLE_STATE);
    if (suspended) {
      suspended = false;
      options.catalog.resume();
      options.restoreScrollAnchor?.(anchor);
      if (input === 'keyboard' && origin) options.restoreOriginFocus?.(origin);
    }
    savedScrollAnchor = undefined;
  };

  const compatibleTargets = (
    manifest: WidgetManifest,
    predicate = options.isCompatibleTarget
  ): readonly CatalogPlacementTarget[] => {
    const root = options.getTargetRoot();
    if (!root) return Object.freeze([]);
    return Object.freeze([...root.querySelectorAll<HTMLElement>(TARGET_SELECTOR)]
      .filter((element) => predicate(manifest, element))
      .flatMap((element) => {
        const identity = targetIdentity(element, manifest);
        return identity ? [Object.freeze({ identity, rect: rectSnapshot(element.getBoundingClientRect()), element })] : [];
      }));
  };

  const compatibleDockTargets = (
    manifest: WidgetManifest,
    compatibleRegions: readonly CatalogPlacementTarget[]
  ): readonly DockTarget[] => {
    const root = options.getTargetRoot();
    if (!(root instanceof HTMLElement)) return Object.freeze([]);
    return Object.freeze(collectDockTargets(root, {
      regions: compatibleRegions.map(({ element }) => element),
      ownerForRegion: (region) => {
        const identity = targetIdentity(region, manifest);
        return identity ? {
          panelId: identity.panelId,
          ...(identity.subPanelId === undefined ? {} : { subPanelId: identity.subPanelId }),
          ...(identity.lane === undefined ? {} : { lane: identity.lane }),
          ...(identity.dockColumn === undefined ? {} : { dockColumn: identity.dockColumn }),
          regionId: identity.regionId
        } : null;
      }
    }));
  };

  const syncCollapsedDockReveal = (point: DockPoint) => {
    const targetRoot = options.getTargetRoot();
    if (!(targetRoot instanceof HTMLElement)) return;
    const themeRoot = targetRoot.closest<HTMLElement>('main[data-pom-theme-root]');
    if (!themeRoot) return;
    const side = dockRevealSide(point, dockRectOf(targetRoot.getBoundingClientRect()), 34);
    const revealLeft = side === 'left' && themeRoot.classList.contains('left-collapsed');
    const revealRight = side === 'right' && themeRoot.classList.contains('right-collapsed');
    const changed = themeRoot.hasAttribute('data-drag-reveal-left') !== revealLeft
      || themeRoot.hasAttribute('data-drag-reveal-right') !== revealRight;
    if (revealLeft) themeRoot.dataset.dragRevealLeft = 'true';
    else themeRoot.removeAttribute('data-drag-reveal-left');
    if (revealRight) themeRoot.dataset.dragRevealRight = 'true';
    else themeRoot.removeAttribute('data-drag-reveal-right');
    if (changed) {
      dockPreview?.clearSlot();
      void themeRoot.offsetWidth;
    }
  };

  const lift = (
    event: Pick<PointerEvent, 'clientX' | 'clientY'>,
    input: CatalogPlacementInput = 'pointer'
  ): boolean => {
    if (!candidate) return false;
    if (
      candidate.manifest.catalog?.multiplicity === 'single'
      && options.getInstanceCount(candidate.manifest) > 0
    ) {
      options.onAnnounce?.(`${candidate.manifest.title} is already on this Panel.`);
      reset();
      return false;
    }
    const targetRoot = options.getTargetRoot();
    const richPointer = input === 'pointer'
      && options.onDockCommit !== undefined
      && targetRoot instanceof HTMLElement;
    const visibleTargets = compatibleTargets(candidate.manifest);
    const targets = richPointer
      ? compatibleTargets(candidate.manifest, options.isPotentialDockTarget ?? options.isCompatibleTarget)
      : visibleTargets;
    const nextDockTargets = richPointer ? compatibleDockTargets(candidate.manifest, visibleTargets) : Object.freeze([]);
    if (targets.length === 0) {
      options.onAnnounce?.(`No compatible target is available for ${candidate.manifest.title}.`);
      reset();
      return false;
    }
    const originRect = candidate.origin.getBoundingClientRect();
    const width = Math.min(280, Math.round(originRect.width));
    const scale = originRect.width > 0 ? width / originRect.width : 1;
    const height = Math.min(360, Math.round(originRect.height * scale));
    const selectedTargetId = input === 'keyboard' ? targets[0]?.identity.id ?? null : null;
    if (!richPointer) {
      for (const target of targets) {
        targetAttributes.set(target.element, {
          placementTarget: target.element.getAttribute('data-catalog-placement-target'),
          tabindex: target.element.getAttribute('tabindex'),
          role: target.element.getAttribute('role'),
          ariaLabel: target.element.getAttribute('aria-label'),
          placementClass: target.element.classList.contains('is-catalog-placement-target'),
          activeClass: target.element.classList.contains('is-catalog-target-active')
        });
        target.element.dataset.catalogPlacementTarget = target.identity.id;
        target.element.classList.add('is-catalog-placement-target');
        target.element.classList.toggle('is-catalog-target-active', target.identity.id === selectedTargetId);
        target.element.tabIndex = target.identity.id === selectedTargetId ? 0 : -1;
        target.element.setAttribute('role', 'button');
        target.element.setAttribute('aria-label', `Place ${candidate.manifest.title} in ${target.element.getAttribute('aria-label') ?? target.identity.regionRole}`);
      }
    }
    savedScrollAnchor = options.captureScrollAnchor?.();
    candidate.origin.classList.add('is-catalog-drag-origin');
    releasePointerCaptureBeforeLift();
    options.catalog.suspend();
    suspended = true;
    if (richPointer) {
      const root = options.getTargetRoot();
      if (root instanceof HTMLElement) {
        dockTargets = nextDockTargets;
        dockPreview = createDockPreviewController(root);
        candidate.document.body.classList.add('pom-widget-drag-active');
        dockPreview.sync(dockTargets, null);
      }
    }
    publish(Object.freeze({
      phase: 'lifted',
      input,
      proxy: Object.freeze({
        input,
        manifestType: String(candidate.manifest.type),
        title: candidate.manifest.title,
        x: event.clientX,
        y: event.clientY,
        width,
        height,
        offsetX: Math.max(0, Math.min(width, Math.round((event.clientX - originRect.left) * scale))),
        offsetY: Math.max(0, Math.min(height, Math.round((event.clientY - originRect.top) * scale)))
      }),
      targets,
      selectedTargetId,
      instruction: input === 'keyboard'
        ? `Choose a placement for ${candidate.manifest.title}. Use arrow keys, Enter to place, or Escape to cancel.`
        : `${candidate.manifest.title} lifted. Drag to a highlighted Panel target.`
    }));
    if (input === 'keyboard') {
      candidate.document.addEventListener('keydown', handleDocumentKeyDown);
      if (targets[0]) options.requestTargetFocus?.(targets[0].element);
    }
    return true;
  };

  function handlePointerMove(event: PointerEvent) {
    if (!candidate || event.pointerId !== candidate.pointerId) return;
    if (state.phase === 'pressing') {
      const distance = Math.hypot(event.clientX - candidate.startX, event.clientY - candidate.startY);
      if (candidate.pointerType === 'touch' && distance > 0) {
        suppressClickBriefly();
        reset();
      } else if (candidate.pointerType !== 'touch' && distance >= POINTER_LIFT_THRESHOLD) {
        suppressClickBriefly();
        lift(event);
      }
      return;
    }
    if (state.phase === 'lifted' && state.input === 'pointer' && state.proxy) {
      event.preventDefault();
      if (options.onDockCommit && dockPreview) {
        const point = { x: event.clientX, y: event.clientY };
        syncCollapsedDockReveal(point);
        const targets = compatibleTargets(candidate.manifest);
        dockTargets = compatibleDockTargets(candidate.manifest, targets);
        const next = resolveDockIntent(point, dockTargets);
        dockIntent = stabilizeDockIntent(point, dockIntent, next, 10);
        dockIntent = dockPreview.sync(dockTargets, dockIntent);
        publish(Object.freeze({
          ...state,
          proxy: Object.freeze({ ...state.proxy, x: event.clientX, y: event.clientY }),
          selectedTargetId: dockIntent?.key ?? null
        }));
        return;
      }
      const hit = candidate.document.elementFromPoint?.(event.clientX, event.clientY) ?? null;
      selectPointerTarget(hit, Object.freeze({ ...state, proxy: Object.freeze({ ...state.proxy, x: event.clientX, y: event.clientY }) }));
    }
  }

  function handleTouchMove(event: TouchEvent) {
    if (candidate?.pointerType === 'touch' && state.phase === 'lifted') event.preventDefault();
  }

  function handlePointerEnd(event: PointerEvent) {
    if (!candidate || event.pointerId !== candidate.pointerId) return;
    if (state.phase === 'lifted') {
      suppressClickBriefly();
      if (event.type !== 'pointercancel' && dockIntent && options.onDockCommit) commitDockIntent();
      else if (event.type !== 'pointercancel' && state.selectedTargetId) commitSelectedTarget();
      else cancelPlacement();
      return;
    }
    reset();
  }

  function handleScroll() {
    if (candidate?.pointerType !== 'touch' || state.phase !== 'pressing') return;
    suppressClickBriefly();
    reset();
  }

  function handleLostPointerCapture(event: Event) {
    const pointerId = (event as PointerEvent).pointerId;
    if (!candidate || pointerId !== candidate.pointerId) return;
    if (state.phase === 'lifted') cancelPlacement();
    else reset();
  }

  function handleWindowBlur() {
    if (!candidate) return;
    if (state.phase === 'lifted') cancelPlacement();
    else reset();
  }

  const selectTarget = (index: number, focus = true) => {
    if (state.phase !== 'lifted' || state.targets.length === 0) return;
    const normalized = (index + state.targets.length) % state.targets.length;
    const selected = state.targets[normalized]!;
    for (const target of state.targets) {
      const active = target.identity.id === selected.identity.id;
      target.element.classList.toggle('is-catalog-target-active', active);
      target.element.tabIndex = active ? 0 : -1;
    }
    publish(Object.freeze({ ...state, selectedTargetId: selected.identity.id }));
    if (focus) options.requestTargetFocus?.(selected.element);
  };

  const selectPointerTarget = (element: Element | null, nextState: CatalogPlacementState = state) => {
    if (nextState.phase !== 'lifted') return;
    const hit = element?.closest<HTMLElement>(TARGET_SELECTOR) ?? null;
    let index = nextState.targets.findIndex(({ element: target }) => target === hit);
    if (index < 0 && nextState.proxy) {
      const containing = nextState.targets.map((target, targetIndex) => ({ target, targetIndex }))
        .filter(({ target }) => {
          const rect = target.element.getBoundingClientRect();
          return nextState.proxy!.x >= rect.x
            && nextState.proxy!.x <= rect.x + rect.width
            && nextState.proxy!.y >= rect.y
            && nextState.proxy!.y <= rect.y + rect.height;
        });
      const stack = candidate?.document.elementsFromPoint?.(nextState.proxy.x, nextState.proxy.y) ?? [];
      for (const stackedElement of stack) {
        const stackedTarget = stackedElement.closest<HTMLElement>(TARGET_SELECTOR);
        const stackedIndex = containing.find(({ target }) => target.element === stackedTarget)?.targetIndex ?? -1;
        if (stackedIndex >= 0) {
          index = stackedIndex;
          break;
        }
      }
      if (index < 0) {
        const mostSpecific = containing.filter((candidate) => !containing.some((other) => (
          candidate !== other && candidate.target.element.contains(other.target.element)
        )));
        const minimumArea = Math.min(...mostSpecific.map(({ target }) => target.rect.width * target.rect.height));
        const equalArea = mostSpecific.filter(({ target }) => target.rect.width * target.rect.height === minimumArea);
        const mutuallyConnected = equalArea.every((left) => equalArea.every((right) => (
          left === right
          || (left.target.element.ownerDocument === right.target.element.ownerDocument
            && !(left.target.element.compareDocumentPosition(right.target.element) & Node.DOCUMENT_POSITION_DISCONNECTED))
        )));
        const ranked = equalArea.sort((left, right) => {
          if (!mutuallyConnected) return left.target.identity.id.localeCompare(right.target.identity.id);
          const position = left.target.element.compareDocumentPosition(right.target.element);
          if (position & Node.DOCUMENT_POSITION_FOLLOWING) return 1;
          if (position & Node.DOCUMENT_POSITION_PRECEDING) return -1;
          return left.target.identity.id.localeCompare(right.target.identity.id);
        });
        index = ranked[0]?.targetIndex ?? -1;
      }
    }
    if (index >= 0) {
      const selected = nextState.targets[index]!;
      for (const target of nextState.targets) {
        const active = target.identity.id === selected.identity.id;
        target.element.classList.toggle('is-catalog-target-active', active);
        target.element.tabIndex = active ? 0 : -1;
      }
      publish(Object.freeze({ ...nextState, selectedTargetId: selected.identity.id }));
      return;
    }
    for (const target of nextState.targets) {
      target.element.classList.remove('is-catalog-target-active');
      target.element.tabIndex = -1;
    }
    publish(Object.freeze({ ...nextState, selectedTargetId: null }));
  };

  const commitSelectedTarget = () => {
    if (state.phase !== 'lifted' || !candidate) return false;
    const target = state.targets.find(({ identity }) => identity.id === state.selectedTargetId);
    if (!target) return false;
    const activeManifest = candidate.manifest;
    try {
      options.onCommit(activeManifest, target);
    } finally {
      reset();
    }
    return true;
  };

  const commitDockIntent = () => {
    if (state.phase !== 'lifted' || !candidate || !dockIntent || !options.onDockCommit) return false;
    const activeManifest = candidate.manifest;
    const activeIntent = dockIntent;
    try {
      options.onDockCommit(activeManifest, activeIntent);
    } finally {
      reset();
    }
    return true;
  };

  const cancelPlacement = () => {
    const title = candidate?.manifest.title;
    reset();
    if (title) options.onAnnounce?.(`${title} placement cancelled.`);
  };

  const handleLiftedKey = (event: KeyboardEvent) => {
    if (state.phase !== 'lifted') return false;
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelPlacement();
      return true;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.repeat) return true;
      return commitSelectedTarget();
    }
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      const current = Math.max(0, state.targets.findIndex(({ identity }) => identity.id === state.selectedTargetId));
      const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      selectTarget(current + direction);
      return true;
    }
    return false;
  };

  function handleDocumentKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    handleLiftedKey(event);
  }

  const controller: CatalogPlacementController = {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        listeners.delete(listener);
      };
    },
    pointerDown(event, manifest, origin) {
      clearClickSuppression();
      if (event.button !== 0 || candidate || state.phase !== 'idle') return false;
      candidate = {
        pointerId: event.pointerId,
        pointerType: event.pointerType || 'mouse',
        startX: event.clientX,
        startY: event.clientY,
        manifest,
        origin,
        document: origin.ownerDocument,
        holdTimer: null,
        captured: false
      };
      publish(Object.freeze({ ...IDLE_STATE, phase: 'pressing', input: 'pointer' }));
      candidate.document.addEventListener('pointermove', handlePointerMove);
      candidate.document.addEventListener('pointerup', handlePointerEnd);
      candidate.document.addEventListener('pointercancel', handlePointerEnd);
      if (candidate.pointerType === 'touch') {
        candidate.document.addEventListener('touchmove', handleTouchMove, { passive: false });
      }
      candidate.document.addEventListener('scroll', handleScroll, true);
      candidate.origin.addEventListener('lostpointercapture', handleLostPointerCapture);
      candidate.origin.ownerDocument.defaultView?.addEventListener('blur', handleWindowBlur);
      try {
        candidate.origin.setPointerCapture?.(candidate.pointerId);
        candidate.captured = typeof candidate.origin.setPointerCapture === 'function';
      } catch {
        candidate.captured = false;
      }
      if (candidate.pointerType === 'touch') {
        const touchCandidate = candidate;
        touchCandidate.holdTimer = setTimeout(() => {
          if (candidate !== touchCandidate || state.phase !== 'pressing') return;
          touchCandidate.holdTimer = null;
          suppressClickBriefly();
          lift({ clientX: touchCandidate.startX, clientY: touchCandidate.startY });
        }, 300);
      }
      return true;
    },
    keyDown(event, manifest, origin) {
      if (handleLiftedKey(event)) return true;
      if (event.key !== ' ' || candidate || state.phase !== 'idle') return false;
      event.preventDefault();
      const originRect = origin.getBoundingClientRect();
      candidate = {
        pointerId: -1,
        pointerType: 'keyboard',
        startX: originRect.left + originRect.width / 2,
        startY: originRect.top + originRect.height / 2,
        manifest,
        origin,
        document: origin.ownerDocument,
        holdTimer: null,
        captured: false
      };
      return lift({ clientX: candidate.startX, clientY: candidate.startY }, 'keyboard');
    },
    cancel: cancelPlacement,
    consumeClick() {
      const suppressed = suppressNextClick;
      clearClickSuppression();
      return suppressed;
    },
    destroy() {
      reset();
      clearClickSuppression();
      listeners.clear();
    }
  };
  return Object.freeze(controller);
}
