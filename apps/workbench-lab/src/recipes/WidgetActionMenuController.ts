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

type WidgetActionRequester = (request: WidgetActionRequest) => void;

const WIDGET_ACTION_MENU_CONTEXT = Symbol('pomegranate-widget-action-menu');

export function setWidgetActionMenuContext(request: WidgetActionRequester): void {
  setContext(WIDGET_ACTION_MENU_CONTEXT, request);
}

export function getWidgetActionMenuContext(): WidgetActionRequester | undefined {
  return getContext<WidgetActionRequester | undefined>(WIDGET_ACTION_MENU_CONTEXT);
}
