import assert from 'node:assert/strict';
import test from 'node:test';

import { PNG } from 'pngjs';

import {
  compareAtmosphericPixels,
  validateAtmosphericContract
} from '../exact/atmospheric-exact-contract.mjs';

const SOURCE_FRAGMENT_SHA256 = '38878d2cf8a86f5e879faba4b41a214e4293f22ed755975023e02c962d61b913';

function png(width, height, pixels) {
  const image = new PNG({ width, height });
  for (let index = 0; index < pixels.length; index += 1) {
    const [red, green, blue, alpha = 255] = pixels[index];
    const offset = index * 4;
    image.data[offset] = red;
    image.data[offset + 1] = green;
    image.data[offset + 2] = blue;
    image.data[offset + 3] = alpha;
  }
  return PNG.sync.write(image);
}

function contract(overrides = {}) {
  return {
    schemaVersion: 'pomegranate.ui.atmospheric-exact.v1',
    source: 'atmospheric-workbench',
    authoritySourceSha256: SOURCE_FRAGMENT_SHA256,
    referenceImageSha256: 'a'.repeat(64),
    viewport: { width: 1920, height: 1280, deviceScaleFactor: 1 },
    geometry: {
      header: { x: 0, y: 0, width: 1920, height: 40 },
      left: { x: 0, y: 40, width: 286, height: 1240 },
      stage: { x: 286, y: 40, width: 1348, height: 1240 },
      right: { x: 1634, y: 40, width: 286, height: 1240 },
      story: { x: 620, y: 1038.109375, width: 680, height: 139.890625 },
      composer: { x: 620, y: 1206, width: 680, height: 56 }
    },
    masks: [],
    textMaskBounds: [],
    ...overrides
  };
}

test('Atmospheric exact contract rejects candidate-owned authority and source drift', () => {
  assert.doesNotThrow(() => validateAtmosphericContract(contract(), { skipReferenceImageHash: true }));
  assert.throws(
    () => validateAtmosphericContract(contract({ source: 'workbench-lab' }), { skipReferenceImageHash: true }),
    /authority/i
  );
  assert.throws(
    () => validateAtmosphericContract(contract({ authoritySourceSha256: '0'.repeat(64) }), { skipReferenceImageHash: true }),
    /source fragment hash/i
  );
  assert.throws(
    () => validateAtmosphericContract(contract({ viewport: { width: 1600, height: 900, deviceScaleFactor: 1 } }), { skipReferenceImageHash: true }),
    /1920 by 1280/i
  );
});

test('Atmospheric exact contract requires every source-derived shell landmark', () => {
  assert.throws(
    () => validateAtmosphericContract(contract({ geometry: {} }), { skipReferenceImageHash: true }),
    /geometry.*header/i
  );
  assert.throws(
    () => validateAtmosphericContract(contract({
      geometry: { ...contract().geometry, composer: { x: 620, y: 1206, width: 681, height: 56 } }
    }), { skipReferenceImageHash: true }),
    /geometry.*composer/i
  );
});

test('Atmospheric exact contract permits only reviewed glyph masks contained by text bounds', () => {
  const textMaskBounds = [{ id: 'wordmark', x: 24, y: 8, width: 120, height: 20 }];
  assert.doesNotThrow(() => validateAtmosphericContract(contract({
    textMaskBounds,
    masks: [{ id: 'wordmark-copy', textBoundId: 'wordmark', x: 24, y: 8, width: 100, height: 18, kind: 'glyph-only' }]
  }), { skipReferenceImageHash: true }));
  assert.throws(() => validateAtmosphericContract(contract({
    textMaskBounds,
    masks: [{ id: 'background-cover', textBoundId: 'wordmark', x: 20, y: 4, width: 150, height: 30, kind: 'glyph-only' }]
  }), { skipReferenceImageHash: true }), /outside reviewed text pixels/i);
  assert.throws(() => validateAtmosphericContract(contract({
    textMaskBounds,
    masks: [{ id: 'material-cover', textBoundId: 'wordmark', x: 24, y: 8, width: 100, height: 18, kind: 'region' }]
  }), { skipReferenceImageHash: true }), /glyph-only/i);
});

test('Atmospheric pixel comparison reports literal mismatch and honors only valid masks', () => {
  const reference = png(2, 1, [[0, 0, 0], [255, 255, 255]]);
  const candidate = png(2, 1, [[0, 0, 0], [0, 0, 0]]);

  const mismatch = compareAtmosphericPixels(reference, candidate, []);
  assert.equal(mismatch.compatible, true);
  assert.equal(mismatch.differingPixels, 1);
  assert.equal(mismatch.comparedPixels, 2);
  assert.equal(mismatch.mismatchRatio, 0.5);
  assert.equal(mismatch.highContrastMismatchCount, 1);
  assert.ok(mismatch.structuralSimilarity < 0.01);

  const masked = compareAtmosphericPixels(reference, candidate, [
    { id: 'copy', textBoundId: 'copy', x: 1, y: 0, width: 1, height: 1, kind: 'glyph-only' }
  ]);
  assert.equal(masked.differingPixels, 0);
  assert.equal(masked.comparedPixels, 1);
  assert.equal(masked.mismatchRatio, 0);
  assert.equal(masked.highContrastMismatchCount, 0);
  assert.equal(masked.structuralSimilarity, 1);
});

test('Atmospheric pixel comparison ignores sub-perceptual browser raster drift', () => {
  const reference = png(2, 1, [[12, 18, 19], [80, 90, 100]]);
  const candidate = png(2, 1, [[13, 19, 18], [100, 104, 118]]);

  const report = compareAtmosphericPixels(reference, candidate, []);

  assert.equal(report.differingPixels, 0);
  assert.equal(report.mismatchRatio, 0);
  assert.equal(report.highContrastMismatchCount, 0);
  assert.equal(report.structuralSimilarity, 1);
});

test('Atmospheric pixel comparison fails closed on dimension drift', () => {
  const reference = png(2, 1, [[0, 0, 0], [255, 255, 255]]);
  const candidate = png(1, 1, [[0, 0, 0]]);
  const report = compareAtmosphericPixels(reference, candidate, []);
  assert.deepEqual(report, {
    compatible: false,
    reference: { width: 2, height: 1 },
    candidate: { width: 1, height: 1 }
  });
});
