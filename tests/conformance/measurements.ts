export interface WidgetSurfaceMeasurement {
  readonly functional: {
    readonly authorityCasePassed: true;
    readonly rendered: true;
    readonly named: true;
    readonly ready: true;
    readonly noHorizontalOverflow: true;
    readonly oneScrollOwner: true;
    readonly keyboardAccessible: true;
  };
  readonly content: {
    readonly scope: string;
    readonly boundary: string;
    readonly rowLabels: readonly string[];
    readonly actions: readonly string[];
  };
  readonly visual: {
    readonly darkSurface: boolean;
    readonly visibleBorder: boolean;
    readonly compactCorners: boolean;
    readonly headerSeparated: boolean;
  };
  readonly trace: readonly string[];
}

export interface CatalogMeasurement {
  readonly functional: {
    readonly authorityCasePassed: true;
    readonly outcomeReached: true;
    readonly keyboardAccessible: true;
  };
  readonly inventory: {
    readonly total: number;
    readonly story: number;
    readonly library: number;
    readonly systems: number;
    readonly settings: number;
    readonly extensions: number;
  };
  readonly lifecycle: {
    readonly placed: number;
    readonly persisted: number;
    readonly rendered: number;
    readonly removed: number;
  };
  readonly trace: readonly string[];
}

export interface ThemeTargetMeasurement {
  readonly functional: {
    readonly targetApplied: true;
    readonly identityStable: true;
    readonly instant: true;
    readonly noHorizontalOverflow: true;
    readonly keyboardAccessible: true;
    readonly scenarioStateReached: true;
  };
  readonly structure: {
    readonly panelTabs: readonly string[];
    readonly anchorWidgets: readonly string[];
  };
  readonly visual: {
    readonly canvas: string;
    readonly accent: string;
    readonly text: string;
    readonly shelfRadius?: string;
    readonly shellRadius: string;
    readonly dockRadius?: string;
    readonly widgetRadius: string;
    readonly buttonRadius: string;
    readonly readerRadius?: string;
    readonly readerFontSize?: string;
    readonly readerLineHeight?: string;
    readonly widgetHasGradient?: boolean;
    readonly readerHasMaterial?: boolean;
    readonly readerIntersectsStage?: boolean;
  };
  readonly trace: readonly string[];
}

export interface ThemeAuthoringMeasurement {
  readonly functional: {
    readonly controlsPresent: true;
    readonly targetApplied: true;
    readonly appliedEditableIndependent: true;
    readonly workbenchIdentityStable: true;
    readonly layoutIndependent: true;
  };
  readonly outcome: Readonly<Record<string, unknown>>;
  readonly trace: readonly string[];
}

export interface FidelitySelectors {
  readonly geometry: Readonly<Record<keyof FidelityMeasurement['geometry'], string>>;
  readonly typography: Readonly<Record<keyof FidelityMeasurement['typography'], string>>;
  readonly materials: Readonly<Record<keyof FidelityMeasurement['materials'], string>>;
  readonly panelTabs: string;
  readonly widgets: string;
  readonly root: string;
}

const emptyRegion: RegionMeasurement = Object.freeze({
  box: Object.freeze({ x: 0, y: 0, width: 0, height: 0, right: 0, bottom: 0 }),
  visible: false,
  overflow: Object.freeze({ x: false, y: false, scrollWidth: 0, clientWidth: 0, scrollHeight: 0, clientHeight: 0 }),
  styles: Object.freeze({ backgroundColor: '', borderTopColor: '', color: '', fontFamily: '', backdropFilter: '' })
});

async function measureRegion(locator: Locator): Promise<RegionMeasurement> {
  if (await locator.count() === 0) return emptyRegion;
  return locator.first().evaluate((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      box: { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom },
      visible: box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0,
      overflow: {
        x: element.scrollWidth > element.clientWidth,
        y: element.scrollHeight > element.clientHeight,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight
      },
      styles: {
        backgroundColor: style.backgroundColor,
        borderTopColor: style.borderTopColor,
        color: style.color,
        fontFamily: style.fontFamily,
        backdropFilter: style.backdropFilter
      }
    };
  });
}

async function measureTypography(locator: Locator): Promise<TypographyMeasurement> {
  if (await locator.count() === 0) {
    return Object.freeze({ family: '', size: 0, weight: 0, lineHeight: 0, tracking: 0, transform: '' });
  }
  return locator.first().evaluate((element) => {
    const style = getComputedStyle(element);
    const size = Number.parseFloat(style.fontSize) || 0;
    return {
      family: style.fontFamily,
      size,
      weight: Number.parseFloat(style.fontWeight) || 0,
      lineHeight: style.lineHeight === 'normal' ? size * 1.2 : Number.parseFloat(style.lineHeight) || 0,
      tracking: style.letterSpacing === 'normal' ? 0 : Number.parseFloat(style.letterSpacing) || 0,
      transform: style.textTransform
    };
  });
}

