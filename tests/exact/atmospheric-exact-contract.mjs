import { createHash } from 'node:crypto';

import { PNG } from 'pngjs';

export const ATMOSPHERIC_SOURCE_SHA256 = '38878d2cf8a86f5e879faba4b41a214e4293f22ed755975023e02c962d61b913';

// Chromium composites fractional borders, filters, and font edges with small
// channel-level variance across equivalent DOM/CSS. The visual contract treats
// deltas below one eighth of the channel range as sub-perceptual raster noise;
// geometry, high-contrast drift, and SSIM remain independently fail-closed.
export const ATMOSPHERIC_PERCEPTUAL_CHANNEL_DELTA = 32;

export const ATMOSPHERIC_EXACT_GEOMETRY = Object.freeze({
  header: Object.freeze({ x: 0, y: 0, width: 1920, height: 40 }),
  left: Object.freeze({ x: 0, y: 40, width: 286, height: 1240 }),
  stage: Object.freeze({ x: 286, y: 40, width: 1348, height: 1240 }),
  right: Object.freeze({ x: 1634, y: 40, width: 286, height: 1240 }),
  story: Object.freeze({ x: 560, y: 1072.109375, width: 800, height: 105.890625 }),
  composer: Object.freeze({ x: 560, y: 1206, width: 800, height: 56 })
});

const ATMOSPHERIC_APPROVED_LAYOUT_BOUNDS = Object.freeze({
  'header-panel-control-adjacent': Object.freeze({ x: 372, y: 0, width: 33, height: 40 }),
  'header-panel-control-previous': Object.freeze({ x: 532, y: 0, width: 33, height: 40 }),
  'left-character-roster': Object.freeze({ x: 0, y: 68, width: 286, height: 214 }),
  'story-reading-measure': Object.freeze({ x: 540, y: 1020, width: 840, height: 242 }),
  'left-toolbar-column-controls': Object.freeze({ x: 226, y: 1250, width: 60, height: 30 }),
  'right-toolbar-column-controls': Object.freeze({ x: 1634, y: 1250, width: 60, height: 30 })
});

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertRectangle(value, label) {
  if (!isRecord(value)) throw new Error(`${label} must be a rectangle.`);
  for (const key of ['x', 'y', 'width', 'height']) {
    if (!Number.isInteger(value[key])) throw new Error(`${label}.${key} must be an integer.`);
  }
  if (value.x < 0 || value.y < 0 || value.width <= 0 || value.height <= 0) {
    throw new Error(`${label} must have non-negative coordinates and positive dimensions.`);
  }
}

function contains(outer, inner) {
  return inner.x >= outer.x
    && inner.y >= outer.y
    && inner.x + inner.width <= outer.x + outer.width
    && inner.y + inner.height <= outer.y + outer.height;
}

export function validateAtmosphericContract(contract, options = {}) {
  if (!isRecord(contract)) throw new Error('Atmospheric authority contract must be an object.');
  if (contract.schemaVersion !== 'pomegranate.ui.atmospheric-exact.v1') {
    throw new Error('Atmospheric authority contract schema is unsupported.');
  }
  if (contract.source !== 'atmospheric-workbench') {
    throw new Error('Atmospheric authority must be source-owned and cannot be captured from the Workbench Lab candidate.');
  }
  if (contract.authoritySourceSha256 !== ATMOSPHERIC_SOURCE_SHA256) {
    throw new Error('Atmospheric source fragment hash drifted.');
  }
  if (contract.viewport?.width !== 1920 || contract.viewport?.height !== 1280 || contract.viewport?.deviceScaleFactor !== 1) {
    throw new Error('Atmospheric exact authority viewport must be 1920 by 1280 at device scale factor 1.');
  }
  for (const [id, expected] of Object.entries(ATMOSPHERIC_EXACT_GEOMETRY)) {
    const actual = contract.geometry?.[id];
    if (!actual || Object.entries(expected).some(([key, value]) => actual[key] !== value)) {
      throw new Error(`Atmospheric geometry landmark ${id} drifted from the reviewed source.`);
    }
  }
  if (!/^[a-f0-9]{64}$/i.test(contract.referenceImageSha256 ?? '')) {
    throw new Error('Atmospheric reference image hash is malformed.');
  }
  if (!Array.isArray(contract.textMaskBounds) || !Array.isArray(contract.approvedLayoutBounds) || !Array.isArray(contract.masks)) {
    throw new Error('Atmospheric text bounds, approved layout bounds, and masks must be arrays.');
  }
  const approvedLayoutEntries = Object.entries(ATMOSPHERIC_APPROVED_LAYOUT_BOUNDS);
  if (contract.approvedLayoutBounds.length !== approvedLayoutEntries.length) {
    throw new Error('Atmospheric approved layout bounds must contain exactly the reviewed exceptions.');
  }
  for (const [id, expected] of approvedLayoutEntries) {
    const actual = contract.approvedLayoutBounds.find((bound) => bound?.id === id);
    if (!actual || Object.entries(expected).some(([key, value]) => actual[key] !== value)) {
      throw new Error(`Atmospheric approved layout bound ${id} drifted from the reviewed exception.`);
    }
  }
  const bounds = new Map();
  for (const [index, bound] of contract.textMaskBounds.entries()) {
    assertRectangle(bound, `textMaskBounds[${index}]`);
    if (typeof bound.id !== 'string' || !bound.id || bounds.has(bound.id)) {
      throw new Error('Atmospheric text mask bounds require unique IDs.');
    }
    bounds.set(bound.id, bound);
  }
  const layoutBounds = new Map();
  for (const [index, bound] of contract.approvedLayoutBounds.entries()) {
    assertRectangle(bound, `approvedLayoutBounds[${index}]`);
    if (typeof bound.id !== 'string' || !bound.id || layoutBounds.has(bound.id)) {
      throw new Error('Atmospheric approved layout bounds require unique IDs.');
    }
    layoutBounds.set(bound.id, bound);
  }
  const maskIds = new Set();
  for (const [index, mask] of contract.masks.entries()) {
    assertRectangle(mask, `masks[${index}]`);
    if (typeof mask.id !== 'string' || !mask.id || maskIds.has(mask.id)) {
      throw new Error('Atmospheric masks require unique IDs.');
    }
    maskIds.add(mask.id);
    if (mask.kind === 'glyph-only') {
      const bound = bounds.get(mask.textBoundId);
      if (!bound || !contains(bound, mask)) {
        throw new Error(`Atmospheric mask ${mask.id} extends outside reviewed text pixels.`);
      }
    } else if (mask.kind === 'approved-layout') {
      const bound = layoutBounds.get(mask.layoutBoundId);
      if (!bound || !contains(bound, mask)) {
        throw new Error(`Atmospheric mask ${mask.id} extends outside approved layout pixels.`);
      }
    } else {
      throw new Error('Atmospheric authority permits glyph-only and approved-layout masks only.');
    }
  }
  if (!options.skipReferenceImageHash) {
    const referenceImageBytes = options.referenceImageBytes;
    if (!(referenceImageBytes instanceof Uint8Array)) {
      throw new Error('Atmospheric reference image bytes are required for hash validation.');
    }
    const hash = createHash('sha256').update(referenceImageBytes).digest('hex');
    if (hash !== contract.referenceImageSha256.toLowerCase()) {
      throw new Error('Atmospheric reference image hash drifted.');
    }
  }
  return contract;
}

