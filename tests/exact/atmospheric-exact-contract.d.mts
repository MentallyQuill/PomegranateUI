export interface AtmosphericMask {
  readonly id: string;
  readonly textBoundId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly kind: 'glyph-only';
}

export interface AtmosphericPixelReportCompatible {
  readonly compatible: true;
  readonly reference: { readonly width: number; readonly height: number };
  readonly candidate: { readonly width: number; readonly height: number };
  readonly comparedPixels: number;
  readonly differingPixels: number;
  readonly mismatchRatio: number;
  readonly highContrastMismatchCount: number;
  readonly structuralSimilarity: number;
}

export interface AtmosphericPixelReportIncompatible {
  readonly compatible: false;
  readonly reference: { readonly width: number; readonly height: number };
  readonly candidate: { readonly width: number; readonly height: number };
}

export const ATMOSPHERIC_SOURCE_SHA256: string;
export const ATMOSPHERIC_EXACT_GEOMETRY: Readonly<Record<string, Readonly<{ x: number; y: number; width: number; height: number }>>>;

export function validateAtmosphericContract(
  contract: unknown,
  options?: { readonly skipReferenceImageHash?: boolean; readonly referenceImageBytes?: Uint8Array }
): unknown;

export function compareAtmosphericPixels(
  referenceBytes: Uint8Array,
  candidateBytes: Uint8Array,
  masks: readonly AtmosphericMask[]
): AtmosphericPixelReportCompatible | AtmosphericPixelReportIncompatible;
