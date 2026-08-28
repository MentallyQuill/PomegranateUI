import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from '@playwright/test';

import { AUTHORITY_BY_ID } from '../authorities.ts';
import { MEASUREMENT_PROFILES } from '../compare.ts';
import { parseDiscrepancyLedger, validateDiscrepancyLedger } from '../ledger.ts';
import { DEEP_CURRENT_MACRO_SCENARIOS, hashAuthorityFile, validateConformanceManifest } from '../manifest.ts';
import { runConformanceScenario } from '../runner.ts';
import { ConformanceError } from '../types.ts';
import { CONFORMANCE_VIEWPORTS } from '../viewports.ts';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

test.describe('Deep Current macro conformance', () => {
  test.beforeAll(async () => {
    await validateConformanceManifest(DEEP_CURRENT_MACRO_SCENARIOS, {
      repositoryRoot,
      authorities: AUTHORITY_BY_ID,
      viewports: CONFORMANCE_VIEWPORTS,
      driverIds: new Set(['atmospheric-workbench', 'workbench-lab']),
      measurementProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
      assertionProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
      deviationIds: new Set(),
      hashFile: hashAuthorityFile
    });

    const preview = AUTHORITY_BY_ID.get('atmospheric-workbench-preview');
    if (!preview) throw new ConformanceError('MANIFEST_INVALID', 'The Atmospheric preview authority is not registered.');
    const previewHash = await hashAuthorityFile(path.join(repositoryRoot, preview.path));
    if (previewHash !== preview.sha256) {
      throw new ConformanceError('REFERENCE_HASH_DRIFT', 'The Atmospheric preview authority hash drifted.', {
        actualSha256: previewHash,
        expectedSha256: preview.sha256
      });
    }

    const ledger = parseDiscrepancyLedger(
      await readFile(path.join(repositoryRoot, 'docs', 'conformance', 'deep-current-ledger.md'), 'utf8')
    );
    validateDiscrepancyLedger(ledger, DEEP_CURRENT_MACRO_SCENARIOS);
  });

  for (const scenario of DEEP_CURRENT_MACRO_SCENARIOS) {
    test(scenario.title, async ({ page }, testInfo) => {
      await runConformanceScenario(page, testInfo, scenario);
    });
  }
});
