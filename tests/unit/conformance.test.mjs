import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AUTHORITY_RECORDS } from '../conformance/authorities.ts';
import { parseDiscrepancyLedger, validateDiscrepancyLedger } from '../conformance/ledger.ts';
import { DEEP_CURRENT_MACRO_SCENARIOS, hashAuthorityFile, validateConformanceManifest } from '../conformance/manifest.ts';
import { CONFORMANCE_VIEWPORTS } from '../conformance/viewports.ts';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const authority = Object.freeze({
  id: 'atmospheric-workbench',
  path: 'prototypes/sonder-baseline/atmospheric-workbench/sonder-workbench-calibration.html',
  sha256: '38878d2cf8a86f5e879faba4b41a214e4293f22ed755975023e02c962d61b913'
});

const validScenario = Object.freeze({
  id: 'dc-shell-wide',
  title: 'Deep Current wide shell',
  target: 'deep-current',
  authority: authority.id,
  authorityPath: authority.path,
  authoritySha256: authority.sha256,
  viewport: 'wide',
  inputModes: ['fine-pointer', 'keyboard'],
  referenceState: 'scene-ready',
  implementationState: 'scene-ready',
  capture: { kind: 'viewport' },
  measurementProfile: 'deep-current-shell',
  assertionProfile: 'deep-current-shell',
  allowedDeviationIds: []
});

const validationOptions = Object.freeze({
  repositoryRoot,
  authorities: new Map([[authority.id, authority]]),
  viewports: new Map([['wide', { width: 1600, height: 900 }]]),
  driverIds: new Set(['atmospheric-workbench', 'workbench-lab']),
  measurementProfileIds: new Set(['deep-current-shell']),
  assertionProfileIds: new Set(['deep-current-shell']),
  deviationIds: new Set(),
  hashFile: async () => 'wrong'
});

const ledgerHeader = '| ID | Category | Severity | Authority | Scenario | Evidence | Diagnosis | Status | Regression | Deviation |';

test('manifest validation rejects preserved reference hash drift before browser setup', async () => {
  await assert.rejects(
    validateConformanceManifest([validScenario], validationOptions),
    (error) => {
      assert.equal(error.code, 'REFERENCE_HASH_DRIFT');
      assert.equal(error.details.scenarioId, 'dc-shell-wide');
      return true;
    }
  );
});

test('manifest validation rejects duplicate scenario identities before hashing', async () => {
  let hashCalls = 0;
  await assert.rejects(
    validateConformanceManifest([validScenario, validScenario], {
      ...validationOptions,
      hashFile: async () => {
        hashCalls += 1;
        return authority.sha256;
      }
    }),
    (error) => {
      assert.equal(error.code, 'MANIFEST_INVALID');
      assert.equal(error.details.scenarioId, 'dc-shell-wide');
      return true;
    }
  );
  assert.equal(hashCalls, 0);
});

test('manifest validation rejects malformed cross-references and unsafe paths before hashing', async () => {
  const invalidCases = [
    ['unknown authority', { authority: 'missing-authority' }],
    ['authority path mismatch', { authorityPath: 'prototypes/other.html' }],
    ['absolute authority path', { authorityPath: path.resolve(repositoryRoot, 'authority.html') }],
    ['escaping authority path', { authorityPath: '../authority.html' }],
    ['unknown viewport', { viewport: 'cinema' }],
    ['unknown measurement profile', { measurementProfile: 'unknown' }],
    ['unknown assertion profile', { assertionProfile: 'unknown' }],
    ['unknown deviation', { allowedDeviationIds: ['DC-404'] }],
    ['unknown input mode', { inputModes: ['gamepad'] }]
  ];

  for (const [label, override] of invalidCases) {
    let hashCalls = 0;
    await assert.rejects(
      validateConformanceManifest([{ ...validScenario, ...override }], {
        ...validationOptions,
        hashFile: async () => {
          hashCalls += 1;
          return authority.sha256;
        }
      }),
      (error) => {
        assert.equal(error.code, 'MANIFEST_INVALID', label);
        assert.equal(error.details.scenarioId, 'dc-shell-wide', label);
        return true;
      },
      label
    );
    assert.equal(hashCalls, 0, label);
  }
});

test('conformance authorities and viewports expose the independently recorded contract', () => {
  assert.deepEqual(
    Object.fromEntries(AUTHORITY_RECORDS.map((record) => [record.path, record.sha256])),
    {
      'prototypes/sonder-baseline/atmospheric-workbench/sonder-workbench-calibration.html': '38878d2cf8a86f5e879faba4b41a214e4293f22ed755975023e02c962d61b913',
      'prototypes/sonder-baseline/atmospheric-workbench/sonder-workbench-calibration-preview.html': '14c735c159724e03b66e84cf166b7937f99f0654d9ea9d7d36374d0a9a15e557',
      'prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html': '737bb396b5d522e5449c9ec66f4689d525f0b4109d4e40693be50cb6c447f0c0',
      'prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul.html': '043167ad75c07fa5ff8661fbe8a86943a9c0b38eeea9811739309cb866e8a2a5',
      'prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html': '79aa122abae1d51dff5d1cf292590efe03a53641b2ff44008e6a165beb3db8b3'
    }
  );
  assert.deepEqual(Object.fromEntries(CONFORMANCE_VIEWPORTS), {
    wide: { width: 1600, height: 900 },
    standard: { width: 1440, height: 900 },
    medium: { width: 1180, height: 800 },
    'widget-standard': { width: 1024, height: 768 },
    tablet: { width: 768, height: 1024 },
    compact: { width: 430, height: 932 },
    'compact-small': { width: 390, height: 844 },
    'landscape-short': { width: 844, height: 390 },
    'widget-short': { width: 1024, height: 600 },
    'zoom-200': { width: 800, height: 450 }
  });
});

