import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test, type TestInfo } from '@playwright/test';

import { AUTHORITY_BY_ID } from '../authorities.ts';
import { compareMeasurements, MEASUREMENT_PROFILES } from '../compare.ts';
import { measureAtmosphericFidelity, prepareAtmosphericState } from '../drivers/reference/atmospheric.ts';
import { readRecordingFrame } from '../drivers/reference/recording-frame.ts';
import { prepareWidgetOverhaulHarness } from '../drivers/reference/widget-overhaul.ts';
import { measureLabFidelity, prepareDeepCurrentState } from '../drivers/workbench-lab/deep-current.ts';
import { createDiagnosticImages, createEvidencePaths, writeComparisonReport, writeMeasurementEvidence } from '../evidence.ts';
import { parseDiscrepancyLedger, validateDiscrepancyLedger } from '../ledger.ts';
import { DEEP_FIDELITY_SCENARIOS, hashAuthorityFile, validateConformanceManifest } from '../manifest.ts';
import { validateFidelityRegressionReview, type FidelityRegressionReview } from '../review.ts';
import { assertScenarioResolution } from '../runner.ts';
import { compareLiveAuthorityFidelity, compareRecordingFrameFidelity } from '../source-fidelity.ts';
import { ConformanceError, type FidelityMeasurement } from '../types.ts';
import { CONFORMANCE_VIEWPORTS } from '../viewports.ts';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const outputDirectory = path.join(repositoryRoot, 'test-results', 'conformance');
const baselinePath = path.join(repositoryRoot, 'tests', 'conformance', 'baselines', 'deep-fidelity.json');
const ledgerPath = path.join(repositoryRoot, 'docs', 'conformance', 'deep-fidelity-ledger.md');
const preservationOrigin = 'http://127.0.0.1:4173';
const labOrigin = 'http://127.0.0.1:4174';

type DeepFidelityBaseline = {
  readonly schemaVersion: string;
  readonly scenarios: Readonly<Record<string, {
    readonly expected: FidelityMeasurement;
    readonly review: FidelityRegressionReview;
  }>>;
};

async function loadBaseline(): Promise<DeepFidelityBaseline> {
  const value = JSON.parse(await readFile(baselinePath, 'utf8')) as DeepFidelityBaseline;
  if (
    value.schemaVersion !== 'pomegranate.ui.deep-fidelity.v1'
    || Object.keys(value.scenarios).join('|') !== DEEP_FIDELITY_SCENARIOS.map(({ id }) => id).join('|')
    || Object.values(value.scenarios).some(({ expected, review }) => !expected || !review)
  ) throw new ConformanceError('MANIFEST_INVALID', 'Deep fidelity normalized baseline metadata or scenario order drifted.');
  return value;
}

