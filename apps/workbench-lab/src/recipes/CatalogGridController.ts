import type { WidgetShape } from '@pomegranate-ui/contracts';

const CATALOG_PREVIEW_MIN = 200;
const CATALOG_PREVIEW_DEFAULT = 286;
const CATALOG_PREVIEW_MAX = 420;
const CATALOG_GRID_ROW_HEIGHT = 8;
const CATALOG_GRID_GAP = 8;

export type CatalogPreviewLabel = 'Small' | 'Medium' | 'Large' | 'Custom';

export interface CatalogScrollAnchor {
  readonly key: string;
  readonly offset: number;
}

export interface CatalogGridResizeObserver {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
}

export interface CatalogGridControllerOptions {
  readonly getScrollElement: () => HTMLElement | null;
  readonly getResults: () => readonly HTMLElement[];
  readonly getPreviewWidth: () => number;
  readonly getResultKey: (result: HTMLElement) => string;
  readonly getResultShape: (result: HTMLElement) => WidgetShape;
  readonly getResultMeasureElement: (result: HTMLElement) => Element;
  readonly createResizeObserver?: (callback: () => void) => CatalogGridResizeObserver | null;
  readonly getComputedStyle?: (element: Element) => CSSStyleDeclaration;
}

export interface CatalogGridController {
  sync(): void;
  captureAnchor(): CatalogScrollAnchor | null;
  restoreAnchor(anchor: CatalogScrollAnchor | null): void;
  destroy(): void;
}

const PREVIEW_LABELS = new Map<number, Exclude<CatalogPreviewLabel, 'Custom'>>([
  [200, 'Small'],
  [286, 'Medium'],
  [420, 'Large']
]);

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeCatalogPreviewWidth(value: number): number {
  const rounded = Math.round(finiteOr(value, CATALOG_PREVIEW_DEFAULT));
  return Math.max(CATALOG_PREVIEW_MIN, Math.min(CATALOG_PREVIEW_MAX, rounded));
}

export function catalogPreviewLabel(width: number): CatalogPreviewLabel {
  return PREVIEW_LABELS.get(width) ?? 'Custom';
}

export function catalogTrackCount(availableWidth: number, requestedWidth: number, gap: number): number {
  const available = Math.max(1, finiteOr(availableWidth, 1));
  const normalizedGap = Math.max(0, finiteOr(gap, 0));
  const trackWidth = Math.min(normalizeCatalogPreviewWidth(requestedWidth), available);
  return Math.max(1, Math.floor((available + normalizedGap) / (trackWidth + normalizedGap)));
}

export function catalogShapeSpan(shape: WidgetShape, columns: number): 1 | 2 {
  if (columns < 2) return 1;
  return shape === 'wide' || shape === 'stage' || shape === 'strip' ? 2 : 1;
}

export function catalogRowSpan(height: number, rowHeight: number, rowGap: number): number {
  const measuredHeight = Math.max(0, finiteOr(height, 0));
  const normalizedRowHeight = Math.max(1, finiteOr(rowHeight, CATALOG_GRID_ROW_HEIGHT));
  const normalizedRowGap = Math.max(0, finiteOr(rowGap, CATALOG_GRID_GAP));
  return Math.max(1, Math.ceil((measuredHeight + normalizedRowGap) / (normalizedRowHeight + normalizedRowGap)));
}

function defaultResizeObserver(callback: () => void): CatalogGridResizeObserver | null {
  if (typeof ResizeObserver === 'undefined') return null;
  return new ResizeObserver(() => callback());
}

function defaultComputedStyle(element: Element): CSSStyleDeclaration {
  return element.ownerDocument.defaultView?.getComputedStyle(element) ?? getComputedStyle(element);
}

