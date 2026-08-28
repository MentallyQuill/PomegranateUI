import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { sha256 } from '../../scripts/lib/extraction.mjs';
import { verifyExtraction } from '../../scripts/verify-extraction.mjs';

const roots = [];
test.after(async () => Promise.all(roots.map((root) => rm(root, { recursive: true, force: true }))));

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'pomegranate-verify-'));
  roots.push(root);
  const files = {
    'prototype/oracle.html': "<!-- 1-icon.svg --><script>run('Drag works', () => {});</script>",
    'design/ledger.md': '# Audit\n| # | Family | Surface | State |\n|---:|---|---|---|\n| 1 | Widget | Transcript | Audited |\n',
    'prototype/assets/1-icon.svg': '<svg/>',
    'records/icons/manifest.json': JSON.stringify({ icons: [{ filename: '1-icon.svg', licenseMetadata: 'CC0' }] }),
    'records/icons/README.md': 'CC0 provenance'
  };
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, ...relative.split('/'));
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, content);
  }
  const artifacts = Object.entries(files).map(([destinationPath, content]) => ({
    sourcePath: `source/${destinationPath}`,
    destinationPath,
    sourceCommit: 'a'.repeat(40),
    sourceSha256: sha256(Buffer.from(content)),
    destinationSha256: sha256(Buffer.from(content)),
    classification: destinationPath.includes('assets') || destinationPath.includes('icons') ? 'asset-or-license' : 'toolkit-generic',
    licenseEvidence: destinationPath.endsWith('.svg') ? ['records/icons/README.md', 'records/icons/manifest.json'] : [],
    status: 'preserved-verbatim'
  }));
  const manifest = { schemaVersion: 1, baseline: { sourceCommit: 'a'.repeat(40) }, scopeInventory: artifacts.map((item) => item.sourcePath), artifacts, contracts: [], unaccounted: [] };
  const contractIndex = { schemaVersion: 1, contracts: [
    { contractId: 'POM-DRAG-AAAAAAAAAA', sourcePath: 'source/prototype/oracle.html', sourceEvidence: 'Drag works', evidenceKind: 'harness', destinationOwner: '@pomegranate-ui/drag', destinationEvidence: ['prototype/oracle.html'], status: 'preserved-verbatim' },
    { contractId: 'POM-WIDGET-BBBBBBBBBB', sourcePath: 'source/design/ledger.md', sourceEvidence: 'Widget — Transcript — Audited', evidenceKind: 'widget-ledger', ledgerRow: 1, destinationOwner: '@pomegranate-ui/widget', destinationEvidence: ['design/ledger.md'], status: 'preserved-verbatim' }
  ] };
  const scope = { schemaVersion: 1, mappings: [{ sourcePath: 'source/', destinationPath: '', classification: 'toolkit-generic' }], referencedAssetRules: [{ sourceManifest: 'source/records/icons/manifest.json', destinationDirectory: 'prototype/assets/', licenseEvidence: ['records/icons/README.md', 'records/icons/manifest.json'] }] };
  const testDispositions = { entries: [{ sourcePath: 'tests/test_ui.py', disposition: 'sonder-backend-authority', rationale: 'Backend authority', contractIds: [] }] };
  return { root, manifest, contractIndex, scope, testDispositions };
}

test('accepts a fully accounted extraction fixture', async () => {
  const value = await fixture();
  assert.deepEqual(await verifyExtraction(value), []);
});

test('reports each required preservation failure class', async () => {
  const cases = [
    ['hash mismatch', (v) => { v.manifest.artifacts[0].destinationSha256 = '0'.repeat(64); }, /hash mismatch/],
    ['source missing from manifest', (v) => { v.manifest.scopeInventory.push('source/missing.md'); }, /scope.*absent/i],
    ['artifact outside scope', (v) => { v.manifest.scopeInventory = v.manifest.scopeInventory.slice(1); }, /outside.*scope/i],
    ['legacy case without ID', (v) => { v.contractIndex.contracts.shift(); }, /harness.*stable contract/i],
    ['ledger row without owner', (v) => { v.contractIndex.contracts[1].destinationOwner = ''; }, /owner/i],
    ['unknown contract citation', (v) => { v.contractIndex.contracts[0].destinationEvidence.push('POM-UNKNOWN-0000000000'); }, /unknown contract/i],
    ['contract without evidence', (v) => { v.contractIndex.contracts[0].destinationEvidence = []; }, /no destination evidence/i],
    ['referenced asset without license', (v) => { v.manifest.artifacts.find((a) => a.destinationPath.endsWith('.svg')).licenseEvidence = []; }, /license evidence/i],
    ['retirement', (v) => { v.contractIndex.contracts[0].status = 'retired-approved'; }, /retired-approved/i],
    ['invalid status', (v) => { v.contractIndex.contracts[0].status = 'invented'; }, /invalid status/i],
    ['unaccounted item', (v) => { v.manifest.unaccounted.push('lost'); }, /unaccounted/i]
  ];
  for (const [name, mutate, expected] of cases) {
    const value = await fixture();
    mutate(value);
    const findings = await verifyExtraction(value);
    assert.match(findings.join('\n'), expected, name);
  }
});