async function attachIfPresent(testInfo: TestInfo, name: string, file: string, contentType: string) {
  try {
    await stat(file);
    await testInfo.attach(name, { path: file, contentType });
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
}

test.describe('Deep Current exact fidelity', () => {
  let ledger: ReturnType<typeof parseDiscrepancyLedger>;
  let baseline: DeepFidelityBaseline;

  test.beforeAll(async () => {
    const driverIds = new Set(['workbench-lab', ...DEEP_FIDELITY_SCENARIOS.map(({ authority }) => authority)]);
    await validateConformanceManifest(DEEP_FIDELITY_SCENARIOS, {
      repositoryRoot,
      authorities: AUTHORITY_BY_ID,
      viewports: CONFORMANCE_VIEWPORTS,
      driverIds,
      measurementProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
      assertionProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
      deviationIds: new Set(),
      hashFile: hashAuthorityFile
    });
    ledger = parseDiscrepancyLedger(await readFile(ledgerPath, 'utf8'));
    validateDiscrepancyLedger(ledger, DEEP_FIDELITY_SCENARIOS);
    baseline = await loadBaseline();
  });

  for (const scenario of DEEP_FIDELITY_SCENARIOS) {
    test(`${scenario.id} ${scenario.title}`, async ({ page }, testInfo) => {
      const viewport = CONFORMANCE_VIEWPORTS.get(scenario.viewport);
      const profile = MEASUREMENT_PROFILES.get(scenario.measurementProfile);
      if (!viewport || !profile) throw new ConformanceError('MANIFEST_INVALID', `Missing runtime profile for ${scenario.id}.`);
      const reviewedBaseline = baseline.scenarios[scenario.id];
      if (!reviewedBaseline) throw new ConformanceError('MANIFEST_INVALID', `Deep fidelity baseline is missing ${scenario.id}.`, { scenarioId: scenario.id });
      const { expected, review } = reviewedBaseline;
      await page.setViewportSize(viewport);
      const paths = createEvidencePaths(outputDirectory, scenario.id);
      await mkdir(paths.directory, { recursive: true });

      let recordingLandmarks: unknown = null;
      if (scenario.authorityPath.endsWith('.png')) {
        const recording = await readRecordingFrame(repositoryRoot, scenario);
        recordingLandmarks = recording.landmarks;
        await copyFile(recording.absolutePath, paths.referencePng);
      } else if (scenario.authority === 'widget-overhaul') {
        const cases = await prepareWidgetOverhaulHarness(page, preservationOrigin);
        if (cases.size !== 212) throw new ConformanceError('REFERENCE_SETUP_FAILED', `Widget Overhaul reported ${cases.size}/212 cases.`);
      }

      await prepareAtmosphericState(page, preservationOrigin);
      const reference = await measureAtmosphericFidelity(page);
      if (!scenario.authorityPath.endsWith('.png')) {
        await page.screenshot({ path: paths.referencePng, animations: 'disabled', caret: 'hide' });
      }

      await prepareDeepCurrentState(page, labOrigin, scenario.implementationState);
      const root = page.locator('main[data-pom-theme="deep-current"]');
      const identity = await root.getAttribute('data-active-panel');
      const implementation = await measureLabFidelity(page, identity ?? undefined);
      await page.screenshot({ path: paths.actualPng, animations: 'disabled', caret: 'hide' });

      const ledgerEntries = ledger.filter((entry) => entry.scenario === scenario.id);
      if (ledgerEntries.length !== 1) throw new ConformanceError('MANIFEST_INVALID', `Deep fidelity scenario ${scenario.id} requires one critic ledger row.`);
      await writeMeasurementEvidence(paths, { canonicalExpected: expected, implementation, normalizationReview: review, recordingLandmarks, reference });
      validateFidelityRegressionReview({
        scenario,
        ledgerId: ledgerEntries[0]?.id ?? '',
        expected,
        reference,
        recordingLandmarks,
        review
      });
      const sourceAuthority = compareLiveAuthorityFidelity(reference, implementation);
      const recordingAuthority = scenario.authorityPath.endsWith('.png')
        ? compareRecordingFrameFidelity(await readFile(paths.referencePng), await readFile(paths.actualPng))
        : null;
      const regressionComparison = compareMeasurements(expected, implementation, profile);
      const comparison = Object.freeze({
        ...regressionComparison,
        pass: regressionComparison.pass && sourceAuthority.pass && (recordingAuthority?.pass ?? true)
      });
      const diagnosticImages = await createDiagnosticImages(paths.referencePng, paths.actualPng, paths);
      const discrepancyIds = ledger.filter((entry) => entry.scenario === scenario.id).map(({ id }) => id);
      await writeComparisonReport(paths, { comparison, diagnosticImages, discrepancyIds, recordingAuthority, regressionComparison, scenarioId: scenario.id, sourceAuthority });
      await Promise.all([
        attachIfPresent(testInfo, 'reference', paths.referencePng, 'image/png'),
        attachIfPresent(testInfo, 'actual', paths.actualPng, 'image/png'),
        attachIfPresent(testInfo, 'overlay', paths.overlayPng, 'image/png'),
        attachIfPresent(testInfo, 'diff', paths.diffPng, 'image/png'),
        attachIfPresent(testInfo, 'measurements', paths.measurementsJson, 'application/json'),
        attachIfPresent(testInfo, 'report', paths.reportJson, 'application/json')
      ]);
      assertScenarioResolution(scenario.id, comparison.pass, ledger);
    });
  }
});
