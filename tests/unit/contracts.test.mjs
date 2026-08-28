import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {
  applyNativeEvidenceOverlay,
  buildContractIndex,
  classifyContract,
  extractHarnessCases,
  extractLedgerRows,
  stableContractId
} from '../../scripts/generate-contract-index.mjs';
import {
  discoverSonderTestCandidates,
  validateTestDispositions
} from '../../scripts/generate-test-dispositions.mjs';

const root = path.resolve(import.meta.dirname, '..', '..');

const expectedFirstSliceIds = [
  'POM-PANEL-07856BFE9A',
  'POM-PANEL-DF4EC7C581',
  'POM-PANEL-0C32491298',
  'POM-PANEL-E6D6A0E64B',
  'POM-PERSIST-842D422EB3',
  'POM-PERSIST-9FA69F9FC1',
  'POM-PERSIST-28DFDC9A8F',
  'POM-PERSIST-D50D69D3C4'
];

test('extracts each literal run title once', async () => {
  for (const sourcePath of [
    'prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html',
    'prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html'
  ]) {
    const text = await readFile(path.join(root, sourcePath), 'utf8');
    const expected = [...text.matchAll(/\brun\(\s*(['"`])((?:\\.|(?!\1).)*)\1\s*,/gs)].length;
    const extracted = extractHarnessCases(text, sourcePath);
    assert.equal(extracted.length, expected);
    assert.equal(new Set(extracted.map((item) => item.evidence)).size, extracted.length);
  }
});

test('extracts every numbered Widget audit row once', async () => {
  const sourcePath = 'design/widget-specifications/sonder-panels-and-widgets/12_WIDGET_UX_OVERHAUL_LEDGER.md';
  const text = await readFile(path.join(root, sourcePath), 'utf8');
  const expected = text.split(/\r?\n/).filter((line) => /^\|\s*\d+\s*\|/.test(line)).length;
  const rows = extractLedgerRows(text, sourcePath);
  assert.equal(rows.length, expected);
  assert.equal(new Set(rows.map((item) => item.discriminator)).size, rows.length);
});

test('semantic IDs ignore order and line location but change with behavior', () => {
  const input = { family: 'DRAG', normalizedEvidence: 'invalid release restores exact origin', discriminator: 'harness' };
  assert.equal(stableContractId(input), stableContractId({ ...input, sourceOrder: 99, line: 400 }));
  assert.notEqual(stableContractId(input), stableContractId({ ...input, normalizedEvidence: 'cancel restores exact origin' }));
});

test('classification uses approved families and rejects unmatched evidence', async () => {
  const rules = JSON.parse(await readFile(path.join(root, 'provenance/contract-family-rules.json'), 'utf8'));
  assert.equal(classifyContract({ evidence: 'keyboard focus announcement' }, rules), 'A11Y');
  assert.equal(classifyContract({ evidence: 'invalid drag drop restores exact origin' }, rules), 'DRAG');
  assert.throws(() => classifyContract({ evidence: 'completely unclassifiable behavior' }, rules), /unmatched/i);
});

test('builds a complete unique index with approved statuses and owners', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'provenance/extraction-manifest.json'), 'utf8'));
  const rules = JSON.parse(await readFile(path.join(root, 'provenance/contract-family-rules.json'), 'utf8'));
  const index = await buildContractIndex({ manifest, importedRoot: root, rules });
  assert.ok(index.contracts.length > 0);
  assert.equal(new Set(index.contracts.map((item) => item.contractId)).size, index.contracts.length);
  assert.equal(index.contracts.some((item) => item.status === 'retired-approved'), false);
  assert.equal(index.contracts.every((item) => /^POM-(?:INTEGRATION-SONDER|A11Y|DRAG|RESPONSIVE|PERSIST|CATALOG|THEME|PANEL|LAYOUT|WIDGET)-[A-F0-9]{10}$/.test(item.contractId)), true);
  assert.equal(index.contracts.every((item) => item.destinationOwner && item.destinationEvidence.length), true);
});

test('native evidence overlay accepts only reviewed promotions of known preserved contracts', () => {
  const contracts = [{
    contractId: 'POM-PANEL-AAAAAAAAAA',
    destinationEvidence: ['prototypes/oracle.html'],
    status: 'preserved-verbatim'
  }];
  const valid = {
    schemaVersion: 1,
    entries: [{
      contractId: 'POM-PANEL-AAAAAAAAAA',
      status: 'dual-green',
      nativeEvidence: ['tests/browser/native.spec.ts']
    }]
  };
  const applied = applyNativeEvidenceOverlay(contracts, valid);
  assert.deepEqual(applied[0].destinationEvidence, [
    'prototypes/oracle.html',
    'tests/browser/native.spec.ts'
  ]);
  assert.equal(applied[0].status, 'dual-green');
  assert.equal(contracts[0].status, 'preserved-verbatim');

  assert.throws(() => applyNativeEvidenceOverlay(contracts, {
    ...valid,
    entries: [...valid.entries, valid.entries[0]]
  }), /duplicate.*overlay/i);
  assert.throws(() => applyNativeEvidenceOverlay(contracts, {
    ...valid,
    entries: [{ ...valid.entries[0], contractId: 'POM-PANEL-BBBBBBBBBB' }]
  }), /unknown contract/i);
  assert.throws(() => applyNativeEvidenceOverlay(contracts, {
    ...valid,
    entries: [{ ...valid.entries[0], status: 'invented' }]
  }), /unsupported.*status/i);
  assert.throws(() => applyNativeEvidenceOverlay([
    { ...contracts[0], status: 'sonder-owned' }
  ], valid), /preserved-verbatim/i);
});

test('production overlay promotes exactly the eight first-slice contracts', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'provenance/extraction-manifest.json'), 'utf8'));
  const rules = JSON.parse(await readFile(path.join(root, 'provenance/contract-family-rules.json'), 'utf8'));
  const runtimeHarnessCases = JSON.parse(await readFile(path.join(root, 'provenance/preserved-harness-cases.json'), 'utf8'));
  const nativeEvidence = JSON.parse(await readFile(path.join(root, 'provenance/native-contract-evidence.json'), 'utf8'));
  const index = await buildContractIndex({
    manifest,
    importedRoot: root,
    rules,
    runtimeHarnessCases,
    nativeEvidence
  });
  assert.deepEqual(
    index.contracts.filter((item) => item.status === 'dual-green').map((item) => item.contractId).sort(),
    [...expectedFirstSliceIds].sort()
  );
});

