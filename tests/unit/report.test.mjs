import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildReports, checkGeneratedReports } from '../../scripts/generate-migration-report.mjs';

const input = {
  manifest: {
    artifacts: [
      { sourcePath: 'a', destinationPath: 'x', classification: 'toolkit-generic', status: 'preserved-verbatim' },
      { sourcePath: 'b', destinationPath: 'y', classification: 'asset-or-license', status: 'preserved-verbatim' }
    ],
    unaccounted: []
  },
  contractIndex: { contracts: [
    { contractId: 'POM-WIDGET-AAAAAAAAAA', sourcePath: 'a', sourceEvidence: 'Transcript', evidenceKind: 'widget-ledger', destinationOwner: '@pomegranate-ui/widget', destinationEvidence: ['x'], classification: 'toolkit-generic', status: 'preserved-verbatim' },
    { contractId: 'POM-INTEGRATION-SONDER-BBBBBBBBBB', sourcePath: 'b', sourceEvidence: 'Route', evidenceKind: 'harness', destinationOwner: 'Sonder consumer suite', destinationEvidence: ['y'], classification: 'sonder-integration', status: 'sonder-owned' }
  ] },
  testDispositions: { entries: [{ sourcePath: 'tests/a.py', disposition: 'sonder-backend-authority' }] },
  sourceCommits: '- Atmospheric Workbench: `79/79 passed`.\n- Widget overhaul: `212/212 passed`.\n'
};

test('reports all accountability totals from inputs and is byte-deterministic', () => {
  const first = buildReports(input);
  const second = buildReports(structuredClone(input));
  assert.deepEqual(first, second);
  for (const expected of [
    'Total baseline contracts: 2', 'Preserved artifacts: 2',
    'Assigned Widget/renderer surfaces: 1', 'Dual-green contracts: 0',
    'Sonder-owned contracts: 1', 'Awaiting native port: 1',
    'Unaccounted: 0', 'Atmospheric Workbench: 79/79 passed',
    'Widget overhaul: 212/212 passed', 'POM-WIDGET',
    'toolkit-generic', 'preserved-verbatim', '@pomegranate-ui/widget'
  ]) assert.match(first.report, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(first.ledger, /POM-WIDGET-AAAAAAAAAA/);
});

test('--check equivalent detects stale committed Markdown', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'pomegranate-report-'));
  await mkdir(path.join(root, 'provenance'));
  const reports = buildReports(input);
  await writeFile(path.join(root, 'provenance', 'extraction-ledger.md'), reports.ledger);
  await writeFile(path.join(root, 'provenance', 'migration-report.md'), 'stale');
  assert.deepEqual(await checkGeneratedReports({ root, reports }), ['provenance/migration-report.md is stale']);
  await rm(root, { recursive: true, force: true });
});