export function createCatalogGridController(options: CatalogGridControllerOptions): CatalogGridController {
  let destroyed = false;
  const observed = new Set<Element>();
  const resizeObserver = (options.createResizeObserver ?? defaultResizeObserver)(() => {
    if (!destroyed) sync();
  });

  function updateObservation(scrollElement: HTMLElement | null, results: readonly HTMLElement[]): void {
    if (!resizeObserver) return;
    const measuredElements = results.map((result) => options.getResultMeasureElement(result));
    const current = new Set<Element>(scrollElement
      ? [scrollElement, ...results, ...measuredElements]
      : [...results, ...measuredElements]);
    for (const element of observed) {
      if (current.has(element)) continue;
      resizeObserver.unobserve(element);
      observed.delete(element);
    }
    for (const element of current) {
      if (observed.has(element)) continue;
      resizeObserver.observe(element);
      observed.add(element);
    }
  }

  function sync(): void {
    if (destroyed) return;
    const scrollElement = options.getScrollElement();
    const results = options.getResults();
    updateObservation(scrollElement, results);
    if (!scrollElement) return;

    const readStyle = options.getComputedStyle ?? defaultComputedStyle;
    const computedStyle = readStyle(scrollElement);
    const horizontalPadding = (Number.parseFloat(computedStyle.paddingLeft) || 0)
      + (Number.parseFloat(computedStyle.paddingRight) || 0);
    const availableWidth = Math.max(1, scrollElement.clientWidth - horizontalPadding);
    const previewWidth = normalizeCatalogPreviewWidth(options.getPreviewWidth());
    const trackWidth = Math.min(previewWidth, availableWidth);
    const columns = catalogTrackCount(availableWidth, trackWidth, CATALOG_GRID_GAP);

    scrollElement.style.setProperty('--pom-catalog-preview-width', `${trackWidth}px`);
    scrollElement.style.setProperty('--pom-catalog-columns', String(columns));
    scrollElement.style.gridAutoRows = `${CATALOG_GRID_ROW_HEIGHT}px`;
    scrollElement.style.rowGap = `${CATALOG_GRID_GAP}px`;
    scrollElement.style.columnGap = `${CATALOG_GRID_GAP}px`;
    scrollElement.dataset.catalogColumns = String(columns);

    for (const result of results) {
      result.style.gridRowEnd = '';
      result.style.gridColumnEnd = `span ${catalogShapeSpan(options.getResultShape(result), columns)}`;
    }
    for (const result of results) {
      const height = options.getResultMeasureElement(result).getBoundingClientRect().height;
      result.style.gridRowEnd = `span ${catalogRowSpan(height, CATALOG_GRID_ROW_HEIGHT, CATALOG_GRID_GAP)}`;
    }
  }

  function captureAnchor(): CatalogScrollAnchor | null {
    if (destroyed) return null;
    const scrollElement = options.getScrollElement();
    if (!scrollElement) return null;
    const regionRect = scrollElement.getBoundingClientRect();
    const visibleResults = options.getResults().filter((result) => {
      const resultRect = result.getBoundingClientRect();
      return resultRect.bottom > regionRect.top && resultRect.top < regionRect.bottom;
    });
    const result = visibleResults.find((candidate) => candidate.getBoundingClientRect().top >= regionRect.top)
      ?? visibleResults[0];
    if (!result) return null;
    return Object.freeze({
      key: options.getResultKey(result),
      offset: result.getBoundingClientRect().top - regionRect.top
    });
  }

  function restoreAnchor(anchor: CatalogScrollAnchor | null): void {
    if (destroyed || !anchor) return;
    const scrollElement = options.getScrollElement();
    if (!scrollElement) return;
    const result = options.getResults().find((candidate) => options.getResultKey(candidate) === anchor.key);
    if (!result) return;
    const regionTop = scrollElement.getBoundingClientRect().top;
    const correction = result.getBoundingClientRect().top - regionTop - anchor.offset;
    if (Number.isFinite(correction)) scrollElement.scrollTop += correction;
  }

  updateObservation(options.getScrollElement(), options.getResults());

  return Object.freeze({
    sync,
    captureAnchor,
    restoreAnchor,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      resizeObserver?.disconnect();
      observed.clear();
    }
  });
}
