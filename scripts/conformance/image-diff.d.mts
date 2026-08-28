export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

export interface ImageDiffSummary {
  readonly compatible: boolean;
  readonly reference: ImageDimensions;
  readonly actual: ImageDimensions;
  readonly differingPixels: number | null;
  readonly maximumChannelDelta: number | null;
}

export interface ImageDiffResult {
  readonly summary: ImageDiffSummary;
  readonly overlay?: Buffer;
  readonly diff?: Buffer;
}

export function createImageDiff(referenceBuffer: Buffer, actualBuffer: Buffer): ImageDiffResult;
