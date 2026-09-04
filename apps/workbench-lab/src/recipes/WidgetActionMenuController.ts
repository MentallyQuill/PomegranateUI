import { getContext, setContext } from 'svelte';
import type { WidgetFrameProjection } from '@pomegranate-ui/core';

export type WidgetActionRequestSource = 'pointer' | 'keyboard' | 'touch';

export interface WidgetActionRequest {
  readonly frame: WidgetFrameProjection;
  readonly title: string;
  readonly anchor: HTMLElement;
  readonly source: WidgetActionRequestSource;
  readonly point?: Readonly<{ x: number; y: number }>;
  readonly onopenchange?: (open: boolean) => void;
}

export interface SecondaryWidgetContextController {
  pointerDown(event: PointerEvent, key: string, open: (point: Readonly<{ x: number; y: number }>) => void): boolean;
  pointerUp(event: PointerEvent): boolean;
  pointerCancel(event: PointerEvent): void;
  contextMenu(event: MouseEvent, key: string, open: (point: Readonly<{ x: number; y: number }>) => void): void;
  destroy(): void;
}

interface SecondaryWidgetContextCandidate {
  readonly pointerId: number;
  readonly key: string;
  readonly open: (point: Readonly<{ x: number; y: number }>) => void;
  releaseQueued: boolean;
}

interface SecondaryWidgetContextDuplicate {
  readonly key: string;
  readonly until: number;
}

type WidgetActionRequester = (request: WidgetActionRequest) => void;

const WIDGET_ACTION_MENU_CONTEXT = Symbol('pomegranate-widget-action-menu');

export function setWidgetActionMenuContext(request: WidgetActionRequester): void {
  setContext(WIDGET_ACTION_MENU_CONTEXT, request);
}

export function getWidgetActionMenuContext(): WidgetActionRequester | undefined {
  return getContext<WidgetActionRequester | undefined>(WIDGET_ACTION_MENU_CONTEXT);
}

export function createSecondaryWidgetContextController(): SecondaryWidgetContextController {
  let candidate: SecondaryWidgetContextCandidate | null = null;
  let duplicate: SecondaryWidgetContextDuplicate | null = null;

  function clear(current: SecondaryWidgetContextCandidate | null = candidate) {
    if (!current || candidate !== current) return;
    candidate = null;
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', cancel);
    window.removeEventListener('blur', cancelOnBlur);
  }

  function cancelOnBlur() {
    clear();
  }

  function finish(event: PointerEvent) {
    const current = candidate;
    if (!current || current.pointerId !== event.pointerId) return false;
    event.preventDefault();
    if (current.releaseQueued) return true;
    current.releaseQueued = true;
    const point = { x: event.clientX, y: event.clientY };
    duplicate = { key: current.key, until: performance.now() + 1000 };
    queueMicrotask(() => {
      if (candidate !== current) return;
      clear(current);
      current.open(point);
    });
    return true;
  }

  function cancel(event: PointerEvent) {
    if (candidate?.pointerId === event.pointerId) clear();
  }

  return Object.freeze<SecondaryWidgetContextController>({
    pointerDown(event, key, open) {
      if (event.button !== 2 || event.pointerType === 'touch' || !key) return false;
      clear();
      candidate = { pointerId: event.pointerId, key, open, releaseQueued: false };
      window.addEventListener('pointerup', finish);
      window.addEventListener('pointercancel', cancel);
      window.addEventListener('blur', cancelOnBlur);
      event.preventDefault();
      return true;
    },

    pointerUp(event) {
      return finish(event);
    },

    pointerCancel(event) {
      cancel(event);
    },

    contextMenu(event, key, open) {
      event.preventDefault();
      if (duplicate && performance.now() > duplicate.until) duplicate = null;
      if (duplicate?.key === key) {
        duplicate = null;
        return;
      }
      if (candidate?.key === key) return;
      open({ x: event.clientX, y: event.clientY });
    },

    destroy() {
      clear();
      duplicate = null;
    }
  });
}
