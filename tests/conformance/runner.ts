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
import { ConformanceError, type ConformanceScenario } from './types.ts';
import { CONFORMANCE_VIEWPORTS } from './viewports.ts';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputDirectory = path.join(repositoryRoot, 'test-results', 'conformance');
const ledgerPath = path.join(repositoryRoot, 'docs', 'conformance', 'deep-current-ledger.md');
const preservationOrigin = 'http://127.0.0.1:4173';
const labOrigin = 'http://127.0.0.1:4174';

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

  await writeMeasurementEvidence(paths, { implementation, reference });
  const comparison = compareMeasurements(reference, implementation, profile);
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
