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
      return {
        scope: root.getAttribute('data-surface-scope'),
        boundary: root.getAttribute('data-surface-boundary'),
        rowLabels: JSON.parse(root.getAttribute('data-surface-row-labels') ?? 'null') as unknown,
        actions: JSON.parse(root.getAttribute('data-surface-actions') ?? 'null') as unknown,
        ready: root.getAttribute('data-surface-state') === 'ready',
        noHorizontalOverflow: article.scrollWidth <= article.clientWidth + 1,
        oneScrollOwner: scrollOwners.length <= 1,
        keyboardAccessible: unnamedButtons.length === 0,
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
      const underlay = document.createElement('div');
      underlay.dataset.conformanceSurfaceUnderlay = '';
      Object.assign(underlay.style, {
        position: 'fixed',
        zIndex: '2147482999',
        top: '0',
        left: '0',
        width: '420px',
        height: '640px',
        background: '#05090a'
      });
      document.body.append(underlay, root);
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
      trace: Object.freeze([`opened ${surfaceCase.type} direct preview`, 'verified ready anatomy and Focus control'])
    });
  } catch (cause) {
    throw new ConformanceError('IMPLEMENTATION_SETUP_FAILED', `Workbench Lab failed to render ${surfaceCase.type}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      type: surfaceCase.type
    });
  }
}
