import { afterEach, describe, expect, it } from 'vitest';

import {
  catalogPreviewLabel,
  catalogRowSpan,
  catalogShapeSpan,
  catalogTrackCount,
  createCatalogGridController,
  normalizeCatalogPreviewWidth,
  type CatalogGridResizeObserver
} from './CatalogGridController.js';

function rect(top: number, height: number, width = 286): DOMRect {
  return new DOMRect(0, top, width, height);
}

function setClientWidth(element: HTMLElement, width: number): void {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: width });
}

describe('catalog preview geometry', () => {
  it('clamps preview width to 200-420 pixels and preserves Medium', () => {
    expect(normalizeCatalogPreviewWidth(199)).toBe(200);
    expect(normalizeCatalogPreviewWidth(286)).toBe(286);
    expect(normalizeCatalogPreviewWidth(421)).toBe(420);
  });

  it('labels only the three named preview detents', () => {
    expect(catalogPreviewLabel(200)).toBe('Small');
    expect(catalogPreviewLabel(286)).toBe('Medium');
    expect(catalogPreviewLabel(420)).toBe('Large');
    expect(catalogPreviewLabel(300)).toBe('Custom');
  });

  it('fits seven Medium tracks or five Large tracks in the source-wide results region', () => {
    expect(catalogTrackCount(2172, 286, 8)).toBe(7);
    expect(catalogTrackCount(2172, 420, 8)).toBe(5);
  });

  it('collapses two-track shapes when only one column is available', () => {
    expect(catalogShapeSpan('narrow', 7)).toBe(1);
    expect(catalogShapeSpan('medium', 7)).toBe(1);
    expect(catalogShapeSpan('wide', 7)).toBe(2);
    expect(catalogShapeSpan('stage', 7)).toBe(2);
    expect(catalogShapeSpan('strip', 7)).toBe(2);
    expect(catalogShapeSpan('wide', 1)).toBe(1);
    expect(catalogShapeSpan('stage', 1)).toBe(1);
    expect(catalogShapeSpan('strip', 1)).toBe(1);
  });

  it('converts measured heights to 8px auto-row spans with an 8px gap', () => {
    expect(catalogRowSpan(280, 8, 8)).toBe(18);
    expect(catalogRowSpan(286, 8, 8)).toBe(19);
    expect(catalogRowSpan(0, 8, 8)).toBe(1);
  });
});

