import { PNG } from 'pngjs';

import type { FidelityMeasurement } from './types.ts';

export interface SourceFidelityCheck {
  readonly id: string;
  readonly pass: boolean;
  readonly reference: number | string | boolean;
  readonly implementation: number | string | boolean;
}

export interface SourceFidelityResult {
  readonly pass: boolean;
  readonly checks: readonly SourceFidelityCheck[];
  readonly metrics?: Readonly<Record<string, number>>;
}

function ratioDelta(reference: number, implementation: number): number {
  return Math.abs(reference - implementation) / Math.max(1, Math.abs(reference));
}

export function compareLiveAuthorityFidelity(
  reference: FidelityMeasurement,
  implementation: FidelityMeasurement
): SourceFidelityResult {
  const checks: SourceFidelityCheck[] = [];
  const ratio = (id: string, referenceValue: number, implementationValue: number, tolerance: number) => {
    checks.push(Object.freeze({
      id,
      pass: ratioDelta(referenceValue, implementationValue) <= tolerance,
      reference: referenceValue,
      implementation: implementationValue
    }));
  };
  const exact = (id: string, referenceValue: string | boolean, implementationValue: string | boolean) => {
    checks.push(Object.freeze({ id, pass: referenceValue === implementationValue, reference: referenceValue, implementation: implementationValue }));
  };

  exact('structure.panelTabs', JSON.stringify(reference.structure.panelTabs), JSON.stringify(implementation.structure.panelTabs));
  for (const key of ['stateReached', 'identityStable', 'noOverflow', 'keyboardAccessible'] as const) {
    exact(`functional.${key}`, reference.functional[key], implementation.functional[key]);
  }
  ratio('geometry.header.height', reference.geometry.header.box.height, implementation.geometry.header.box.height, 0.2);
  ratio('geometry.left.width', reference.geometry.left.box.width, implementation.geometry.left.box.width, 0.22);
  ratio('geometry.right.width', reference.geometry.right.box.width, implementation.geometry.right.box.width, 0.22);
  ratio('geometry.stage.width', reference.geometry.stage.box.width, implementation.geometry.stage.box.width, 0.22);
  ratio('geometry.story.width', reference.geometry.story.box.width, implementation.geometry.story.box.width, 0.22);
  ratio('geometry.composer.width', reference.geometry.composer.box.width, implementation.geometry.composer.box.width, 0.22);
  ratio('typography.storyBody.size', reference.typography.storyBody.size, implementation.typography.storyBody.size, 0.25);
  checks.push(Object.freeze({
    id: 'materials.header.radius',
    pass: Math.abs(reference.materials.header.radius - implementation.materials.header.radius) <= 1,
    reference: reference.materials.header.radius,
    implementation: implementation.materials.header.radius
  }));

  const referenceViewportWidth = reference.geometry.header.box.width;
  const implementationViewportWidth = implementation.geometry.header.box.width;
  for (const region of ['story', 'composer'] as const) {
    const referenceCenter = (reference.geometry[region].box.x + reference.geometry[region].box.width / 2) / referenceViewportWidth;
    const implementationCenter = (implementation.geometry[region].box.x + implementation.geometry[region].box.width / 2) / implementationViewportWidth;
    checks.push(Object.freeze({
      id: `geometry.${region}.normalizedCenter`,
      pass: Math.abs(referenceCenter - implementationCenter) <= 0.03,
      reference: referenceCenter,
      implementation: implementationCenter
    }));
  }
  const implementationAxisDelta = Math.abs(
    implementation.geometry.story.box.x + implementation.geometry.story.box.width / 2
    - implementation.geometry.composer.box.x - implementation.geometry.composer.box.width / 2
  );
  checks.push(Object.freeze({
    id: 'geometry.storyComposer.axis',
    pass: implementationAxisDelta <= 1,
    reference: 0,
    implementation: implementationAxisDelta
  }));

  return Object.freeze({ pass: checks.every(({ pass }) => pass), checks: Object.freeze(checks) });
}

const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 64;

function sampledLuma(image: PNG): number[] {
  const result: number[] = [];
  for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
    for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
      const sourceX = Math.min(image.width - 1, Math.floor((x + 0.5) * image.width / SAMPLE_WIDTH));
      const sourceY = Math.min(image.height - 1, Math.floor((y + 0.5) * image.height / SAMPLE_HEIGHT));
      const offset = (sourceY * image.width + sourceX) * 4;
      result.push(
        (image.data[offset] ?? 0) * 0.2126
        + (image.data[offset + 1] ?? 0) * 0.7152
        + (image.data[offset + 2] ?? 0) * 0.0722
      );
    }
  }
  return result;
}