function masked(x, y, masks) {
  return masks.some((mask) => x >= mask.x
    && y >= mask.y
    && x < mask.x + mask.width
    && y < mask.y + mask.height);
}

function structuralSimilarity(left, right) {
  if (left.length === 0) return 1;
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let leftVariance = 0;
  let rightVariance = 0;
  let covariance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = left[index] - leftMean;
    const rightDelta = right[index] - rightMean;
    leftVariance += leftDelta * leftDelta;
    rightVariance += rightDelta * rightDelta;
    covariance += leftDelta * rightDelta;
  }
  const divisor = Math.max(1, left.length - 1);
  leftVariance /= divisor;
  rightVariance /= divisor;
  covariance /= divisor;
  const c1 = (0.01 * 255) ** 2;
  const c2 = (0.03 * 255) ** 2;
  return ((2 * leftMean * rightMean + c1) * (2 * covariance + c2))
    / ((leftMean ** 2 + rightMean ** 2 + c1) * (leftVariance + rightVariance + c2));
}

export function compareAtmosphericPixels(referenceBytes, candidateBytes, masks) {
  const referenceImage = PNG.sync.read(Buffer.from(referenceBytes));
  const candidateImage = PNG.sync.read(Buffer.from(candidateBytes));
  const reference = { width: referenceImage.width, height: referenceImage.height };
  const candidate = { width: candidateImage.width, height: candidateImage.height };
  if (reference.width !== candidate.width || reference.height !== candidate.height) {
    return { compatible: false, reference, candidate };
  }

  let comparedPixels = 0;
  let differingPixels = 0;
  let highContrastMismatchCount = 0;
  const referenceLuma = [];
  const candidateLuma = [];
  for (let y = 0; y < reference.height; y += 1) {
    for (let x = 0; x < reference.width; x += 1) {
      if (masked(x, y, masks)) continue;
      comparedPixels += 1;
      const offset = (y * reference.width + x) * 4;
      let maximumDelta = 0;
      for (let channel = 0; channel < 4; channel += 1) {
        maximumDelta = Math.max(maximumDelta, Math.abs(referenceImage.data[offset + channel] - candidateImage.data[offset + channel]));
      }
      if (maximumDelta >= ATMOSPHERIC_PERCEPTUAL_CHANNEL_DELTA) differingPixels += 1;
      if (maximumDelta >= 128) highContrastMismatchCount += 1;
      const referencePixelLuma = (
        referenceImage.data[offset] * 0.2126
        + referenceImage.data[offset + 1] * 0.7152
        + referenceImage.data[offset + 2] * 0.0722
      );
      const candidatePixelLuma = (
        candidateImage.data[offset] * 0.2126
        + candidateImage.data[offset + 1] * 0.7152
        + candidateImage.data[offset + 2] * 0.0722
      );
      referenceLuma.push(referencePixelLuma);
      candidateLuma.push(maximumDelta < ATMOSPHERIC_PERCEPTUAL_CHANNEL_DELTA ? referencePixelLuma : candidatePixelLuma);
    }
  }

  return {
    compatible: true,
    reference,
    candidate,
    comparedPixels,
    differingPixels,
    mismatchRatio: comparedPixels === 0 ? 0 : differingPixels / comparedPixels,
    highContrastMismatchCount,
    structuralSimilarity: structuralSimilarity(referenceLuma, candidateLuma)
  };
}
