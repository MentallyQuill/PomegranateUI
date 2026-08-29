export type ConformanceErrorCode =
  | 'REFERENCE_HASH_DRIFT'
  | 'REFERENCE_SETUP_FAILED'
  | 'IMPLEMENTATION_SETUP_FAILED'
  | 'MANIFEST_INVALID'
  | 'MEASUREMENT_FAILED'
  | 'UNLEDGERED_DISCREPANCY'
  | 'DISCREPANCY_REMAINS'
  | 'STALE_DISCREPANCY'
  | 'UNAPPROVED_DEVIATION';

export class ConformanceError extends Error {
  readonly code: ConformanceErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: ConformanceErrorCode,
    message: string,
    details: Readonly<Record<string, unknown>> = {}
  ) {
    super(message);
    this.name = 'ConformanceError';
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export type ThemeTarget = 'deep-current' | 'pom-neutral' | 'bunny' | 'ash-amber';
export type InputMode = 'fine-pointer' | 'coarse-pointer' | 'keyboard';

export interface AuthorityRecord {
  readonly id: string;
  readonly path: string;
  readonly sha256: string;
  readonly expectedHarnessTotal?: number;
}

export interface CaptureDefinition {
  readonly kind: 'viewport' | 'locator';
  readonly referenceLocator?: string;
  readonly implementationLocator?: string;
  readonly maskProfiles?: readonly string[];
}

export interface ConformanceScenario {
  readonly id: string;
  readonly title: string;
  readonly target: ThemeTarget;
  readonly authority: string;
  readonly authorityPath: string;
  readonly authoritySha256?: string;
  readonly viewport: string;
  readonly inputModes: readonly InputMode[];
  readonly referenceState: string;
  readonly implementationState: string;
  readonly capture: CaptureDefinition;
  readonly measurementProfile: string;
  readonly assertionProfile: string;
  readonly allowedDeviationIds: readonly string[];
}

export interface ViewportDefinition {
  readonly width: number;
  readonly height: number;
}

export type ShellRegionId = 'shelf' | 'left' | 'stage' | 'right' | 'composer';

export interface RegionMeasurement {
  readonly box: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly right: number;
    readonly bottom: number;
  };
  readonly visible: boolean;
  readonly overflow: {
    readonly x: boolean;
    readonly y: boolean;
    readonly scrollWidth: number;
    readonly clientWidth: number;
    readonly scrollHeight: number;
    readonly clientHeight: number;
  };
  readonly styles: {
    readonly backgroundColor: string;
    readonly borderTopColor: string;
    readonly color: string;
    readonly fontFamily: string;
    readonly backdropFilter: string;
  };
}

export interface ShellMeasurement {
  readonly viewport: { readonly width: number; readonly height: number };
  readonly regions: Readonly<Record<ShellRegionId, RegionMeasurement>>;
  readonly document: {
    readonly scrollWidth: number;
    readonly clientWidth: number;
    readonly scrollHeight: number;
    readonly clientHeight: number;
  };
}

export interface ManifestValidationOptions {
  readonly repositoryRoot: string;
  readonly authorities: ReadonlyMap<string, AuthorityRecord>;
  readonly viewports: ReadonlyMap<string, ViewportDefinition>;
  readonly driverIds: ReadonlySet<string>;
  readonly measurementProfileIds: ReadonlySet<string>;
  readonly assertionProfileIds: ReadonlySet<string>;
  readonly deviationIds: ReadonlySet<string>;
  readonly hashFile: (absolutePath: string) => Promise<string>;
}

export interface ValidatedConformanceManifest {
  readonly scenarios: readonly ConformanceScenario[];
}
