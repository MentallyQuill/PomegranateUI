import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from '@playwright/test';

import { AUTHORITY_BY_ID } from '../authorities.ts';
import { compareMeasurements, MEASUREMENT_PROFILES } from '../compare.ts';
import { renderOriginalThemeReference } from '../drivers/reference/theme-target.ts';
import { renderLabThemeTarget } from '../drivers/workbench-lab/theme-target.ts';
import { createDiagnosticImages, createEvidencePaths, writeComparisonReport, writeMeasurementEvidence } from '../evidence.ts';
import { parseDiscrepancyLedger, validateDiscrepancyLedger } from '../ledger.ts';
import { hashAuthorityFile, ORIGINAL_THEME_TARGET_SCENARIOS, validateConformanceManifest } from '../manifest.ts';
import { assertScenarioResolution } from '../runner.ts';
import { ConformanceError } from '../types.ts';
import { CONFORMANCE_VIEWPORTS } from '../viewports.ts';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const outputDirectory = path.join(repositoryRoot, 'test-results', 'conformance');
const preservationOrigin = 'http://127.0.0.1:4173';
const labOrigin = 'http://127.0.0.1:4174';

test.describe('Visual target conformance', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await validateConformanceManifest(ORIGINAL_THEME_TARGET_SCENARIOS, {
      repositoryRoot,
      authorities: AUTHORITY_BY_ID,
      viewports: CONFORMANCE_VIEWPORTS,
      driverIds: new Set(['pomos-reference', 'bunny-original-reference', 'workbench-lab']),
      measurementProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
      assertionProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
      deviationIds: new Set(),
      hashFile: hashAuthorityFile
    });
  });

  for (const scenario of ORIGINAL_THEME_TARGET_SCENARIOS) {
    test(`${scenario.id} ${scenario.title}`, async ({ browser }, testInfo) => {
      const viewport = CONFORMANCE_VIEWPORTS.get(scenario.viewport);
      const profile = MEASUREMENT_PROFILES.get(scenario.measurementProfile);
      if (!viewport || !profile) throw new ConformanceError('MANIFEST_INVALID', `Missing original target runtime profile for ${scenario.id}.`);
      const ledgerPath = path.join(repositoryRoot, 'docs', 'conformance', scenario.target === 'pom-neutral' ? 'pom-neutral-ledger.md' : 'bunny-ledger.md');
      const ledger = parseDiscrepancyLedger(await readFile(ledgerPath, 'utf8'));
      const targetScenarios = ORIGINAL_THEME_TARGET_SCENARIOS.filter(({ target }) => target === scenario.target);
      validateDiscrepancyLedger(ledger, targetScenarios);
      const paths = createEvidencePaths(outputDirectory, scenario.id);
      await mkdir(paths.directory, { recursive: true });
      const contextOptions = { viewport, hasTouch: scenario.viewport === 'compact-small', isMobile: scenario.viewport === 'compact-small' };
      const referenceContext = await browser.newContext(contextOptions);
      const labContext = await browser.newContext(contextOptions);
      try {
        const referencePage = await referenceContext.newPage();
        const labPage = await labContext.newPage();
        const reference = await renderOriginalThemeReference(referencePage, preservationOrigin, scenario);
        await referencePage.screenshot({ path: paths.referencePng, animations: 'disabled', caret: 'hide' });
        const implementation = await renderLabThemeTarget(labPage, labOrigin, scenario);
        await labPage.screenshot({ path: paths.actualPng, animations: 'disabled', caret: 'hide' });
        await writeMeasurementEvidence(paths, { implementation, reference });
        const comparison = compareMeasurements(reference, implementation, profile);
        const diagnosticImages = await createDiagnosticImages(paths.referencePng, paths.actualPng, paths);
        const discrepancyIds = ledger.filter((entry) => entry.scenario === scenario.id).map((entry) => entry.id);
        const authorityCase = `${scenario.target} ${scenario.referenceState} reference`;
        await writeComparisonReport(paths, { authorityCase, comparison, diagnosticImages, discrepancyIds, scenarioId: scenario.id, trace: implementation.trace });
        await Promise.all([
          testInfo.attach('reference', { path: paths.referencePng, contentType: 'image/png' }),
          testInfo.attach('actual', { path: paths.actualPng, contentType: 'image/png' }),
          testInfo.attach('overlay', { path: paths.overlayPng, contentType: 'image/png' }),
          testInfo.attach('diff', { path: paths.diffPng, contentType: 'image/png' }),
          testInfo.attach('measurements', { path: paths.measurementsJson, contentType: 'application/json' }),
          testInfo.attach('report', { path: paths.reportJson, contentType: 'application/json' })
        ]);
        assertScenarioResolution(scenario.id, comparison.pass, ledger);
      } finally {
        await Promise.all([referenceContext.close(), labContext.close()]);
      }
    });
  }
});
