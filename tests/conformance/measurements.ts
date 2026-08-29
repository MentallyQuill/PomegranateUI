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
  readonly trace: readonly string[];
}