describe('CatalogGridController', () => {
  const cleanup: HTMLElement[] = [];

  afterEach(() => {
    cleanup.splice(0).forEach((element) => element.remove());
  });

  it('synchronizes literal track, shape-span, and measured row-span geometry', () => {
    const scroll = document.body.appendChild(document.createElement('div'));
    cleanup.push(scroll);
    setClientWidth(scroll, 2172);
    scroll.style.paddingInline = '0px';
    const narrow = document.createElement('article');
    const wide = document.createElement('article');
    Object.defineProperty(narrow, 'getBoundingClientRect', { configurable: true, value: () => rect(0, 280) });
    Object.defineProperty(wide, 'getBoundingClientRect', { configurable: true, value: () => rect(0, 286, 580) });
    const results = [narrow, wide];

    const controller = createCatalogGridController({
      getScrollElement: () => scroll,
      getResults: () => results,
      getPreviewWidth: () => 286,
      getResultKey: (result) => result === narrow ? 'narrow' : 'wide',
      getResultShape: (result) => result === narrow ? 'narrow' : 'wide',
      getResultMeasureElement: (result) => result,
      createResizeObserver: () => null
    });
    controller.sync();

    expect(scroll.style.getPropertyValue('--pom-catalog-preview-width')).toBe('286px');
    expect(scroll.style.getPropertyValue('--pom-catalog-columns')).toBe('7');
    expect(scroll.style.gridAutoRows).toBe('8px');
    expect(scroll.style.rowGap).toBe('8px');
    expect(scroll.style.columnGap).toBe('8px');
    expect(scroll.dataset.catalogColumns).toBe('7');
    expect(narrow.style.gridColumnEnd).toBe('span 1');
    expect(wide.style.gridColumnEnd).toBe('span 2');
    expect(narrow.style.gridRowEnd).toBe('span 18');
    expect(wide.style.gridRowEnd).toBe('span 19');
    controller.destroy();
  });

  it('measures intrinsic content when clearing the grid span collapses the result box to one row', () => {
    const scroll = document.body.appendChild(document.createElement('div'));
    cleanup.push(scroll);
    setClientWidth(scroll, 2172);
    const result = document.createElement('article');
    const content = result.appendChild(document.createElement('div'));
    content.style.height = '286px';
    result.style.gridRowEnd = 'span 19';
    Object.defineProperty(result, 'getBoundingClientRect', {
      configurable: true,
      value: () => {
        const span = Number.parseInt(result.style.gridRowEnd.replace('span ', ''), 10);
        const height = Number.isFinite(span) ? span * 16 - 8 : 8;
        return rect(0, height);
      }
    });
    Object.defineProperty(content, 'getBoundingClientRect', {
      configurable: true,
      value: () => rect(0, Number.parseFloat(content.style.height))
    });
    const options = {
      getScrollElement: () => scroll,
      getResults: () => [result],
      getPreviewWidth: () => 286,
      getResultKey: () => 'result',
      getResultShape: () => 'medium' as const,
      getResultMeasureElement: () => content,
      createResizeObserver: () => null
    };
    const controller = createCatalogGridController(options);

    controller.sync();

    expect(result.style.gridRowEnd).toBe('span 19');
    controller.destroy();
  });

  it('captures the first visible result and restores its exact viewport offset after restacking', () => {
    const scroll = document.body.appendChild(document.createElement('div'));
    cleanup.push(scroll);
    setClientWidth(scroll, 2172);
    scroll.scrollTop = 100;
    Object.defineProperty(scroll, 'getBoundingClientRect', {
      configurable: true,
      value: () => rect(100, 500, 2172)
    });
    const first = document.createElement('article');
    const second = document.createElement('article');
    let secondLayoutTop = 120;
    Object.defineProperty(first, 'getBoundingClientRect', {
      configurable: true,
      value: () => rect(100 - scroll.scrollTop, 80)
    });
    Object.defineProperty(second, 'getBoundingClientRect', {
      configurable: true,
      value: () => rect(100 + secondLayoutTop - scroll.scrollTop, 80)
    });
    const results = [first, second];
    const controller = createCatalogGridController({
      getScrollElement: () => scroll,
      getResults: () => results,
      getPreviewWidth: () => 286,
      getResultKey: (result) => result === first ? 'first' : 'second',
      getResultShape: () => 'medium',
      getResultMeasureElement: (result) => result,
      createResizeObserver: () => null
    });

    const anchor = controller.captureAnchor();
    expect(anchor).toEqual({ key: 'second', offset: 20 });

    secondLayoutTop = 220;
    controller.restoreAnchor(anchor);

    expect(scroll.scrollTop).toBe(200);
    expect(second.getBoundingClientRect().top - scroll.getBoundingClientRect().top).toBe(20);
    controller.destroy();
  });

  it('anchors the first result beginning in the viewport instead of an earlier tall overlap', () => {
    const scroll = document.body.appendChild(document.createElement('div'));
    cleanup.push(scroll);
    Object.defineProperty(scroll, 'getBoundingClientRect', { configurable: true, value: () => rect(100, 500, 600) });
    const overlap = document.createElement('article');
    const leading = document.createElement('article');
    Object.defineProperty(overlap, 'getBoundingClientRect', { configurable: true, value: () => rect(-100, 300) });
    Object.defineProperty(leading, 'getBoundingClientRect', { configurable: true, value: () => rect(124, 80) });
    const controller = createCatalogGridController({
      getScrollElement: () => scroll,
      getResults: () => [overlap, leading],
      getPreviewWidth: () => 286,
      getResultKey: (result) => result === overlap ? 'overlap' : 'leading',
      getResultShape: () => 'medium',
      getResultMeasureElement: (result) => result,
      createResizeObserver: () => null
    });

    expect(controller.captureAnchor()).toEqual({ key: 'leading', offset: 24 });
    controller.destroy();
  });

  it('captures a visible result when the scroll owner is at its top', () => {
    const scroll = document.body.appendChild(document.createElement('div'));
    cleanup.push(scroll);
    scroll.scrollTop = 0;
    Object.defineProperty(scroll, 'getBoundingClientRect', {
      configurable: true,
      value: () => rect(100, 500, 2172)
    });
    const result = document.createElement('article');
    Object.defineProperty(result, 'getBoundingClientRect', {
      configurable: true,
      value: () => rect(120, 80)
    });
    const controller = createCatalogGridController({
      getScrollElement: () => scroll,
      getResults: () => [result],
      getPreviewWidth: () => 286,
      getResultKey: () => 'first',
      getResultShape: () => 'medium',
      getResultMeasureElement: (result) => result,
      createResizeObserver: () => null
    });

    expect(controller.captureAnchor()).toEqual({ key: 'first', offset: 20 });
    controller.destroy();
  });

  it('does not capture a result entirely below the scroll viewport', () => {
    const scroll = document.body.appendChild(document.createElement('div'));
    cleanup.push(scroll);
    scroll.scrollTop = 100;
    Object.defineProperty(scroll, 'getBoundingClientRect', {
      configurable: true,
      value: () => rect(100, 500, 2172)
    });
    const result = document.createElement('article');
    Object.defineProperty(result, 'getBoundingClientRect', {
      configurable: true,
      value: () => rect(650, 80)
    });
    const controller = createCatalogGridController({
      getScrollElement: () => scroll,
      getResults: () => [result],
      getPreviewWidth: () => 286,
      getResultKey: () => 'below',
      getResultShape: () => 'medium',
      getResultMeasureElement: (result) => result,
      createResizeObserver: () => null
    });

    expect(controller.captureAnchor()).toBeNull();
    controller.destroy();
  });

  it('resynchronizes through ResizeObserver and destroys observation idempotently', () => {
    const observerState: { callback: (() => void) | null } = { callback: null };
    let disconnected = false;
    let disconnectCount = 0;
    const observed = new Set<Element>();
    const createResizeObserver = (callback: () => void): CatalogGridResizeObserver => {
      observerState.callback = callback;
      return {
        observe: (element) => observed.add(element),
        unobserve: (element) => observed.delete(element),
        disconnect: () => {
          disconnected = true;
          disconnectCount += 1;
          observed.clear();
        }
      };
    };
    const scroll = document.body.appendChild(document.createElement('div'));
    cleanup.push(scroll);
    let width = 2172;
    Object.defineProperty(scroll, 'clientWidth', { configurable: true, get: () => width });
    const result = document.createElement('article');
    Object.defineProperty(result, 'getBoundingClientRect', { configurable: true, value: () => rect(0, 280) });
    const controller = createCatalogGridController({
      getScrollElement: () => scroll,
      getResults: () => [result],
      getPreviewWidth: () => 286,
      getResultKey: () => 'result',
      getResultShape: () => 'medium',
      getResultMeasureElement: (result) => result,
      createResizeObserver
    });
    controller.sync();
    expect(scroll.dataset.catalogColumns).toBe('7');
    expect(observed).toEqual(new Set([scroll, result]));

    width = 580;
    observerState.callback?.();
    expect(scroll.dataset.catalogColumns).toBe('2');

    controller.destroy();
    controller.destroy();
    width = 2172;
    observerState.callback?.();

    expect(disconnected).toBe(true);
    expect(disconnectCount).toBe(1);
    expect(scroll.dataset.catalogColumns).toBe('2');
  });
});
