import { reorderIndexAtPoint, tabDragDecision, type ReorderAxis } from './tab-reorder.js';

interface TabItem {
  readonly id: string;
  readonly element: HTMLElement;
}

interface TabReorderOptions {
  readonly axis?: ReorderAxis;
  readonly getItems: () => readonly TabItem[];
  readonly commit: (id: string, toIndex: number) => void;
  readonly setDragging?: (dragging: boolean) => void;
}

interface Candidate {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly sourceId: string;
  readonly handle: HTMLElement;
  readonly source: HTMLElement;
  readonly strip: HTMLElement;
  readonly startX: number;
  readonly startY: number;
  readonly startedAt: number;
  readonly grabX: number;
  readonly grabY: number;
  active: boolean;
  toIndex: number;
  marker: HTMLElement | null;
  proxy: HTMLElement | null;
}

export interface TabReorderController {
  pointerDown(event: PointerEvent, id: string): void;
  pointerMove(event: PointerEvent): void;
  pointerUp(event: PointerEvent): void;
  pointerCancel(event: PointerEvent): void;
  preventNextClick(): void;
  consumeClick(): boolean;
  destroy(): void;
}

function nowFor(event: PointerEvent) {
  return Number.isFinite(event.timeStamp) && event.timeStamp > 0 ? event.timeStamp : performance.now();
}

export function createTabReorderController(options: TabReorderOptions): TabReorderController {
  const axis = options.axis ?? 'horizontal';
  let candidate: Candidate | null = null;
  let suppressClickUntil = 0;

  function suppressNextClick() {
    suppressClickUntil = performance.now() + 500;
  }

  function positionProxy(current: Candidate, event: PointerEvent) {
    if (!current.proxy) return;
    current.proxy.style.transform = `translate3d(${event.clientX - current.grabX}px, ${event.clientY - current.grabY}px, 0)`;
  }

  function placeMarker(current: Candidate, point: number) {
    if (!current.marker) return;
    current.marker.remove();
    const items = options.getItems();
    current.toIndex = reorderIndexAtPoint(current.sourceId, point, items.map(({ id, element }) => {
      const rect = element.getBoundingClientRect();
      return axis === 'vertical'
        ? { id, start: rect.top, end: rect.bottom }
        : { id, start: rect.left, end: rect.right };
    }));
    const destinations = items.filter((item) => item.id !== current.sourceId);
    const before = destinations[current.toIndex]?.element;
    if (before) current.strip.insertBefore(current.marker, before);
    else destinations.at(-1)?.element.after(current.marker);
    current.marker.dataset.insertIndex = String(current.toIndex);
  }

  function activate(current: Candidate, event: PointerEvent) {
    const box = current.source.getBoundingClientRect();
    const marker = document.createElement('div');
    marker.className = 'tab-reorder-marker';
    marker.dataset.pomPart = 'tab.insertion';
    marker.setAttribute('aria-hidden', 'true');
    marker.style.width = `${box.width}px`;
    marker.style.height = `${box.height}px`;
    const proxy = document.createElement('div');
    proxy.className = 'tab-reorder-proxy';
    proxy.dataset.pomPart = 'tab.drag-preview';
    proxy.setAttribute('aria-hidden', 'true');
    proxy.textContent = current.handle.dataset.tabReorderLabel ?? current.handle.textContent?.trim() ?? '';
    proxy.style.width = `${box.width}px`;
    proxy.style.height = `${box.height}px`;
    (current.source.closest<HTMLElement>('dialog[open]')
      ?? current.source.closest<HTMLElement>('main[data-pom-theme-root]')
      ?? document.body).append(proxy);
    current.marker = marker;
    current.proxy = proxy;
    current.active = true;
    current.source.classList.add('is-tab-reorder-origin');
    document.body.classList.add('pom-tab-reorder-active');
    options.setDragging?.(true);
    placeMarker(current, axis === 'vertical' ? event.clientY : event.clientX);
    positionProxy(current, event);
  }

  function cleanup() {
    if (!candidate) return;
    candidate.source.classList.remove('is-tab-reorder-origin');
    candidate.marker?.remove();
    candidate.proxy?.remove();
    candidate.handle.removeEventListener('lostpointercapture', lostCapture);
    document.body.classList.remove('pom-tab-reorder-active');
    window.removeEventListener('keydown', escapeCancel);
    window.removeEventListener('blur', blurCancel);
    options.setDragging?.(false);
    candidate = null;
  }

  function escapeCancel(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !candidate) return;
    event.preventDefault();
    if (candidate.active) suppressNextClick();
    cleanup();
  }

  function lostCapture() {
    if (candidate) cleanup();
  }

  function blurCancel() {
    if (candidate?.active) suppressNextClick();
    cleanup();
  }

  return Object.freeze({
    pointerDown(event: PointerEvent, id: string) {
      if (event.button !== 0 || candidate) return;
      const target = event.target;
      if (event.pointerType === 'touch'
        && (!(target instanceof Element) || !target.closest('[data-tab-touch-reorder-grip]'))) return;
      const handle = event.currentTarget as HTMLElement;
      const source = handle.closest<HTMLElement>('[data-tab-reorder-item]');
      const strip = source?.parentElement;
      if (!source || !strip) return;
      const box = source.getBoundingClientRect();
      candidate = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        sourceId: id,
        handle,
        source,
        strip,
        startX: event.clientX,
        startY: event.clientY,
        startedAt: nowFor(event),
        grabX: event.clientX - box.left,
        grabY: event.clientY - box.top,
        active: false,
        toIndex: options.getItems().findIndex((item) => item.id === id),
        marker: null,
        proxy: null
      };
      try { handle.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers do not need capture. */ }
      handle.addEventListener('lostpointercapture', lostCapture);
      window.addEventListener('keydown', escapeCancel);
      window.addEventListener('blur', blurCancel);
    },

    pointerMove(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      const dx = event.clientX - candidate.startX;
      const dy = event.clientY - candidate.startY;
      const decision = tabDragDecision({
        axis,
        dx,
        dy,
        pointerType: candidate.pointerType,
        elapsedMs: nowFor(event) - candidate.startedAt
      });
      if (decision === 'cancelled') {
        cleanup();
        return;
      }
      if (!candidate.active && decision === 'reorder') activate(candidate, event);
      if (!candidate.active) return;
      event.preventDefault();
      if (decision === 'reorder') {
        placeMarker(candidate, axis === 'vertical' ? event.clientY : event.clientX);
      }
      positionProxy(candidate, event);
    },

    pointerUp(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      const current = candidate;
      const commit = current.active;
      const toIndex = current.toIndex;
      if (commit) suppressNextClick();
      cleanup();
      if (commit) options.commit(current.sourceId, toIndex);
    },

    pointerCancel(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      if (candidate.active) suppressNextClick();
      cleanup();
    },

    preventNextClick() {
      suppressNextClick();
    },

    consumeClick() {
      const value = performance.now() <= suppressClickUntil;
      suppressClickUntil = 0;
      return value;
    },

    destroy() {
      cleanup();
      suppressClickUntil = 0;
    }
  });
}
