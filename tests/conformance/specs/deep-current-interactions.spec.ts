import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test, type Page } from '@playwright/test';

import { AUTHORITY_BY_ID } from '../authorities.ts';
import { compareMeasurements, MEASUREMENT_PROFILES } from '../compare.ts';
import { exerciseLabInteraction } from '../drivers/workbench-lab/interactions.ts';
import { prepareWidgetOverhaulHarness, requireWidgetOverhaulCase, WIDGET_OVERHAUL_HOOK_TIMEOUT_MS } from '../drivers/reference/widget-overhaul.ts';
import { createDiagnosticImages, createEvidencePaths, writeComparisonReport, writeMeasurementEvidence } from '../evidence.ts';
import { parseDiscrepancyLedger, validateDiscrepancyLedger } from '../ledger.ts';
import { DEEP_CURRENT_INTERACTION_SCENARIOS, hashAuthorityFile, validateConformanceManifest } from '../manifest.ts';
import { assertScenarioResolution } from '../runner.ts';
import { ConformanceError } from '../types.ts';
import { CONFORMANCE_VIEWPORTS } from '../viewports.ts';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const outputDirectory = path.join(repositoryRoot, 'test-results', 'conformance');
const ledgerPath = path.join(repositoryRoot, 'docs', 'conformance', 'deep-current-interactions-ledger.md');
const preservationOrigin = 'http://127.0.0.1:4173';
const labOrigin = 'http://127.0.0.1:4174';

const referenceMeasurement = Object.freeze({
  functional: Object.freeze({
    authorityCasePassed: true,
    outcomeReached: true,
    identityStable: true,
    persistenceVerified: true,
    keyboardAccessible: true
  })
});

test.describe('Deep Current interaction conformance', () => {
  test.describe.configure({ mode: 'serial' });
  let referencePage: Page;
  let referenceCases: ReadonlySet<string>;
  let ledger: ReturnType<typeof parseDiscrepancyLedger>;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(WIDGET_OVERHAUL_HOOK_TIMEOUT_MS);
    await validateConformanceManifest(DEEP_CURRENT_INTERACTION_SCENARIOS, {
      repositoryRoot,
      authorities: AUTHORITY_BY_ID,
      viewports: CONFORMANCE_VIEWPORTS,
      driverIds: new Set(['widget-overhaul', 'workbench-lab']),
      measurementProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
      assertionProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
      deviationIds: new Set(),
      hashFile: hashAuthorityFile
    });
    ledger = parseDiscrepancyLedger(await readFile(ledgerPath, 'utf8'));
    validateDiscrepancyLedger(ledger, DEEP_CURRENT_INTERACTION_SCENARIOS);
    const standardViewport = CONFORMANCE_VIEWPORTS.get('standard');
    if (!standardViewport) throw new ConformanceError('MANIFEST_INVALID', 'The standard interaction viewport is missing.');
    referencePage = await browser.newPage({ viewport: standardViewport });
    referenceCases = await prepareWidgetOverhaulHarness(referencePage, preservationOrigin);
  });

  test.afterAll(async () => {
    await referencePage?.close();
  });

  for (const scenario of DEEP_CURRENT_INTERACTION_SCENARIOS) {
    test(`${scenario.id} ${scenario.title}`, async ({ browser }, testInfo) => {
      const viewport = CONFORMANCE_VIEWPORTS.get(scenario.viewport);
      const profile = MEASUREMENT_PROFILES.get(scenario.measurementProfile);
      if (!viewport || !profile) throw new ConformanceError('MANIFEST_INVALID', `Missing runtime profile for ${scenario.id}.`);
      const paths = createEvidencePaths(outputDirectory, scenario.id);
      await mkdir(paths.directory, { recursive: true });

      const authorityCase = requireWidgetOverhaulCase(referenceCases, scenario.id);
      await referencePage.setViewportSize(viewport);
      const referenceRow = referencePage.locator('#results > p.pass').filter({ hasText: authorityCase }).first();
      await referenceRow.scrollIntoViewIfNeeded();
      await referencePage.screenshot({ path: paths.referencePng, animations: 'disabled', caret: 'hide' });

      const coarsePointer = scenario.inputModes.includes('coarse-pointer');
      const context = await browser.newContext({
        viewport,
        hasTouch: coarsePointer,
        isMobile: coarsePointer
      });
      try {
        const page = await context.newPage();
        const implementation = await exerciseLabInteraction(page, labOrigin, scenario);
        await page.screenshot({ path: paths.actualPng, animations: 'disabled', caret: 'hide' });
        await writeMeasurementEvidence(paths, { implementation, reference: referenceMeasurement });
        const comparison = compareMeasurements(referenceMeasurement, implementation, profile);
        const diagnosticImages = await createDiagnosticImages(paths.referencePng, paths.actualPng, paths);
        const discrepancyIds = ledger.filter((entry) => entry.scenario === scenario.id).map((entry) => entry.id);
        await writeComparisonReport(paths, {
          authorityCase,
          comparison,
          diagnosticImages,
          discrepancyIds,
          scenarioId: scenario.id,
          trace: implementation.trace
        });
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
        await context.close();
      }
    });
  }
});