test('the initial Deep Current macro manifest validates against exact repository bytes', async () => {
  assert.deepEqual(
    DEEP_CURRENT_MACRO_SCENARIOS.map(({ id, viewport }) => [id, viewport]),
    [
      ['dc-shell-wide', 'wide'],
      ['dc-shell-medium', 'medium'],
      ['dc-shell-compact', 'compact'],
      ['dc-shell-landscape-short', 'landscape-short'],
      ['dc-shell-zoom-200', 'zoom-200']
    ]
  );

  const validated = await validateConformanceManifest(DEEP_CURRENT_MACRO_SCENARIOS, {
    repositoryRoot,
    authorities: new Map(AUTHORITY_RECORDS.map((record) => [record.id, record])),
    viewports: CONFORMANCE_VIEWPORTS,
    driverIds: new Set(['atmospheric-workbench', 'workbench-lab']),
    measurementProfileIds: new Set(['deep-current-shell']),
    assertionProfileIds: new Set(['deep-current-shell']),
    deviationIds: new Set(),
    hashFile: hashAuthorityFile
  });

  assert.equal(validated.scenarios.length, 5);
  assert.equal(Object.isFrozen(validated.scenarios), true);
});

test('discrepancy ledger parsing preserves the exact reviewed row contract', () => {
  const entries = parseDiscrepancyLedger([
    '# Deep Current ledger',
    '',
    ledgerHeader,
    '|---|---|---|---|---|---|---|---|---|---|',
    '| DC-001 | structure | P1 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.report.json | Toolbars are detached from the stage | open | none | none |'
  ].join('\n'));

  assert.deepEqual(entries, [{
    id: 'DC-001',
    category: 'structure',
    severity: 'P1',
    authority: 'Atmospheric Workbench',
    scenario: 'dc-shell-wide',
    evidence: 'dc-shell-wide.report.json',
    diagnosis: 'Toolbars are detached from the stage',
    status: 'open',
    regression: 'none',
    deviation: 'none'
  }]);
  assert.equal(Object.isFrozen(entries), true);
  assert.equal(Object.isFrozen(entries[0]), true);
});

test('discrepancy ledger parsing rejects a table without its exact separator', () => {
  assert.throws(
    () => parseDiscrepancyLedger([
      ledgerHeader,
      '|---|---|',
      '| DC-001 | structure | P1 | Atmospheric Workbench | dc-shell-wide | report.json | Wrong shell | open | none | none |'
    ].join('\n')),
    (error) => error.code === 'MANIFEST_INVALID' && /separator/.test(error.details.reason)
  );
});

test('discrepancy ledger validation rejects duplicate stable identities', () => {
  const entry = parseDiscrepancyLedger([
    ledgerHeader,
    '|---|---|---|---|---|---|---|---|---|---|',
    '| DC-001 | structure | P1 | Atmospheric Workbench | dc-shell-wide | report.json | Wrong shell | open | none | none |'
  ].join('\n'))[0];

  assert.throws(
    () => validateDiscrepancyLedger([entry, entry], DEEP_CURRENT_MACRO_SCENARIOS),
    (error) => error.code === 'MANIFEST_INVALID' && error.details.discrepancyId === 'DC-001'
  );
});

test('discrepancy ledger validation rejects unreviewable rows and broken scenario references', () => {
  const base = {
    id: 'DC-001',
    category: 'structure',
    severity: 'P1',
    authority: 'Atmospheric Workbench',
    scenario: 'dc-shell-wide',
    evidence: 'dc-shell-wide.report.json',
    diagnosis: 'Toolbars are detached from the stage',
    status: 'open',
    regression: 'none',
    deviation: 'none'
  };
  const invalidCases = [
    ['identity prefix', { id: 'PN-001' }],
    ['category', { category: 'layout' }],
    ['severity', { severity: 'P4' }],
    ['status', { status: 'done' }],
    ['scenario', { scenario: 'dc-missing' }],
    ['closed regression', { status: 'closed', regression: 'none' }],
    ['deviation approval', { status: 'deviation-requested', deviation: 'none' }]
  ];

  for (const [label, override] of invalidCases) {
    assert.throws(
      () => validateDiscrepancyLedger([{ ...base, ...override }], DEEP_CURRENT_MACRO_SCENARIOS),
      (error) => error.code === 'MANIFEST_INVALID' && error.details.discrepancyId === (override.id ?? base.id),
      label
    );
  }

  assert.throws(
    () => validateDiscrepancyLedger([], [{
      ...validScenario,
      allowedDeviationIds: ['DC-404']
    }]),
    (error) => error.code === 'MANIFEST_INVALID' && error.details.discrepancyId === 'DC-404'
  );
});

test('the checked-in Deep Current ledger is a valid bounded macro work queue', async () => {
  const markdown = await readFile(path.join(repositoryRoot, 'docs/conformance/deep-current-ledger.md'), 'utf8');
  const entries = parseDiscrepancyLedger(markdown);
  const validation = validateDiscrepancyLedger(entries, DEEP_CURRENT_MACRO_SCENARIOS);

  assert.deepEqual(validation.entries.map((entry) => entry.id), [
    'DC-001', 'DC-002', 'DC-003', 'DC-004', 'DC-005', 'DC-006', 'DC-007'
  ]);
  assert.equal(validation.entries.every((entry) => entry.status === 'open'), true);
});
