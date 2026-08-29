import type { Page } from '@playwright/test';

import type { WidgetSurfaceMeasurement } from '../../measurements.ts';
import { ConformanceError } from '../../types.ts';
import type { WidgetSurfaceCase } from '../../widget-manifest.ts';

export async function renderLabWidgetSurface(
  page: Page,
  labOrigin: string,
  surfaceCase: WidgetSurfaceCase
): Promise<WidgetSurfaceMeasurement> {
  try {
    await page.goto(`${labOrigin}/?surface=${encodeURIComponent(surfaceCase.type)}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const article = page.getByRole('article', { name: surfaceCase.title });
    const surface = article.locator(`[data-surface-type="${surfaceCase.type}"]`);
    await surface.waitFor({ state: 'visible' });
    const evidence = await surface.evaluate((root) => {
      if (!(root instanceof HTMLElement)) throw new Error('Surface root is not HTML.');
      const elements = [root, ...root.querySelectorAll<HTMLElement>('*')];
      const unnamedButtons = elements.filter((node) => node instanceof HTMLButtonElement && !(node.getAttribute('aria-label') ?? node.textContent ?? '').trim());
      const scrollOwners = elements.filter((node) => (
        !['TEXTAREA', 'INPUT', 'SELECT'].includes(node.tagName)
          && ['auto', 'scroll'].includes(getComputedStyle(node).overflowY)
          && node.scrollHeight > node.clientHeight + 1
      ));
      const article = articleElement(root);
      const articleStyle = getComputedStyle(article);
      const header = article.querySelector<HTMLElement>(':scope > header');
      const scope = root.querySelector<HTMLElement>('.surface-scope');
      const boundary = root.querySelector<HTMLElement>('.surface-boundary');
      const rowLabels = [...root.querySelectorAll<HTMLElement>('.surface-contract-facts dt')].map((node) => node.textContent?.trim() ?? '');
      const actions = [...root.querySelectorAll<HTMLButtonElement>('.surface-actions button, .widget-content.composer > button')].map((node) => node.textContent?.trim() ?? '');
      const background = effectiveBackground(article);
      return {
        scope: scope?.textContent?.trim(),
        boundary: boundary ? [...boundary.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent ?? '').join('').trim() : null,
        rowLabels,
        actions,
        ready: root.getAttribute('data-surface-state') === 'ready',
        noHorizontalOverflow: article.scrollWidth <= article.clientWidth + 1,
        oneScrollOwner: scrollOwners.length <= 1,
        keyboardAccessible: unnamedButtons.length === 0,
        visual: {
          darkSurface: relativeLuminance(background) < 0.45,
          visibleBorder: parseFloat(articleStyle.borderTopWidth) >= 1 && articleStyle.borderTopStyle !== 'none',
          compactCorners: parseFloat(articleStyle.borderTopLeftRadius) <= 10,
          headerSeparated: Boolean(header && parseFloat(getComputedStyle(header).borderBottomWidth) >= 1)
        },
        overflowDiagnostic: {
          article: `${article.scrollWidth}/${article.clientWidth}`,
          descendants: [article, ...article.querySelectorAll<HTMLElement>('*')]
            .filter((node) => node.scrollWidth > node.clientWidth + 1)
            .slice(0, 8)
            .map((node) => `${node.tagName.toLowerCase()}.${node.className || '-'}:${node.scrollWidth}/${node.clientWidth}`),
          controls: [...article.querySelectorAll<HTMLButtonElement>('header nav button')]
            .map((button) => `${button.className}:${getComputedStyle(button).display}`)
        }
      };

      function articleElement(node: HTMLElement): HTMLElement {
        const owner = node.closest('article');
        if (!(owner instanceof HTMLElement)) throw new Error('Surface article missing.');
        return owner;
      }

      function effectiveBackground(node: HTMLElement): readonly number[] {
        let current: HTMLElement | null = node;
        while (current) {
          const match = getComputedStyle(current).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
          if (match.length >= 3 && (match.length < 4 || (match[3] ?? 1) > 0.2)) return match;
          current = current.parentElement;
        }
        return [255, 255, 255];
      }

      function relativeLuminance(channels: readonly number[]): number {
        const linear = channels.slice(0, 3).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return (linear[0] ?? 1) * 0.2126 + (linear[1] ?? 1) * 0.7152 + (linear[2] ?? 1) * 0.0722;
      }
    });
    const focus = article.getByRole('button', { name: 'Focus Widget' });
    const named = await article.getAttribute('aria-label') === surfaceCase.title;
    const functional = {
      authorityCasePassed: true as const,
      rendered: true as const,
      named: named as true,
      ready: evidence.ready as true,
      noHorizontalOverflow: evidence.noHorizontalOverflow as true,
      oneScrollOwner: evidence.oneScrollOwner as true,
      keyboardAccessible: ((await focus.count()) === 1 && evidence.keyboardAccessible) as true
    };
    const failedChecks = Object.entries(functional)
      .filter(([, passed]) => !passed)
      .map(([name]) => name);
    if (failedChecks.length > 0) throw new Error(`Lab surface failed its semantic readiness audit: ${failedChecks.join(', ')}. ${JSON.stringify(evidence.overflowDiagnostic)}`);
    if (typeof evidence.scope !== 'string' || typeof evidence.boundary !== 'string' || !Array.isArray(evidence.rowLabels) || !Array.isArray(evidence.actions)) {
      throw new Error('Lab surface semantic evidence is incomplete.');
    }
    await article.evaluate((root) => {
      const themeRoot = root.closest('main');
      const owner = root.closest<HTMLElement>('[data-widget-type]');
      if (!(themeRoot instanceof HTMLElement) || !owner?.dataset.widgetType) throw new Error('Surface capture context missing.');
      document.querySelector('[data-conformance-surface-capture]')?.remove();
      const capture = document.createElement('main');
      capture.dataset.conformanceSurfaceCapture = '';
      capture.dataset.pomTheme = themeRoot.dataset.pomTheme ?? 'deep-current';
      capture.dataset.activePanel = 'surface-preview';
      capture.setAttribute('style', themeRoot.getAttribute('style') ?? '');
      Object.assign(capture.style, {
        position: 'fixed',
        zIndex: '2147482999',
        inset: '0 auto auto 0',
        display: 'block',
        width: '420px',
        height: '640px',
        overflow: 'hidden',
        background: '#05090a'
      });
      const slot = document.createElement('div');
      slot.dataset.widgetType = owner.dataset.widgetType;
      slot.dataset.pomegranatePlacement = 'docked';
      Object.assign(slot.style, { width: '420px', height: '640px' });
      capture.append(slot);
      document.body.append(capture);
      slot.append(root);
      Object.assign((root as HTMLElement).style, {
        position: 'fixed',
        zIndex: '2147483000',
        top: '0',
        left: '0',
        width: '420px',
        maxWidth: '420px',
        height: '640px',
        margin: '0',
        overflow: 'hidden'
      });
    });
    return Object.freeze({
      functional: Object.freeze(functional),
      content: Object.freeze({
        scope: evidence.scope,
        boundary: evidence.boundary,
        rowLabels: Object.freeze(evidence.rowLabels as string[]),
        actions: Object.freeze(evidence.actions as string[])
      }),
      visual: Object.freeze({
        darkSurface: evidence.visual.darkSurface as true,
        visibleBorder: evidence.visual.visibleBorder as true,
        compactCorners: evidence.visual.compactCorners as true,
        headerSeparated: evidence.visual.headerSeparated as true
      }),
      trace: Object.freeze([`opened ${surfaceCase.type} direct preview`, 'verified ready anatomy and Focus control'])
    });
  } catch (cause) {
    throw new ConformanceError('IMPLEMENTATION_SETUP_FAILED', `Workbench Lab failed to render ${surfaceCase.type}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      type: surfaceCase.type
    });
  }
}