function edges(luma: readonly number[]): number[] {
  const result: number[] = [];
  for (let y = 1; y < SAMPLE_HEIGHT - 1; y += 1) {
    for (let x = 1; x < SAMPLE_WIDTH - 1; x += 1) {
      const offset = y * SAMPLE_WIDTH + x;
      result.push(Math.hypot(
        (luma[offset + 1] ?? 0) - (luma[offset - 1] ?? 0),
        (luma[offset + SAMPLE_WIDTH] ?? 0) - (luma[offset - SAMPLE_WIDTH] ?? 0)
      ));
    }
  }
  return result;
}

function correlation(left: readonly number[], right: readonly number[]): number {
  const leftMean = left.reduce((total, value) => total + value, 0) / left.length;
  const rightMean = right.reduce((total, value) => total + value, 0) / right.length;
  let covariance = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftValue = (left[index] ?? 0) - leftMean;
    const rightValue = (right[index] ?? 0) - rightMean;
    covariance += leftValue * rightValue;
    leftVariance += leftValue * leftValue;
    rightVariance += rightValue * rightValue;
  }
  const denominator = Math.sqrt(leftVariance * rightVariance);
  return denominator === 0 ? (leftVariance === rightVariance ? 1 : -1) : covariance / denominator;
}

export function compareRecordingFrameFidelity(referenceBytes: Uint8Array, implementationBytes: Uint8Array): SourceFidelityResult {
  const reference = PNG.sync.read(Buffer.from(referenceBytes));
  const implementation = PNG.sync.read(Buffer.from(implementationBytes));
  const sameDimensions = reference.width === implementation.width && reference.height === implementation.height;
  if (!sameDimensions) {
    const checks = Object.freeze([Object.freeze({
      id: 'recording.dimensions',
      pass: false,
      reference: `${reference.width}x${reference.height}`,
      implementation: `${implementation.width}x${implementation.height}`
    })]);
    return Object.freeze({ pass: false, checks });
  }

  const referenceLuma = sampledLuma(reference);
  const implementationLuma = sampledLuma(implementation);
  const lumaCorrelation = correlation(referenceLuma, implementationLuma);
  const edgeCorrelation = correlation(edges(referenceLuma), edges(implementationLuma));
  const referenceMeanLuma = referenceLuma.reduce((total, value) => total + value, 0) / referenceLuma.length;
  const implementationMeanLuma = implementationLuma.reduce((total, value) => total + value, 0) / implementationLuma.length;
  let absoluteError = 0;
  for (let offset = 0; offset < reference.data.length; offset += 4) {
    absoluteError += Math.abs((reference.data[offset] ?? 0) - (implementation.data[offset] ?? 0));
    absoluteError += Math.abs((reference.data[offset + 1] ?? 0) - (implementation.data[offset + 1] ?? 0));
    absoluteError += Math.abs((reference.data[offset + 2] ?? 0) - (implementation.data[offset + 2] ?? 0));
  }
  const meanAbsoluteError = absoluteError / (reference.width * reference.height * 3);
  const metrics = Object.freeze({
    meanAbsoluteError,
    meanLumaDelta: Math.abs(referenceMeanLuma - implementationMeanLuma),
    lumaCorrelation,
    edgeCorrelation
  });
  const checks = Object.freeze([
    Object.freeze({ id: 'recording.dimensions', pass: true, reference: `${reference.width}x${reference.height}`, implementation: `${implementation.width}x${implementation.height}` }),
    Object.freeze({ id: 'recording.meanAbsoluteError', pass: meanAbsoluteError <= 32, reference: 0, implementation: meanAbsoluteError }),
    Object.freeze({ id: 'recording.meanLumaDelta', pass: metrics.meanLumaDelta <= 45, reference: 0, implementation: metrics.meanLumaDelta }),
    Object.freeze({ id: 'recording.lumaCorrelation', pass: lumaCorrelation >= 0.18, reference: 1, implementation: lumaCorrelation }),
    Object.freeze({ id: 'recording.edgeCorrelation', pass: edgeCorrelation >= 0.27, reference: 1, implementation: edgeCorrelation })
  ]);
  return Object.freeze({ pass: checks.every(({ pass }) => pass), checks, metrics });
}
