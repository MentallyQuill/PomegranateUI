import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Page, TestInfo } from '@playwright/test';

import { compareMeasurements, MEASUREMENT_PROFILES, type ComparisonReport } from './compare.ts';
import { prepareAtmosphericState, measureAtmosphericShell } from './drivers/reference/atmospheric.ts';
import { prepareDeepCurrentState, measureLabShell } from './drivers/workbench-lab/deep-current.ts';
import {
  createDiagnosticImages,
  createEvidencePaths,
  writeComparisonReport,
  writeMeasurementEvidence,
  type EvidencePaths
} from './evidence.ts';
import { parseDiscrepancyLedger, type Discrepancy } from './ledger.ts';
import { ConformanceError, type ConformanceScenario, type ShellMeasurement, type ShellRegionId } from './types.ts';
import { CONFORMANCE_VIEWPORTS } from './viewports.ts';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputDirectory = path.join(repositoryRoot, 'test-results', 'conformance');
const ledgerPath = path.join(repositoryRoot, 'docs', 'conformance', 'deep-current-ledger.md');
const macroBaselinePath = path.join(repositoryRoot, 'tests', 'conformance', 'baselines', 'deep-current-macro.json');
const preservationOrigin = 'http://127.0.0.1:4173';
const labOrigin = 'http://127.0.0.1:4174';
const shellRegionIds: readonly ShellRegionId[] = Object.freeze(['shelf', 'left', 'stage', 'right', 'composer']);

