import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test, type Page } from '@playwright/test';

import { AUTHORITY_BY_ID } from '../authorities.ts';
import { compareMeasurements, MEASUREMENT_PROFILES } from '../compare.ts';
import { prepareWidgetOverhaulHarness, WIDGET_OVERHAUL_HOOK_TIMEOUT_MS } from '../drivers/reference/widget-overhaul.ts';
import { renderWidgetOverhaulCatalog, requireCatalogHarnessCase } from '../drivers/reference/widget-overhaul-catalog.ts';
import { renderLabCatalog } from '../drivers/workbench-lab/catalog.ts';
import { createDiagnosticImages, createEvidencePaths, writeComparisonReport, writeMeasurementEvidence } from '../evidence.ts';
import { parseDiscrepancyLedger, validateDiscrepancyLedger } from '../ledger.ts';
import { DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS, hashAuthorityFile, validateConformanceManifest } from '../manifest.ts';
import { assertScenarioResolution } from '../runner.ts';
import { ConformanceError } from '../types.ts';
import { CONFORMANCE_VIEWPORTS } from '../viewports.ts';
import { DEEP_CURRENT_CATALOG_SCENARIOS } from '../widget-manifest.ts';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const outputDirectory = path.join(repositoryRoot, 'test-results', 'conformance');
const ledgerPath = path.join(repositoryRoot, 'docs', 'conformance', 'deep-current-widgets-ledger.md');
const preservationOrigin = 'http://127.0.0.1:4173';
const labOrigin = 'http://127.0.0.1:4174';

test.describe('Deep Current Catalog conformance', () => {
  test.describe.configure({ mode: 'serial' });
  let referencePage: Page;
  let harnessPage: Page;
  let labPage: Page;
  let referenceCases: ReadonlySet<string>;
  let ledger: ReturnType<typeof parseDiscrepancyLedger>;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(WIDGET_OVERHAUL_HOOK_TIMEOUT_MS);
    await validateConformanceManifest(DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS, {
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
    validateDiscrepancyLedger(ledger, DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS);
    const viewport = CONFORMANCE_VIEWPORTS.get('standard');
    if (!viewport) throw new ConformanceError('MANIFEST_INVALID', 'The standard Catalog viewport is missing.');
    referencePage = await browser.newPage({ viewport });
    harnessPage = await browser.newPage({ viewport });
    labPage = await browser.newPage({ viewport });
    referenceCases = await prepareWidgetOverhaulHarness(harnessPage, preservationOrigin);
  });

  test.afterAll(async () => {
    await Promise.all([referencePage?.close(), harnessPage?.close(), labPage?.close()]);
  });

  for (const scenario of DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS) {
    test(`${scenario.id} ${scenario.title}`, async ({}, testInfo) => {
      const catalogCase = DEEP_CURRENT_CATALOG_SCENARIOS.find(({ scenarioId }) => scenarioId === scenario.id);
      const profile = MEASUREMENT_PROFILES.get(scenario.measurementProfile);
      if (!catalogCase || !profile) throw new ConformanceError('MANIFEST_INVALID', `Missing Catalog runtime profile for ${scenario.id}.`);
      const paths = createEvidencePaths(outputDirectory, scenario.id);
      await mkdir(paths.directory, { recursive: true });

      const authorityCase = requireCatalogHarnessCase(referenceCases, catalogCase);
      const reference = await renderWidgetOverhaulCatalog(referencePage, preservationOrigin, catalogCase);
      await referencePage.screenshot({ path: paths.referencePng, animations: 'disabled', caret: 'hide' });
      const implementation = await renderLabCatalog(labPage, labOrigin, catalogCase);
      await labPage.screenshot({ path: paths.actualPng, animations: 'disabled', caret: 'hide' });
      await writeMeasurementEvidence(paths, { implementation, reference });
      const comparison = compareMeasurements(reference, implementation, profile);
      const diagnosticImages = await createDiagnosticImages(paths.referencePng, paths.actualPng, paths);
      const discrepancyIds = ledger.filter((entry) => entry.scenario === scenario.id).map((entry) => entry.id);
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
    });
  }
});
