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
    readonly shellRadius: string;
    readonly widgetRadius: string;
    readonly buttonRadius: string;
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