async function measureMaterial(locator: Locator): Promise<MaterialMeasurement> {
  if (await locator.count() === 0) {
    return Object.freeze({ background: '', opacity: 0, blur: 0, border: '', radius: 0, shadow: '' });
  }
  return locator.first().evaluate((element) => {
    const style = getComputedStyle(element);
    const blurMatch = style.backdropFilter.match(/blur\(([-\d.]+)px\)/);
    return {
      background: style.backgroundColor,
      opacity: Number.parseFloat(style.opacity) || 0,
      blur: blurMatch ? Number.parseFloat(blurMatch[1] ?? '0') : 0,
      border: `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
      radius: Number.parseFloat(style.borderTopLeftRadius) || 0,
      shadow: style.boxShadow
    };
  });
}

export async function measureFidelitySurface(
  locate: (selector: string) => Locator,
  selectors: FidelitySelectors,
  options: { readonly identityStable?: boolean } = {}
): Promise<FidelityMeasurement> {
  try {
    const geometryEntries = await Promise.all(Object.entries(selectors.geometry).map(async ([id, selector]) => (
      [id, await measureRegion(locate(selector))] as const
    )));
    const typographyEntries = await Promise.all(Object.entries(selectors.typography).map(async ([id, selector]) => (
      [id, await measureTypography(locate(selector))] as const
    )));
    const materialEntries = await Promise.all(Object.entries(selectors.materials).map(async ([id, selector]) => (
      [id, await measureMaterial(locate(selector))] as const
    )));
    const root = locate(selectors.root).first();
    const documentMeasurement = await root.evaluate((element) => {
      const documentElement = element.ownerDocument.documentElement;
      return {
        noOverflow: documentElement.scrollWidth <= documentElement.clientWidth + 1
          && documentElement.scrollHeight <= documentElement.clientHeight + 1,
        keyboardAccessible: [...element.querySelectorAll<HTMLElement>('button, input, select, textarea, [role="tab"]')]
          .some((candidate) => !candidate.hasAttribute('disabled') && candidate.getClientRects().length > 0)
      };
    });
    if (!documentMeasurement.noOverflow) throw new Error('document overflowed the fidelity viewport');
    if (!documentMeasurement.keyboardAccessible) throw new Error('no reachable keyboard control was rendered');

    const panelTabs = await locate(selectors.panelTabs).allInnerTexts();
    const widgetRecords = await locate(selectors.widgets).evaluateAll((elements) => elements
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => {
        const title = element.querySelector('[data-pom-part="widget.header"]')?.textContent?.trim()
          || element.getAttribute('data-widget-type')
          || 'Widget';
        const placement = element.getAttribute('data-pomegranate-placement') ?? 'docked';
        const region = element.getAttribute('data-pomegranate-region') ?? placement;
        return { title, location: region };
      }));
    const regions = await locate('[data-conformance-region]').evaluateAll((elements) => elements
      .map((element) => element.getAttribute('data-conformance-region'))
      .filter((value): value is string => Boolean(value)));

    return {
      geometry: Object.fromEntries(geometryEntries) as FidelityMeasurement['geometry'],
      typography: Object.fromEntries(typographyEntries) as FidelityMeasurement['typography'],
      materials: Object.fromEntries(materialEntries) as FidelityMeasurement['materials'],
      structure: {
        panelTabs: panelTabs.map((label) => label.trim()).filter(Boolean),
        regions,
        visibleWidgets: widgetRecords.map(({ title }) => title),
        widgetLocations: Object.freeze(Object.fromEntries(widgetRecords.map(({ title, location }) => [title, location])))
      },
      functional: {
        stateReached: true,
        identityStable: options.identityStable === false ? (() => { throw new Error('Workbench identity changed'); })() : true,
        noOverflow: true,
        keyboardAccessible: true
      }
    };
  } catch (cause) {
    throw new ConformanceError('MEASUREMENT_FAILED', 'Exact fidelity measurement failed.', {
      cause: cause instanceof Error ? cause.message : String(cause)
    });
  }
}
import type { Locator } from '@playwright/test';

import { ConformanceError, type FidelityMeasurement, type MaterialMeasurement, type RegionMeasurement, type TypographyMeasurement } from './types.ts';
