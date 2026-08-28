import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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
  sourceCommits: '- Atmospheric Workbench: `79/79 passed`.\n- Widget overhaul: `212/212 passed`.\n',
  runtimeHarnessCases: { harnesses: [
    { name: 'Atmospheric Workbench', reportedResult: '95/95 passed', cases: Array.from({ length: 95 }, (_, index) => `A${index}`) },
    { name: 'Widget overhaul', reportedResult: '212/212 passed', cases: Array.from({ length: 212 }, (_, index) => `W${index}`) }
  ] }
};

test('reports all accountability totals from inputs and is byte-deterministic', () => {
  const first = buildReports(input);
  const second = buildReports(structuredClone(input));
  assert.deepEqual(first, second);
  for (const expected of [
    'Total baseline contracts: 2', 'Preserved artifacts: 2',
    'Assigned Widget/renderer surfaces: 1', 'Dual-green contracts: 0',
    'Sonder-owned contracts: 1', 'Awaiting native port: 1',
    'Unaccounted: 0', 'Atmospheric Workbench: 95/95 passed',
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

test('production report carries the exact first-slice migration totals and is current', async () => {
  const root = path.resolve(import.meta.dirname, '..', '..');
  const json = async (name) => JSON.parse(await readFile(path.join(root, 'provenance', name), 'utf8'));
  const production = {
    manifest: await json('extraction-manifest.json'),
    contractIndex: await json('contract-index.json'),
    testDispositions: await json('sonder-test-dispositions.json'),
    sourceCommits: await readFile(path.join(root, 'provenance', 'source-commits.md'), 'utf8'),
    runtimeHarnessCases: await json('preserved-harness-cases.json')
  };
  const reports = buildReports(production);
  for (const expected of [
    'Total baseline contracts: 497',
    'Dual-green contracts: 8',
    'Sonder-owned contracts: 54',
    'Awaiting native port: 435',
    'Unaccounted: 0'
  ]) assert.match(reports.report, new RegExp(expected));
  assert.deepEqual(await checkGeneratedReports({ root, reports }), []);
});