interface CanonicalShellBaselineScenario {
  readonly viewport: readonly [number, number];
  readonly regions: Readonly<Record<ShellRegionId, readonly [number, number, number, number]>>;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function finitePair(value: unknown): value is readonly [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every((entry) => Number.isFinite(entry));
}

function finiteQuad(value: unknown): value is readonly [number, number, number, number] {
  return Array.isArray(value) && value.length === 4 && value.every((entry) => Number.isFinite(entry));
}

function parseCanonicalShellScenario(value: unknown, scenarioId: string): CanonicalShellBaselineScenario {
  if (!isRecord(value) || !finitePair(value.viewport) || !isRecord(value.regions)) {
    throw new ConformanceError('MANIFEST_INVALID', `Canonical shell baseline ${scenarioId} is malformed.`, { scenarioId });
  }
  const viewport = value.viewport;
  const rawRegions = value.regions;
  const regions = Object.fromEntries(shellRegionIds.map((regionId) => {
    const box = rawRegions[regionId];
    if (!finiteQuad(box)) {
      throw new ConformanceError(
        'MANIFEST_INVALID',
        `Canonical shell baseline ${scenarioId} is missing ${regionId} geometry.`,
        { scenarioId, regionId }
      );
    }
    return [regionId, Object.freeze([box[0], box[1], box[2], box[3]])] as const;
  })) as Record<ShellRegionId, readonly [number, number, number, number]>;
  return Object.freeze({
    viewport: Object.freeze([viewport[0], viewport[1]] as const),
    regions: Object.freeze(regions)
  });
}

async function loadCanonicalShellScenario(scenario: ConformanceScenario): Promise<CanonicalShellBaselineScenario> {
  const baseline: unknown = JSON.parse(await readFile(macroBaselinePath, 'utf8'));
  if (!isRecord(baseline)
    || baseline.schemaVersion !== 'pomegranate.ui.conformance-baseline.v1'
    || baseline.authoritySha256 !== scenario.authoritySha256
    || baseline.measurementProfile !== scenario.measurementProfile
    || !isRecord(baseline.scenarios)) {
    throw new ConformanceError(
      'MANIFEST_INVALID',
      `Canonical shell baseline metadata does not match scenario ${scenario.id}.`,
      { scenarioId: scenario.id }
    );
  }
  return parseCanonicalShellScenario(baseline.scenarios[scenario.id], scenario.id);
}

export function applyCanonicalShellGeometry(
  reference: ShellMeasurement,
  baseline: CanonicalShellBaselineScenario
): ShellMeasurement {
  if (reference.viewport.width !== baseline.viewport[0] || reference.viewport.height !== baseline.viewport[1]) {
    throw new ConformanceError('MANIFEST_INVALID', 'Canonical shell baseline viewport does not match live evidence.', {
      actualViewport: reference.viewport,
      expectedViewport: baseline.viewport
    });
  }
  const regions = Object.fromEntries(shellRegionIds.map((regionId) => {
    const [x, y, width, height] = baseline.regions[regionId];
    return [regionId, Object.freeze({
      ...reference.regions[regionId],
      box: Object.freeze({ x, y, width, height, right: x + width, bottom: y + height })
    })] as const;
  })) as Record<ShellRegionId, ShellMeasurement['regions'][ShellRegionId]>;
  return Object.freeze({ ...reference, regions: Object.freeze(regions) });
}

async function attachIfPresent(testInfo: TestInfo, name: string, artifactPath: string, contentType: string): Promise<void> {
  try {
    await stat(artifactPath);
    await testInfo.attach(name, { path: artifactPath, contentType });
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
}

async function attachEvidence(testInfo: TestInfo, paths: EvidencePaths): Promise<void> {
  await Promise.all([
    attachIfPresent(testInfo, 'reference', paths.referencePng, 'image/png'),
    attachIfPresent(testInfo, 'actual', paths.actualPng, 'image/png'),
    attachIfPresent(testInfo, 'overlay', paths.overlayPng, 'image/png'),
    attachIfPresent(testInfo, 'diff', paths.diffPng, 'image/png'),
    attachIfPresent(testInfo, 'measurements', paths.measurementsJson, 'application/json'),
    attachIfPresent(testInfo, 'report', paths.reportJson, 'application/json')
  ]);
}

export function assertScenarioResolution(
  scenarioId: string,
  comparisonPass: boolean,
  ledger: readonly Pick<Discrepancy, 'id' | 'scenario' | 'status'>[]
): void {
  const scenarioEntries = ledger.filter((entry) => entry.scenario === scenarioId);
  const discrepancyIds = scenarioEntries.map((entry) => entry.id);

  if (!comparisonPass) {
    if (discrepancyIds.length === 0) {
      throw new ConformanceError(
        'UNLEDGERED_DISCREPANCY',
        `Scenario ${scenarioId} has a structured mismatch without a ledger row.`,
        { scenarioId }
      );
    }
    throw new ConformanceError(
      'DISCREPANCY_REMAINS',
      `Scenario ${scenarioId} still differs from its preserved authority.`,
      { scenarioId, discrepancyIds }
    );
  }

  const unresolvedIds = scenarioEntries
    .filter((entry) => entry.status !== 'closed')
    .map((entry) => entry.id);
  if (unresolvedIds.length > 0) {
    throw new ConformanceError(
      'STALE_DISCREPANCY',
      `Scenario ${scenarioId} passes while its ledger rows remain unresolved.`,
      { scenarioId, discrepancyIds: unresolvedIds }
    );
  }
}

export async function runConformanceScenario(
  page: Page,
  testInfo: TestInfo,
  scenario: ConformanceScenario
): Promise<ComparisonReport> {
  const viewport = CONFORMANCE_VIEWPORTS.get(scenario.viewport);
  const profile = MEASUREMENT_PROFILES.get(scenario.measurementProfile);
  if (!viewport || !profile) {
    throw new ConformanceError(
      'MANIFEST_INVALID',
      `Scenario ${scenario.id} references an unavailable runtime profile.`,
      { scenarioId: scenario.id }
    );
  }

  const paths = createEvidencePaths(outputDirectory, scenario.id);
  await mkdir(paths.directory, { recursive: true });
  await page.setViewportSize(viewport);

  await prepareAtmosphericState(page, preservationOrigin);
  const reference = await measureAtmosphericShell(page);
  await page.screenshot({ path: paths.referencePng, animations: 'disabled', caret: 'hide' });

  await prepareDeepCurrentState(page, labOrigin);
  const implementation = await measureLabShell(page);
  await page.screenshot({ path: paths.actualPng, animations: 'disabled', caret: 'hide' });

  const canonicalExpected = scenario.measurementProfile === 'deep-current-shell'
    ? applyCanonicalShellGeometry(reference, await loadCanonicalShellScenario(scenario))
    : reference;
  await writeMeasurementEvidence(paths, { canonicalExpected, implementation, reference });
  const comparison = compareMeasurements(canonicalExpected, implementation, profile);
  const diagnosticImages = await createDiagnosticImages(paths.referencePng, paths.actualPng, paths);
  const ledger = parseDiscrepancyLedger(await readFile(ledgerPath, 'utf8'));
  const discrepancyIds = ledger.filter((entry) => entry.scenario === scenario.id).map((entry) => entry.id);
  await writeComparisonReport(paths, {
    comparison,
    diagnosticImages,
    discrepancyIds,
    scenarioId: scenario.id
  });
  await attachEvidence(testInfo, paths);

  assertScenarioResolution(scenario.id, comparison.pass, ledger);

  return comparison;
}
