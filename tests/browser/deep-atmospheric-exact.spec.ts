import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

import {
  compareAtmosphericPixels,
  validateAtmosphericContract
} from '../exact/atmospheric-exact-contract.mjs';

test.skip(process.platform !== 'win32', 'Exact Atmospheric pixels are captured and reviewed on Windows Chromium.');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const contractPath = path.join(root, 'tests', 'reference', 'atmospheric-exact', 'contract.json');
const contract = JSON.parse(await readFile(contractPath, 'utf8'));
const authorityPath = path.join(root, contract.referenceImage);
const authorityBytes = await readFile(authorityPath);

type Rectangle = { x: number; y: number; width: number; height: number };

function diagnosticImages(referenceBytes: Buffer, candidateBytes: Buffer) {
  const reference = PNG.sync.read(referenceBytes);
  const candidate = PNG.sync.read(candidateBytes);
  const overlay = new PNG({ width: reference.width, height: reference.height });
  const diff = new PNG({ width: reference.width, height: reference.height });
  for (let offset = 0; offset < reference.data.length; offset += 4) {
    const delta = Math.max(
      Math.abs(reference.data[offset]! - candidate.data[offset]!),
      Math.abs(reference.data[offset + 1]! - candidate.data[offset + 1]!),
      Math.abs(reference.data[offset + 2]! - candidate.data[offset + 2]!)
    );
    for (let channel = 0; channel < 3; channel += 1) {
      overlay.data[offset + channel] = Math.round((reference.data[offset + channel]! + candidate.data[offset + channel]!) / 2);
    }
    overlay.data[offset + 3] = 255;
    diff.data[offset] = delta;
    diff.data[offset + 1] = delta >= 128 ? 0 : delta;
    diff.data[offset + 2] = delta >= 128 ? 0 : delta;
    diff.data[offset + 3] = 255;
  }
  return { overlay: PNG.sync.write(overlay), diff: PNG.sync.write(diff) };
}

function geometryDelta(reference: Record<string, Rectangle>, candidate: Record<string, Rectangle | null>) {
  const findings: string[] = [];
  let maxDeltaPx = 0;
  for (const [id, expected] of Object.entries(reference)) {
    const actual = candidate[id];
    if (!actual) {
      findings.push(`Missing geometry landmark: ${id}`);
      maxDeltaPx = Number.POSITIVE_INFINITY;
      continue;
    }
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      const delta = Math.abs(expected[key] - actual[key]);
      maxDeltaPx = Math.max(maxDeltaPx, delta);
      if (delta > contract.thresholds.maxGeometryDeltaPx) {
        findings.push(`${id}.${key} differs by ${delta.toFixed(3)}px`);
      }
    }
  }
  return { maxDeltaPx, findings };
}

test('Deep Current is indistinguishable from the Atmospheric authority', async ({ page }, testInfo) => {
  validateAtmosphericContract(contract, { referenceImageBytes: authorityBytes });
  await page.setViewportSize(contract.viewport);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/', { waitUntil: 'networkidle' });
  const workbench = page.locator('main[data-pom-theme="deep-current"]');
  await expect(workbench).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  const candidateGeometry = await page.evaluate(() => {
    const measure = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    return {
      header: measure('[data-conformance-region="shelf"]'),
      left: measure('[data-conformance-region="left"]'),
      stage: measure('[data-conformance-region="stage"]'),
      right: measure('[data-conformance-region="right"]'),
      story: measure('[data-widget-type="story.transcript"][data-pomegranate-placement]'),
      composer: measure('[data-widget-type="story.composer"][data-pomegranate-placement]')
    };
  });
  const geometry = geometryDelta(contract.geometry, candidateGeometry);

  const candidateBytes = await workbench.screenshot({ animations: 'disabled', caret: 'hide' });
  const pixels = compareAtmosphericPixels(authorityBytes, candidateBytes, contract.masks);
  const roundDirectory = testInfo.outputPath('deep-atmospheric-round');
  await mkdir(roundDirectory, { recursive: true });
  await writeFile(path.join(roundDirectory, 'authority.png'), authorityBytes);
  await writeFile(path.join(roundDirectory, 'candidate.png'), candidateBytes);
  if (pixels.compatible) {
    const images = diagnosticImages(authorityBytes, candidateBytes);
    await writeFile(path.join(roundDirectory, 'overlay.png'), images.overlay);
    await writeFile(path.join(roundDirectory, 'diff.png'), images.diff);
  }

  const characters = page.locator('[data-widget-type="story.characters"]');
  await characters.hover();
  const placementRailCount = await characters.getByRole('navigation', { name: /placement/i }).count();
  const actionMenuCount = await characters.getByRole('button', { name: 'Widget actions' }).count();
  const inventory = await page.locator('[data-widget-type][data-pomegranate-placement]').evaluateAll((elements) => (
    [...new Set(elements.map((element) => element.getAttribute('data-widget-type')).filter(Boolean))]
  ));
  const portraitStatus = await page.locator('[data-character-portrait] img').evaluateAll((images) => ({
    count: images.length,
    loaded: images.length === 4 && images.every((image) => (image as HTMLImageElement).naturalWidth > 0)
  }));
  const stageImageCount = await page.locator('[data-pom-canvas-layer="image"]').count();

  const findings = [...geometry.findings];
  for (const required of contract.requiredInventory) {
    if (!inventory.includes(required)) findings.push(`Missing default Widget: ${required}`);
  }
  if (stageImageCount !== 1) findings.push(`Expected one stage image layer, found ${stageImageCount}`);
  if (!portraitStatus.loaded) findings.push(`Expected four loaded character portraits, found ${portraitStatus.count}`);
  if (placementRailCount !== 0) findings.push(`Hover exposed ${placementRailCount} placement rail`);
  if (actionMenuCount !== 1) findings.push(`Expected one restrained Widget actions trigger, found ${actionMenuCount}`);
  if (!pixels.compatible) findings.push('Candidate screenshot dimensions differ from the authority');
  else {
    if (pixels.mismatchRatio > contract.thresholds.maxMismatchRatio) findings.push(`Pixel mismatch ratio is ${pixels.mismatchRatio}`);
    if (pixels.structuralSimilarity < contract.thresholds.minimumStructuralSimilarity) findings.push(`Structural similarity is ${pixels.structuralSimilarity}`);
    if (pixels.highContrastMismatchCount > contract.thresholds.maximumHighContrastMismatchCount) findings.push(`High-contrast mismatch count is ${pixels.highContrastMismatchCount}`);
  }

  const report = {
    schemaVersion: 'pomegranate.ui.atmospheric-exact-report.v1',
    authoritySourceSha256: contract.authoritySourceSha256,
    authorityImageSha256: createHash('sha256').update(authorityBytes).digest('hex'),
    candidateImageSha256: createHash('sha256').update(candidateBytes).digest('hex'),
    viewport: contract.viewport,
    geometry,
    pixels,
    assets: { stageImageCount, portraitStatus },
    interactionChrome: { placementRailCount, actionMenuCount },
    inventory,
    findings,
    pass: findings.length === 0
  };
  const reportPath = path.join(roundDirectory, 'report.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  for (const [name, file] of [
    ['authority', 'authority.png'],
    ['candidate', 'candidate.png'],
    ['overlay', 'overlay.png'],
    ['diff', 'diff.png'],
    ['report', 'report.json']
  ] as const) await testInfo.attach(name, { path: path.join(roundDirectory, file) });

  expect(findings, JSON.stringify(report, null, 2)).toEqual([]);
});
