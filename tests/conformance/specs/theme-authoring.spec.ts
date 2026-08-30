import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from '@playwright/test';

import { AUTHORITY_BY_ID } from '../authorities.ts';
import { compareMeasurements, MEASUREMENT_PROFILES } from '../compare.ts';
import { renderThemeAuthoringScenario } from '../drivers/workbench-lab/theme-authoring.ts';
import { createEvidencePaths, writeComparisonReport, writeMeasurementEvidence } from '../evidence.ts';
import { parseDiscrepancyLedger, validateDiscrepancyLedger } from '../ledger.ts';
import { hashAuthorityFile, THEME_AUTHORING_SCENARIOS, validateConformanceManifest } from '../manifest.ts';
import { assertScenarioResolution } from '../runner.ts';
import { ConformanceError } from '../types.ts';
import { CONFORMANCE_VIEWPORTS } from '../viewports.ts';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const outputDirectory = path.join(repositoryRoot, 'test-results', 'conformance');
const labOrigin = 'http://127.0.0.1:4174';
const baselinePath = path.join(repositoryRoot, 'tests', 'conformance', 'baselines', 'theme-authoring.json');
const ledgerPath = path.join(repositoryRoot, 'docs', 'conformance', 'theme-authoring-ledger.md');

type Baseline = {
  readonly schemaVersion: string;
  readonly authority: string;
  readonly authoritySha256: string;
  readonly measurementProfile: string;
  readonly scenarios: Readonly<Record<string, unknown>>;
};

async function loadBaseline(): Promise<Baseline> {
  const value = JSON.parse(await readFile(baselinePath, 'utf8')) as Baseline;
  if (
    value.schemaVersion !== 'pomegranate.ui.conformance-baseline.v1'
    || value.authority !== 'approved-theme-authoring-spec'
    || value.authoritySha256 !== '6403a7bcfd8f43195fa42c5d9715cc79964c8b7569f47c22fdeefd1b89804997'
    || value.measurementProfile !== 'theme-authoring'
    || Object.keys(value.scenarios).join('|') !== THEME_AUTHORING_SCENARIOS.map(({ id }) => id).join('|')
  ) throw new ConformanceError('MANIFEST_INVALID', 'Theme authoring baseline metadata or scenario order drifted.');
  return value;
}

test.describe('Theme authoring conformance', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await validateConformanceManifest(THEME_AUTHORING_SCENARIOS, {
      repositoryRoot,
      authorities: AUTHORITY_BY_ID,
      viewports: CONFORMANCE_VIEWPORTS,
      driverIds: new Set(['ash-amber-recording-frame', 'workbench-lab']),
      measurementProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
      assertionProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
      deviationIds: new Set(),
      hashFile: hashAuthorityFile
    });
    await loadBaseline();
  });

  for (const scenario of THEME_AUTHORING_SCENARIOS) {
    test(`${scenario.id} ${scenario.title}`, async ({ browser }, testInfo) => {
      test.setTimeout(120_000);
      const viewport = CONFORMANCE_VIEWPORTS.get(scenario.viewport);
      const profile = MEASUREMENT_PROFILES.get(scenario.measurementProfile);
      if (!viewport || !profile) throw new ConformanceError('MANIFEST_INVALID', `Missing Theme authoring runtime profile for ${scenario.id}.`);
      const baseline = await loadBaseline();
      const expected = baseline.scenarios[scenario.id];
      if (!expected) throw new ConformanceError('MANIFEST_INVALID', `Theme authoring baseline is missing ${scenario.id}.`, { scenarioId: scenario.id });
      const ledger = parseDiscrepancyLedger(await readFile(ledgerPath, 'utf8'));
      validateDiscrepancyLedger(ledger, THEME_AUTHORING_SCENARIOS);
      const paths = createEvidencePaths(outputDirectory, scenario.id);
      await mkdir(paths.directory, { recursive: true });
      const context = await browser.newContext({ viewport });
      try {
        const page = await context.newPage();
        const implementation = await renderThemeAuthoringScenario(page, labOrigin, scenario);
        await page.screenshot({ path: paths.actualPng, animations: 'disabled', caret: 'hide' });
        await writeMeasurementEvidence(paths, { expected, implementation });
        const comparison = compareMeasurements(expected, implementation, profile);
        await writeComparisonReport(paths, {
          authorityCase: `approved Theme authoring ${scenario.referenceState}`,
          comparison,
          diagnosticImages: null,
          discrepancyIds: [],
          scenarioId: scenario.id,
          trace: implementation.trace
        });
        await Promise.all([
          testInfo.attach('actual', { path: paths.actualPng, contentType: 'image/png' }),
          testInfo.attach('measurements', { path: paths.measurementsJson, contentType: 'application/json' }),
          testInfo.attach('report', { path: paths.reportJson, contentType: 'application/json' })
        ]);
        assertScenarioResolution(scenario.id, comparison.pass, ledger);
      } finally {
        await context.close();
      }
    });
  }
});
