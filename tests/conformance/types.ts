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

export type ThemeTarget = 'deep-current' | 'pom-neutral' | 'bunny';
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