test('contract generation retains the reviewed Sonder test disposition ledger', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'provenance/extraction-manifest.json'), 'utf8'));
  const rules = JSON.parse(await readFile(path.join(root, 'provenance/contract-family-rules.json'), 'utf8'));
  const runtimeHarnessCases = JSON.parse(await readFile(path.join(root, 'provenance/preserved-harness-cases.json'), 'utf8'));
  const testDispositions = JSON.parse(await readFile(path.join(root, 'provenance/sonder-test-dispositions.json'), 'utf8'));
  const index = await buildContractIndex({
    manifest,
    importedRoot: root,
    rules,
    runtimeHarnessCases,
    sonderTests: testDispositions.entries
  });
  assert.deepEqual(index.sonderTests, testDispositions.entries);
});

test('production index assigns one stable ID to every executed runtime case', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'provenance/extraction-manifest.json'), 'utf8'));
  const rules = JSON.parse(await readFile(path.join(root, 'provenance/contract-family-rules.json'), 'utf8'));
  const runtimeHarnessCases = JSON.parse(await readFile(path.join(root, 'provenance/preserved-harness-cases.json'), 'utf8'));
  const index = await buildContractIndex({ manifest, importedRoot: root, rules, runtimeHarnessCases });
  const expectedRuntime = runtimeHarnessCases.harnesses.reduce((total, harness) => total + harness.cases.length, 0);
  const runtimeContracts = index.contracts.filter((contract) => contract.evidenceKind === 'harness-runtime');
  assert.equal(runtimeContracts.length, expectedRuntime);
  assert.equal(expectedRuntime, 307);
  assert.equal(index.contracts.length, expectedRuntime + 190);
});

test('every baseline Sonder UI test candidate has exactly one reviewed disposition', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'provenance/extraction-manifest.json'), 'utf8'));
  const contractIndex = JSON.parse(await readFile(path.join(root, 'provenance/contract-index.json'), 'utf8'));
  const dispositions = JSON.parse(await readFile(path.join(root, 'provenance/sonder-test-dispositions.json'), 'utf8'));
  const candidates = discoverSonderTestCandidates({
    sourceRoot: 'F:/git/Sonder_Engine',
    sourceCommit: manifest.baseline.sourceCommit,
    fallbackCandidates: dispositions.entries.map((item) => item.sourcePath)
  });
  assert.deepEqual(validateTestDispositions({ candidates, dispositions, contractIndex }), []);
});
