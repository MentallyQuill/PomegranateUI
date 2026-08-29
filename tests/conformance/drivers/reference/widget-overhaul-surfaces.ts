import type { Page } from '@playwright/test';

import type { WidgetSurfaceMeasurement } from '../../measurements.ts';
import { ConformanceError } from '../../types.ts';
import type { WidgetSurfaceCase } from '../../widget-manifest.ts';

const sourcePath = '/prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul.html?test=1';

export async function prepareWidgetOverhaulSurfacePage(page: Page, preservationOrigin: string) {
  try {
    await page.goto(`${preservationOrigin}${sourcePath}`, { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean((window as unknown as { SonderWidgetMockup?: unknown }).SonderWidgetMockup));
  } catch (cause) {
    throw new ConformanceError('REFERENCE_SETUP_FAILED', 'Widget Overhaul surface API did not become available.', {
      cause: cause instanceof Error ? cause.message : String(cause)
    });
  }
}

export function requireSurfaceHarnessCase(cases: ReadonlySet<string>, surfaceCase: WidgetSurfaceCase): string {
  const matches = [...cases].filter((title) => title.includes(surfaceCase.harnessCaseFragment));
  if (matches.length === 0) {
    throw new ConformanceError('REFERENCE_SETUP_FAILED', `No passing Widget Overhaul case covers ${surfaceCase.type}.`, {
      type: surfaceCase.type,
      fragment: surfaceCase.harnessCaseFragment
    });
  }
  return matches.sort()[0] as string;
}

export async function renderWidgetOverhaulSurface(
  page: Page,
  surfaceCase: WidgetSurfaceCase
): Promise<WidgetSurfaceMeasurement> {
  try {
    const measurement = await page.evaluate((type) => {
      const api = (window as unknown as {
        SonderWidgetMockup?: {
          catalogDefinitions: readonly { type: string; name: string }[];
          readyBlueprints: Readonly<Record<string, { scope: string; rows: readonly (readonly [string, string])[]; boundary: string; actions: readonly string[] }>>;
          renderWidgetReady: (widgetType: string) => HTMLElement | null;
        }
      }).SonderWidgetMockup;
      if (!api) throw new Error('Widget Overhaul API missing.');
      const definition = api.catalogDefinitions.find((candidate) => candidate.type === type);
      const blueprint = api.readyBlueprints[type];
      const widget = api.renderWidgetReady(type);
      if (!definition || !blueprint || !(widget instanceof HTMLElement)) throw new Error(`Reference surface missing for ${type}.`);
      document.querySelector('[data-conformance-surface-host]')?.remove();
      const host = document.createElement('section');
      host.dataset.conformanceSurfaceHost = '';
      host.setAttribute('aria-label', `${definition.name} authority surface`);
      Object.assign(host.style, {
        position: 'fixed',
        zIndex: '2147483000',
        top: '82px',
        left: '50%',
        width: '420px',
        height: '700px',
        padding: '12px',
        overflow: 'auto',
        transform: 'translateX(-50%)',
        border: '1px solid rgba(148,217,208,.45)',
        background: 'rgb(5 11 13 / 98%)',
        boxShadow: '0 28px 90px rgb(0 0 0 / 72%)'
      });
      Object.assign(widget.style, {
        width: '420px',
        maxWidth: '420px',
        height: '640px',
        margin: '0',
        boxSizing: 'border-box',
        overflow: 'hidden'
      });
      host.append(widget);
      document.querySelector('#sonder-calibration')?.append(host);
      const elements = [widget, ...widget.querySelectorAll<HTMLElement>('*')];
      const unnamedButtons = elements.filter((node) => node instanceof HTMLButtonElement && !(node.getAttribute('aria-label') ?? node.textContent ?? '').trim());
      const scrollOwners = elements.filter((node) => (
        !['TEXTAREA', 'INPUT', 'SELECT'].includes(node.tagName)
          && ['auto', 'scroll'].includes(getComputedStyle(node).overflowY)
          && node.scrollHeight > node.clientHeight + 1
      ));
      return {
        functional: {
          authorityCasePassed: true as const,
          rendered: true as const,
          named: Boolean(definition.name) as true,
          ready: true as const,
          noHorizontalOverflow: (widget.scrollWidth <= widget.clientWidth + 1) as true,
          oneScrollOwner: (scrollOwners.length <= 1) as true,
          keyboardAccessible: (unnamedButtons.length === 0) as true
        },
        content: {
          scope: blueprint.scope,
          boundary: blueprint.boundary,
          rowLabels: blueprint.rows.map(([label]) => label),
          actions: [...blueprint.actions]
        }
      };
    }, surfaceCase.type);
    const failedChecks = Object.entries(measurement.functional)
      .filter(([, passed]) => !passed)
      .map(([name]) => name);
    if (failedChecks.length > 0) throw new Error(`Reference surface failed its semantic readiness audit: ${failedChecks.join(', ')}.`);
    return Object.freeze({
      functional: Object.freeze(measurement.functional),
      content: Object.freeze({
        ...measurement.content,
        rowLabels: Object.freeze(measurement.content.rowLabels),
        actions: Object.freeze(measurement.content.actions)
      }),
      trace: Object.freeze([`renderWidgetReady(${surfaceCase.type})`, 'passed harness case required'])
    });
  } catch (cause) {
    throw new ConformanceError('REFERENCE_SETUP_FAILED', `Widget Overhaul failed to render ${surfaceCase.type}: ${cause instanceof Error ? cause.message : String(cause)}`, {
      type: surfaceCase.type
    });
  }
}
