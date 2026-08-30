import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

import { parseInspectionArguments } from '../../scripts/conformance/inspect.mjs';
import { AUTHORITY_RECORDS } from '../conformance/authorities.ts';
import { compareMeasurements, MEASUREMENT_PROFILES } from '../conformance/compare.ts';
import { createDiagnosticImages, createEvidencePaths, writeComparisonReport, writeMeasurementEvidence } from '../conformance/evidence.ts';
import { parseDiscrepancyLedger, validateDiscrepancyLedger } from '../conformance/ledger.ts';
import { BUNNY_SCENARIOS, DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS, DEEP_CURRENT_INTERACTION_SCENARIOS, DEEP_CURRENT_MACRO_SCENARIOS, DEEP_CURRENT_WIDGET_SCENARIOS, DEEP_FIDELITY_SCENARIOS, hashAuthorityFile, ORIGINAL_THEME_TARGET_SCENARIOS, POM_NEUTRAL_SCENARIOS, THEME_AUTHORING_SCENARIOS, validateConformanceManifest } from '../conformance/manifest.ts';
import { normalizeMeasurement } from '../conformance/normalize.ts';
import { applyCanonicalShellGeometry, assertScenarioResolution } from '../conformance/runner.ts';
import { CONFORMANCE_VIEWPORTS } from '../conformance/viewports.ts';
import { prepareAtmosphericState } from '../conformance/drivers/reference/atmospheric.ts';
import { DEEP_RECORDING_IMPLEMENTATION_STATES, prepareDeepCurrentState } from '../conformance/drivers/workbench-lab/deep-current.ts';
import { VISIBLE_IMPLEMENTATION_REGION_IDS } from '../conformance/drivers/workbench-lab/deep-current.ts';

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

test('reference and implementation setup failures remain distinct fail-closed lanes', async () => {
  const unavailablePage = {
    goto: async () => { throw new Error('required selector is unavailable'); }
  };

  await assert.rejects(
    prepareAtmosphericState(unavailablePage, 'http://reference.invalid'),
    (error) => error.code === 'REFERENCE_SETUP_FAILED'
      && /required selector is unavailable/.test(error.details.cause)
  );
  await assert.rejects(
    prepareDeepCurrentState(unavailablePage, 'http://implementation.invalid'),
    (error) => error.code === 'IMPLEMENTATION_SETUP_FAILED'
      && /required selector is unavailable/.test(error.details.cause)
  );
});

test('scenario resolution rejects unknown mismatches and stale reviewed rows exactly', () => {
  assert.throws(
    () => assertScenarioResolution('dc-shell-wide', false, []),
    (error) => error.code === 'UNLEDGERED_DISCREPANCY'
      && error.details.scenarioId === 'dc-shell-wide'
  );
  assert.throws(
    () => assertScenarioResolution('dc-shell-wide', true, [{
      id: 'DC-001', scenario: 'dc-shell-wide', status: 'open'
    }]),
    (error) => error.code === 'STALE_DISCREPANCY'
      && error.details.discrepancyIds[0] === 'DC-001'
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
      'prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html': '79aa122abae1d51dff5d1cf292590efe03a53641b2ff44008e6a165beb3db8b3',
      'design/theme-targets/pom-neutral-reference.html': '6a188907925f0af7157f66017a2015e07dbe599d14413d2a590e390f0d97bd50',
      'design/theme-targets/pomos-reference.html': 'a46dc956b0664643506b5023836cd02fb2e9f64ca538acff1aca7cc7c34a7af9',
      'design/theme-targets/bunny-reference.html': 'b718de3bbd9788ff7dd6efb19f11fd12fee12575fc6018f0e2537061625f7a59',
      'design/theme-targets/ash-amber/sonderui-rw2-1-t80.png': '6403a7bcfd8f43195fa42c5d9715cc79964c8b7569f47c22fdeefd1b89804997',
      'design/theme-targets/deep-current/recordings/rw2-t52.png': '7eac0f71b594ce5860d8a93eed8a3fce129074933a981f33a6300833e81f5856',
      'design/theme-targets/deep-current/recordings/rw2-t59.png': 'dedb153ccc0119db01a5653b1c7d6463725c877a456c2271062f92fb7f71a8dd',
      'design/theme-targets/deep-current/recordings/rw2-t67.png': 'f365b4a925be6d0aae43c7d18c17d446edbb6e2e06956466811307f7106f5dcc',
      'design/theme-targets/deep-current/recordings/rw2-t76.png': 'c1cf2d281a2c900056c7b5bdb3507e7f4caeae77619129b75f068421bf3b0ac6',
      'design/theme-targets/deep-current/recordings/rw2-t84.png': '5f8313d53802fe9a783a684616bc685c752325e4bd039e94d6a75cc708b5f7d9',
      'design/theme-targets/deep-current/recordings/rw2-1-t2.png': '343267f966a3d1a7e0c8dace8adfc886792708e45ca2dd472a79539f6f23f11b',
      'design/theme-targets/deep-current/recordings/rw2-1-t14.png': '131540f086240423291473b0cd5ec0106ac0054e5a9df3e3b524123580853aa7',
      'design/theme-targets/deep-current/recordings/rw2-1-t26.png': 'c36e7ad1a28660c2dae68fafc84880887016cbeb1843d530ec347ad2b88b2653',
      'design/theme-targets/deep-current/recordings/rw2-1-t39.png': '1f2f08a310ff15c9f9b53b1ab9e66ed7e774270f9df66db59ce44ccd6872a735',
      'design/theme-targets/deep-current/recordings/rw2-1-t60.png': '61e80edc61d6cd78b853e86474486470abdf6c2d27c29eafb5445b6c227d9520'
    }
  );
  assert.deepEqual(Object.fromEntries(CONFORMANCE_VIEWPORTS), {
    'recording-wide': { width: 1920, height: 1280 },
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
    measurementProfileIds: new Set(['deep-current-shell-behavior']),
    assertionProfileIds: new Set(['deep-current-shell-behavior']),
    deviationIds: new Set(),
    hashFile: hashAuthorityFile
  });

  assert.equal(validated.scenarios.length, 5);
  assert.equal(Object.isFrozen(validated.scenarios), true);
});

test('the Deep Current interaction manifest names every approved behavior against Widget Overhaul', async () => {
  assert.deepEqual(DEEP_CURRENT_INTERACTION_SCENARIOS.map(({ id }) => id), [
    'dc-int-resize-left',
    'dc-int-resize-right',
    'dc-int-shelf-insert',
    'dc-int-tab-merge',
    'dc-int-tab-reorder',
    'dc-int-float',
    'dc-int-invalid-restore',
    'dc-int-cancel-restore',
    'dc-int-focus-back',
    'dc-int-panel-persist',
    'dc-int-catalog-place',
    'dc-int-coarse-targets'
  ]);
  assert.equal(DEEP_CURRENT_INTERACTION_SCENARIOS.every((scenario) => (
    scenario.authority === 'widget-overhaul'
      && scenario.measurementProfile === 'deep-current-interaction'
  )), true);
  assert.deepEqual(Object.fromEntries(DEEP_CURRENT_INTERACTION_SCENARIOS.map(({ id, inputModes }) => [id, inputModes])), {
    'dc-int-resize-left': ['keyboard'],
    'dc-int-resize-right': ['keyboard'],
    'dc-int-shelf-insert': ['fine-pointer'],
    'dc-int-tab-merge': ['fine-pointer'],
    'dc-int-tab-reorder': ['keyboard'],
    'dc-int-float': ['fine-pointer'],
    'dc-int-invalid-restore': ['fine-pointer'],
    'dc-int-cancel-restore': ['coarse-pointer'],
    'dc-int-focus-back': ['fine-pointer'],
    'dc-int-panel-persist': ['keyboard'],
    'dc-int-catalog-place': ['keyboard'],
    'dc-int-coarse-targets': ['coarse-pointer']
  });

  const validated = await validateConformanceManifest(DEEP_CURRENT_INTERACTION_SCENARIOS, {
    repositoryRoot,
    authorities: new Map(AUTHORITY_RECORDS.map((record) => [record.id, record])),
    viewports: CONFORMANCE_VIEWPORTS,
    driverIds: new Set(['widget-overhaul', 'workbench-lab']),
    measurementProfileIds: new Set(['deep-current-interaction']),
    assertionProfileIds: new Set(['deep-current-interaction']),
    deviationIds: new Set(),
    hashFile: hashAuthorityFile
  });
  assert.equal(validated.scenarios.length, 12);
});

test('the target manifest freezes both visual identities across Scene and Catalog states', async () => {
  assert.deepEqual(ORIGINAL_THEME_TARGET_SCENARIOS.map(({ id, target, viewport, referenceState }) => ({ id, target, viewport, referenceState })), [
    { id: 'pn-scene-wide', target: 'pom-neutral', viewport: 'wide', referenceState: 'scene' },
    { id: 'pn-scene-compact', target: 'pom-neutral', viewport: 'compact-small', referenceState: 'scene' },
    { id: 'pn-catalog-wide', target: 'pom-neutral', viewport: 'wide', referenceState: 'catalog' },
    { id: 'bn-scene-wide', target: 'bunny', viewport: 'wide', referenceState: 'scene' },
    { id: 'bn-scene-compact', target: 'bunny', viewport: 'compact-small', referenceState: 'scene' },
    { id: 'bn-catalog-wide', target: 'bunny', viewport: 'wide', referenceState: 'catalog' }
  ]);

  const validated = await validateConformanceManifest(ORIGINAL_THEME_TARGET_SCENARIOS, {
    repositoryRoot,
    authorities: new Map(AUTHORITY_RECORDS.map((record) => [record.id, record])),
    viewports: CONFORMANCE_VIEWPORTS,
    driverIds: new Set(['pomos-reference', 'bunny-original-reference', 'workbench-lab']),
    measurementProfileIds: new Set(['theme-target-behavior']),
    assertionProfileIds: new Set(['theme-target-behavior']),
    deviationIds: new Set(),
    hashFile: hashAuthorityFile
  });
  assert.equal(validated.scenarios.length, 6);
});

test('the frozen target ledgers contain no unresolved or waived discrepancy', async () => {
  for (const [filename, scenarios] of [
    ['pom-neutral-ledger.md', POM_NEUTRAL_SCENARIOS],
    ['bunny-ledger.md', BUNNY_SCENARIOS]
  ]) {
    const entries = parseDiscrepancyLedger(await readFile(path.join(repositoryRoot, 'docs/conformance', filename), 'utf8'));
    const validation = validateDiscrepancyLedger(entries, scenarios);
    assert.deepEqual(validation.entries, []);
  }
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

test('the checked-in Deep Current ledger is a valid frozen macro work queue', async () => {
  const markdown = await readFile(path.join(repositoryRoot, 'docs/conformance/deep-current-ledger.md'), 'utf8');
  const entries = parseDiscrepancyLedger(markdown);
  const validation = validateDiscrepancyLedger(entries, DEEP_CURRENT_MACRO_SCENARIOS);

  assert.deepEqual(validation.entries.map((entry) => entry.id), [
    'DC-001', 'DC-002', 'DC-003', 'DC-004', 'DC-005', 'DC-006', 'DC-007', 'DC-008', 'DC-009'
  ]);
  assert.equal(validation.entries.every((entry) => entry.status === 'closed'), true);
  assert.equal(validation.entries.every((entry) => entry.regression !== 'none'), true);
  assert.deepEqual(
    [...new Set(validation.entries.map((entry) => entry.scenario))].sort(),
    DEEP_CURRENT_MACRO_SCENARIOS.map((scenario) => scenario.id).sort()
  );
});

test('measurement normalization produces stable sorted CSS-pixel evidence', () => {
  const normalized = normalizeMeasurement({
    z: -0,
    list: [2.555, 'rgb(1 2 3 / 50%)'],
    a: { width: 1.235, color: 'rgba(10, 20, 30, 0.5)' }
  });

  assert.deepEqual(normalized, {
    a: { color: 'rgba(10, 20, 30, 0.5)', width: 1.24 },
    list: [2.56, 'rgba(1, 2, 3, 0.5)'],
    z: 0
  });
  assert.deepEqual(Object.keys(normalized), ['a', 'list', 'z']);
});

test('measurement normalization rejects non-finite DOM evidence at its exact path', () => {
  assert.throws(
    () => normalizeMeasurement({ box: { width: Number.POSITIVE_INFINITY } }),
    (error) => error.code === 'MEASUREMENT_FAILED' && error.details.path === 'box.width'
  );
});

test('structured comparison applies only the comparator declared for each evidence path', () => {
  const report = compareMeasurements(
    { regions: { left: { box: { width: 230 } }, stage: { visible: true } } },
    { regions: { left: { box: { width: 231.5 } }, stage: { visible: false } } },
    [
      { path: 'regions.stage.visible', comparator: 'equal', category: 'structure', severity: 'P1' },
      { path: 'regions.left.box.width', comparator: 'within', tolerance: 2, category: 'geometry', severity: 'P2' }
    ]
  );

  assert.equal(report.pass, false);
  assert.deepEqual(report.results.map(({ path, pass, tolerance }) => ({ path, pass, tolerance })), [
    { path: 'regions.left.box.width', pass: true, tolerance: 2 },
    { path: 'regions.stage.visible', pass: false, tolerance: 0 }
  ]);
});

test('structured comparison gives containment, ordering, overflow, and ratio distinct semantics', () => {
  const report = compareMeasurements(
    {
      inventory: ['shelf', 'stage'],
      order: ['shelf', 'left', 'stage', 'right'],
      document: { scrollWidth: 100, clientWidth: 100, scrollHeight: 100, clientHeight: 100 },
      toolbar: 200
    },
    {
      inventory: ['shelf', 'stage', 'composer'],
      order: ['shelf', 'stage', 'left', 'right'],
      document: { scrollWidth: 100, clientWidth: 100, scrollHeight: 101, clientHeight: 100 },
      toolbar: 204
    },
    [
      { path: 'inventory', comparator: 'contains', category: 'content', severity: 'P1' },
      { path: 'order', comparator: 'ordered', category: 'structure', severity: 'P1' },
      { path: 'document', comparator: 'no-overflow', category: 'geometry', severity: 'P1' },
      { path: 'toolbar', comparator: 'ratio-within', tolerance: 0.03, category: 'geometry', severity: 'P2' }
    ]
  );

  assert.deepEqual(Object.fromEntries(report.results.map((result) => [result.comparator, result.pass])), {
    'no-overflow': false,
    contains: true,
    ordered: false,
    'ratio-within': true
  });
});

test('structured comparison rejects a missing required measurement path', () => {
  assert.throws(
    () => compareMeasurements(
      { regions: {} },
      { regions: {} },
      [{ path: 'regions.stage.visible', comparator: 'equal', category: 'structure', severity: 'P1' }]
    ),
    (error) => error.code === 'MEASUREMENT_FAILED' && error.details.path === 'regions.stage.visible'
  );
});

test('the Deep Current shell profile names each structural measurement and tolerance independently', () => {
  const profile = MEASUREMENT_PROFILES.get('deep-current-shell');
  assert.ok(profile);
  assert.deepEqual(profile.map(({ path, comparator, tolerance = 0 }) => ({ path, comparator, tolerance })), [
    { path: 'document', comparator: 'no-overflow', tolerance: 0 },
    { path: 'regions.composer.box.bottom', comparator: 'within', tolerance: 2 },
    { path: 'regions.composer.box.height', comparator: 'within', tolerance: 2 },
    { path: 'regions.composer.box.width', comparator: 'within', tolerance: 2 },
    { path: 'regions.composer.box.x', comparator: 'within', tolerance: 2 },
    { path: 'regions.composer.box.y', comparator: 'within', tolerance: 2 },
    { path: 'regions.composer.overflow', comparator: 'no-overflow', tolerance: 0 },
    { path: 'regions.composer.styles.backdropFilter', comparator: 'equal', tolerance: 0 },
    { path: 'regions.composer.styles.backgroundColor', comparator: 'equal', tolerance: 0 },
    { path: 'regions.composer.styles.borderTopColor', comparator: 'equal', tolerance: 0 },
    { path: 'regions.composer.visible', comparator: 'equal', tolerance: 0 },
    { path: 'regions.left.box.bottom', comparator: 'within', tolerance: 2 },
    { path: 'regions.left.box.height', comparator: 'within', tolerance: 2 },
    { path: 'regions.left.box.width', comparator: 'within', tolerance: 2 },
    { path: 'regions.left.box.x', comparator: 'within', tolerance: 2 },
    { path: 'regions.left.overflow', comparator: 'no-overflow', tolerance: 0 },
    { path: 'regions.left.styles.backdropFilter', comparator: 'equal', tolerance: 0 },
    { path: 'regions.left.styles.backgroundColor', comparator: 'equal', tolerance: 0 },
    { path: 'regions.left.visible', comparator: 'equal', tolerance: 0 },
    { path: 'regions.right.box.bottom', comparator: 'within', tolerance: 2 },
    { path: 'regions.right.box.height', comparator: 'within', tolerance: 2 },
    { path: 'regions.right.box.width', comparator: 'within', tolerance: 2 },
    { path: 'regions.right.box.x', comparator: 'within', tolerance: 2 },
    { path: 'regions.right.overflow', comparator: 'no-overflow', tolerance: 0 },
    { path: 'regions.right.styles.backdropFilter', comparator: 'equal', tolerance: 0 },
    { path: 'regions.right.styles.backgroundColor', comparator: 'equal', tolerance: 0 },
    { path: 'regions.right.visible', comparator: 'equal', tolerance: 0 },
    { path: 'regions.shelf.box.bottom', comparator: 'within', tolerance: 2 },
    { path: 'regions.shelf.box.height', comparator: 'within', tolerance: 2 },
    { path: 'regions.shelf.box.width', comparator: 'within', tolerance: 2 },
    { path: 'regions.shelf.box.x', comparator: 'within', tolerance: 2 },
    { path: 'regions.shelf.box.y', comparator: 'within', tolerance: 2 },
    { path: 'regions.shelf.overflow', comparator: 'no-overflow', tolerance: 0 },
    { path: 'regions.shelf.styles.backdropFilter', comparator: 'equal', tolerance: 0 },
    { path: 'regions.shelf.styles.backgroundColor', comparator: 'equal', tolerance: 0 },
    { path: 'regions.shelf.styles.borderTopColor', comparator: 'equal', tolerance: 0 },
    { path: 'regions.shelf.visible', comparator: 'equal', tolerance: 0 },
    { path: 'regions.stage.box.bottom', comparator: 'within', tolerance: 2 },
    { path: 'regions.stage.box.height', comparator: 'within', tolerance: 2 },
    { path: 'regions.stage.box.width', comparator: 'within', tolerance: 2 },
    { path: 'regions.stage.box.x', comparator: 'within', tolerance: 2 },
    { path: 'regions.stage.box.y', comparator: 'within', tolerance: 2 },
    { path: 'regions.stage.overflow', comparator: 'no-overflow', tolerance: 0 },
    { path: 'regions.stage.visible', comparator: 'equal', tolerance: 0 }
  ]);
});

test('the v2 Deep Current migration profile preserves structure without claiming layout fidelity', () => {
  assert.deepEqual(MEASUREMENT_PROFILES.get('deep-current-shell-behavior')?.map(({ path }) => path), [
    'document',
    'regions.composer.overflow.x',
    'regions.composer.styles.borderTopColor',
    'regions.composer.visible',
    'regions.left.visible',
    'regions.right.visible',
    'regions.shelf.overflow.x',
    'regions.shelf.styles.backgroundColor',
    'regions.shelf.visible',
    'regions.stage.overflow.x',
    'regions.stage.visible'
  ]);
});

test('the original target profile compares identity and accessibility without freezing superseded art direction', () => {
  const profile = MEASUREMENT_PROFILES.get('theme-target-behavior');
  assert.ok(profile);
  assert.deepEqual(profile.map(({ path }) => path), [
    'functional.targetApplied',
    'functional.identityStable',
    'functional.instant',
    'functional.noHorizontalOverflow',
    'functional.keyboardAccessible',
    'functional.scenarioStateReached',
    'structure.panelTabs',
    'structure.anchorWidgets'
  ]);
});

test('Widget and Catalog profiles gate stable rendered qualities and every lifecycle stage', () => {
  assert.deepEqual(MEASUREMENT_PROFILES.get('deep-current-widget-surface')?.map(({ path }) => path).slice(-3), [
    'visual.darkSurface',
    'visual.visibleBorder',
    'visual.compactCorners'
  ]);
  assert.deepEqual(MEASUREMENT_PROFILES.get('deep-current-catalog')?.map(({ path }) => path).slice(-4), [
    'lifecycle.placed',
    'lifecycle.persisted',
    'lifecycle.rendered',
    'lifecycle.removed'
  ]);
});

test('evidence paths reject unsafe scenario identities before constructing files', () => {
  assert.throws(
    () => createEvidencePaths(path.join(repositoryRoot, 'test-results', 'conformance'), '../escape'),
    (error) => error.code === 'MANIFEST_INVALID' && error.details.scenarioId === '../escape'
  );
});

test('comparison report writes are byte-deterministic across repeated runs', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'pom-conformance-evidence-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const paths = createEvidencePaths(directory, 'dc-shell-wide');

  await writeComparisonReport(paths, { z: 1, a: { status: 'open' } });
  const first = await readFile(paths.reportJson, 'utf8');
  await writeComparisonReport(paths, { z: 1, a: { status: 'open' } });
  const second = await readFile(paths.reportJson, 'utf8');

  assert.equal(first, second);
  assert.equal(first, '{\n  "a": {\n    "status": "open"\n  },\n  "z": 1\n}\n');
});

test('measurement evidence writes reference and implementation data to its dedicated path', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'pom-conformance-measurements-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const paths = createEvidencePaths(directory, 'dc-shell-wide');

  await writeMeasurementEvidence(paths, { implementation: { width: 10 }, reference: { width: 12 } });

  assert.equal(
    await readFile(paths.measurementsJson, 'utf8'),
    '{\n  "implementation": {\n    "width": 10\n  },\n  "reference": {\n    "width": 12\n  }\n}\n'
  );
  await assert.rejects(readFile(paths.reportJson), { code: 'ENOENT' });
});

test('diagnostic image generation reports dimension mismatch without rewriting source evidence', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'pom-conformance-images-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const paths = createEvidencePaths(directory, 'dc-shell-wide');
  const reference = PNG.sync.write(new PNG({ width: 1, height: 1 }));
  const actual = PNG.sync.write(new PNG({ width: 2, height: 1 }));
  await writeFile(paths.referencePng, reference);
  await writeFile(paths.actualPng, actual);

  const summary = await createDiagnosticImages(paths.referencePng, paths.actualPng, paths);

  assert.deepEqual(summary, {
    compatible: false,
    reference: { width: 1, height: 1 },
    actual: { width: 2, height: 1 },
    differingPixels: null,
    maximumChannelDelta: null
  });
  assert.deepEqual(await readFile(paths.referencePng), reference);
  assert.deepEqual(await readFile(paths.actualPng), actual);
  await assert.rejects(readFile(paths.overlayPng), { code: 'ENOENT' });
  await assert.rejects(readFile(paths.diffPng), { code: 'ENOENT' });
});

test('diagnostic image generation writes an alpha overlay and absolute channel diff', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'pom-conformance-diff-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const paths = createEvidencePaths(directory, 'dc-shell-wide');
  const referenceImage = new PNG({ width: 2, height: 1 });
  const actualImage = new PNG({ width: 2, height: 1 });
  referenceImage.data.set([10, 20, 30, 255, 100, 100, 100, 255]);
  actualImage.data.set([10, 20, 30, 255, 110, 90, 120, 255]);
  await writeFile(paths.referencePng, PNG.sync.write(referenceImage));
  await writeFile(paths.actualPng, PNG.sync.write(actualImage));

  const summary = await createDiagnosticImages(paths.referencePng, paths.actualPng, paths);
  const overlay = PNG.sync.read(await readFile(paths.overlayPng));
  const diff = PNG.sync.read(await readFile(paths.diffPng));
  const firstOverlayBytes = await readFile(paths.overlayPng);
  const firstDiffBytes = await readFile(paths.diffPng);

  await createDiagnosticImages(paths.referencePng, paths.actualPng, paths);

  assert.deepEqual(summary, {
    compatible: true,
    reference: { width: 2, height: 1 },
    actual: { width: 2, height: 1 },
    differingPixels: 1,
    maximumChannelDelta: 20
  });
  assert.deepEqual([...overlay.data], [10, 20, 30, 255, 105, 95, 110, 255]);
  assert.deepEqual([...diff.data], [0, 0, 0, 255, 10, 10, 20, 255]);
  assert.deepEqual(await readFile(paths.overlayPng), firstOverlayBytes);
  assert.deepEqual(await readFile(paths.diffPng), firstDiffBytes);
});

test('reference and Lab drivers keep selectors and imports independent', async () => {
  const [referenceDriver, labDriver] = await Promise.all([
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/reference/atmospheric.ts'), 'utf8'),
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/workbench-lab/deep-current.ts'), 'utf8')
  ]);

  assert.doesNotMatch(referenceDriver, /data-(?:conformance-region|pomegranate-)|workbench-lab/);
  assert.doesNotMatch(labDriver, /\.sonder-|drivers\/reference|atmospheric/);
});

test('Widget Overhaul and Lab interaction drivers keep selectors and imports independent', async () => {
  const [referenceDriver, labDriver] = await Promise.all([
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/reference/widget-overhaul.ts'), 'utf8'),
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/workbench-lab/interactions.ts'), 'utf8')
  ]);

  assert.doesNotMatch(referenceDriver, /data-(?:conformance-region|pomegranate-)|workbench-lab/);
  assert.doesNotMatch(labDriver, /#results|\.pass|drivers\/reference|widget-overhaul/);
});

test('Widget and Catalog conformance drivers keep preserved and Lab selectors independent', async () => {
  const [referenceSurfaces, labSurfaces, referenceCatalog, labCatalog] = await Promise.all([
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/reference/widget-overhaul-surfaces.ts'), 'utf8'),
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/workbench-lab/widget-surfaces.ts'), 'utf8'),
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/reference/widget-overhaul-catalog.ts'), 'utf8'),
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/workbench-lab/catalog.ts'), 'utf8')
  ]);

  assert.doesNotMatch(referenceSurfaces, /data-surface-|implemented-widget|workbench-lab/);
  assert.doesNotMatch(referenceCatalog, /catalog-miniature|data-renderer-status|workbench-lab/);
  assert.doesNotMatch(labSurfaces, /\.sonder-|SonderWidgetMockup|\.\.\/reference/);
  assert.doesNotMatch(labSurfaces, /data-surface-(?:row-labels|actions)/);
  assert.doesNotMatch(labCatalog, /\.sonder-|SonderWidgetMockup|widget-overhaul|\.\.\/reference/);
});

test('original theme references and Lab driver keep their selectors and imports independent', async () => {
  const [referenceDriver, labDriver] = await Promise.all([
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/reference/theme-target.ts'), 'utf8'),
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/workbench-lab/theme-target.ts'), 'utf8')
  ]);

  assert.doesNotMatch(referenceDriver, /data-(?:conformance-region|pomegranate-)|workbench-lab/);
  assert.doesNotMatch(labDriver, /data-theme-reference|\.showcase|\.catalog-card|\.\.\/reference/);
});

test('Lab readiness permits responsive docks to remain intentionally hidden', () => {
  assert.deepEqual(VISIBLE_IMPLEMENTATION_REGION_IDS, ['shelf', 'stage', 'composer']);
});

test('canonical shell geometry replaces platform-dependent reference boxes without replacing live evidence', () => {
  const region = (seed) => ({
    box: { x: seed, y: seed, width: seed, height: seed, right: seed * 2, bottom: seed * 2 },
    visible: true,
    overflow: { x: false, y: false, scrollWidth: seed, clientWidth: seed, scrollHeight: seed, clientHeight: seed },
    styles: { backgroundColor: `rgb(${seed}, 0, 0)`, borderTopColor: 'transparent', color: 'white', fontFamily: 'Geist', backdropFilter: 'none' }
  });
  const reference = {
    viewport: { width: 430, height: 932 },
    document: { scrollWidth: 430, clientWidth: 430, scrollHeight: 932, clientHeight: 932 },
    regions: {
      shelf: region(1),
      left: region(2),
      stage: region(3),
      right: region(4),
      composer: region(5)
    }
  };
  const baseline = {
    viewport: [430, 932],
    regions: {
      shelf: [24, 110, 382, 40],
      left: [24, 150, 1, 774],
      stage: [24, 150, 382, 774],
      right: [406, 150, 1, 774],
      composer: [38, 841, 354, 65]
    }
  };

  const canonical = applyCanonicalShellGeometry(reference, baseline);

  assert.deepEqual(canonical.regions.shelf.box, { x: 24, y: 110, width: 382, height: 40, right: 406, bottom: 150 });
  assert.deepEqual(canonical.regions.stage.box, { x: 24, y: 150, width: 382, height: 774, right: 406, bottom: 924 });
  assert.strictEqual(canonical.regions.shelf.styles, reference.regions.shelf.styles);
  assert.strictEqual(canonical.regions.shelf.overflow, reference.regions.shelf.overflow);
  assert.strictEqual(canonical.document, reference.document);
  assert.deepEqual(reference.regions.shelf.box, { x: 1, y: 1, width: 1, height: 1, right: 2, bottom: 2 });
});

test('the reviewed Deep Current macro baseline freezes every authority viewport', async () => {
  const baseline = JSON.parse(await readFile(
    path.join(repositoryRoot, 'tests/conformance/baselines/deep-current-macro.json'),
    'utf8'
  ));
  assert.equal(baseline.schemaVersion, 'pomegranate.ui.conformance-baseline.v1');
  assert.equal(baseline.authoritySha256, AUTHORITY_RECORDS[0].sha256);
  assert.equal(baseline.measurementProfile, 'deep-current-shell');
  assert.deepEqual(Object.keys(baseline.scenarios), DEEP_CURRENT_MACRO_SCENARIOS.map(({ id }) => id));
  for (const scenario of Object.values(baseline.scenarios)) {
    assert.equal(scenario.pass, true);
    assert.equal(scenario.documentOverflow, false);
    assert.deepEqual(Object.keys(scenario.regions), ['shelf', 'left', 'stage', 'right', 'composer']);
    for (const box of Object.values(scenario.regions)) {
      assert.equal(box.length, 4);
      assert.equal(box.every(Number.isFinite), true);
    }
  }
});

test('the reviewed Deep Current interaction baseline freezes every approved behavior', async () => {
  const baseline = JSON.parse(await readFile(
    path.join(repositoryRoot, 'tests/conformance/baselines/deep-current-interactions.json'),
    'utf8'
  ));
  assert.equal(baseline.schemaVersion, 'pomegranate.ui.conformance-baseline.v1');
  assert.equal(baseline.authority, 'widget-overhaul');
  assert.equal(baseline.authoritySha256, AUTHORITY_RECORDS[3].sha256);
  assert.equal(baseline.measurementProfile, 'deep-current-interaction');
  assert.deepEqual(Object.keys(baseline.scenarios), DEEP_CURRENT_INTERACTION_SCENARIOS.map(({ id }) => id));
  for (const [id, frozenScenario] of Object.entries(baseline.scenarios)) {
    const manifestScenario = DEEP_CURRENT_INTERACTION_SCENARIOS.find((scenario) => scenario.id === id);
    assert.ok(manifestScenario);
    assert.equal(frozenScenario.pass, true);
    assert.equal(frozenScenario.viewport, manifestScenario.viewport);
    assert.equal(frozenScenario.referenceState, manifestScenario.referenceState);
    assert.deepEqual(frozenScenario.inputModes, manifestScenario.inputModes);
    assert.deepEqual(frozenScenario.functional, {
      authorityCasePassed: true,
      outcomeReached: true,
      identityStable: true,
      persistenceVerified: true,
      keyboardAccessible: true
    });
  }
});

test('the reviewed Deep Current Widget baseline freezes all 49 surfaces and six Catalog scenarios', async () => {
  const baseline = JSON.parse(await readFile(
    path.join(repositoryRoot, 'tests/conformance/baselines/deep-current-widgets.json'),
    'utf8'
  ));
  const scenarios = [...DEEP_CURRENT_WIDGET_SCENARIOS, ...DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS];
  assert.equal(baseline.schemaVersion, 'pomegranate.ui.conformance-baseline.v1');
  assert.equal(baseline.authority, 'widget-overhaul');
  assert.equal(baseline.authoritySha256, AUTHORITY_RECORDS[3].sha256);
  assert.deepEqual(baseline.measurementProfiles, {
    surface: 'deep-current-widget-surface',
    catalog: 'deep-current-catalog'
  });
  assert.deepEqual(Object.keys(baseline.scenarios), scenarios.map(({ id }) => id));
  assert.equal(DEEP_CURRENT_WIDGET_SCENARIOS.length, 49);
  assert.equal(DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS.length, 6);
  for (const scenario of DEEP_CURRENT_WIDGET_SCENARIOS) {
    assert.deepEqual(baseline.scenarios[scenario.id], { pass: true, profile: 'surface' });
  }
  for (const scenario of DEEP_CURRENT_CATALOG_CONFORMANCE_SCENARIOS) {
    assert.equal(baseline.scenarios[scenario.id].pass, true);
    assert.equal(baseline.scenarios[scenario.id].profile, 'catalog');
  }
  assert.deepEqual(baseline.scenarios['dc-catalog-placement-all'].lifecycle, {
    placed: 94,
    persisted: 94,
    rendered: 94,
    removed: 94
  });
});

test('the reviewed theme baseline freezes every target scenario and authority hash', async () => {
  const baseline = JSON.parse(await readFile(
    path.join(repositoryRoot, 'tests/conformance/baselines/original-theme-targets.json'),
    'utf8'
  ));
  assert.equal(baseline.schemaVersion, 'pomegranate.ui.conformance-baseline.v1');
  assert.equal(baseline.measurementProfile, 'theme-target-behavior');
  assert.deepEqual(baseline.authorities, {
    'pomos-reference': AUTHORITY_RECORDS.find(({ id }) => id === 'pomos-reference').sha256,
    'bunny-original-reference': AUTHORITY_RECORDS.find(({ id }) => id === 'bunny-original-reference').sha256
  });
  assert.deepEqual(Object.keys(baseline.scenarios), ORIGINAL_THEME_TARGET_SCENARIOS.map(({ id }) => id));
  for (const scenario of ORIGINAL_THEME_TARGET_SCENARIOS) {
    assert.deepEqual(baseline.scenarios[scenario.id], {
      pass: true,
      target: scenario.target,
      viewport: scenario.viewport,
      state: scenario.referenceState
    });
  }
});

test('the exact Deep fidelity contract covers every geometry, typography, material, structure, and functional path', () => {
  const profile = MEASUREMENT_PROFILES.get('deep-fidelity');
  assert.ok(profile);
  const paths = new Set(profile.map(({ path }) => path));
  for (const region of ['header', 'left', 'stage', 'right', 'story', 'composer', 'floating', 'widgetShelf']) {
    for (const field of ['x', 'y', 'width', 'height', 'right', 'bottom']) {
      assert.ok(paths.has(`geometry.${region}.box.${field}`), `missing geometry.${region}.box.${field}`);
    }
  }
  for (const role of ['wordmark', 'navigation', 'widgetTitle', 'technical', 'storyHeading', 'storyBody', 'composer']) {
    for (const field of ['family', 'size', 'weight', 'lineHeight', 'tracking', 'transform']) {
      assert.ok(paths.has(`typography.${role}.${field}`), `missing typography.${role}.${field}`);
    }
  }
  for (const material of ['header', 'widget', 'widgetHeader', 'storyVeil', 'composer', 'floating', 'dialog']) {
    for (const field of ['background', 'opacity', 'blur', 'border', 'radius', 'shadow']) {
      assert.ok(paths.has(`materials.${material}.${field}`), `missing materials.${material}.${field}`);
    }
  }
  assert.deepEqual(
    ['structure.panelTabs', 'structure.regions', 'structure.visibleWidgets', 'structure.widgetLocations', 'functional.stateReached', 'functional.identityStable', 'functional.noOverflow', 'functional.keyboardAccessible']
      .filter((path) => !paths.has(path)),
    []
  );
});

test('exact Deep fidelity scenarios retain both executable authorities and every recording frame hash', async () => {
  const recordingManifest = JSON.parse(await readFile(
    path.join(repositoryRoot, 'design/theme-targets/deep-current/recordings/reference.json'),
    'utf8'
  ));
  const scenariosByAuthorityPath = new Map(DEEP_FIDELITY_SCENARIOS.map((scenario) => [scenario.authorityPath, scenario]));

  assert.equal(DEEP_FIDELITY_SCENARIOS.some(({ authority }) => authority === 'atmospheric-workbench'), true);
  assert.equal(DEEP_FIDELITY_SCENARIOS.some(({ authority }) => authority === 'widget-overhaul'), true);
  for (const frame of recordingManifest.frames) {
    const scenario = scenariosByAuthorityPath.get(frame.file);
    assert.ok(scenario, `missing exact-fidelity scenario for ${frame.file}`);
    assert.equal(scenario.authoritySha256, frame.sha256.toLowerCase());
    assert.equal(scenario.viewport, 'recording-wide');
    assert.equal(scenario.measurementProfile, 'deep-fidelity');
  }
});

test('the Lab fidelity driver has one explicit implementation state for every Deep recording', () => {
  const recordingStates = DEEP_FIDELITY_SCENARIOS
    .filter(({ authorityPath }) => authorityPath.includes('deep-current/recordings/'))
    .map(({ implementationState }) => implementationState);
  assert.deepEqual([...DEEP_RECORDING_IMPLEMENTATION_STATES], recordingStates);
});

test('exact Deep fidelity stores an inspectable original-resolution baseline and ledger', async () => {
  const baseline = JSON.parse(await readFile(
    path.join(repositoryRoot, 'tests/conformance/baselines/deep-fidelity.json'),
    'utf8'
  ));
  assert.equal(baseline.schemaVersion, 'pomegranate.ui.deep-fidelity.v1');
  assert.deepEqual(Object.keys(baseline.scenarios), DEEP_FIDELITY_SCENARIOS.map(({ id }) => id));
  for (const scenario of Object.values(baseline.scenarios)) {
    assert.equal(scenario.viewport.width, 1920);
    assert.equal(scenario.viewport.height, 1280);
    assert.match(scenario.referencePng, /\.png$/);
    assert.match(scenario.actualPng, /\.png$/);
    assert.match(scenario.overlayPng, /\.png$/);
    assert.match(scenario.diffPng, /\.png$/);
  }
  const ledger = await readFile(path.join(repositoryRoot, 'docs/conformance/deep-fidelity-ledger.md'), 'utf8');
  assert.match(ledger, /Deep exact-fidelity discrepancy ledger/);
});

test('Theme authoring exposes four literal fail-closed scenarios', async () => {
  assert.deepEqual(THEME_AUTHORING_SCENARIOS.map(({ id, implementationState }) => [id, implementationState]), [
    ['theme-authoring-ash-seed', 'ash-seed'],
    ['theme-authoring-last-valid', 'last-valid'],
    ['theme-authoring-ambient-precedence', 'ambient-precedence'],
    ['theme-authoring-round-trip', 'round-trip']
  ]);
  assert.equal(THEME_AUTHORING_SCENARIOS.every((scenario) => (
    scenario.target === 'ash-amber'
      && scenario.authority === 'ash-amber-recording-frame'
      && scenario.measurementProfile === 'theme-authoring'
      && scenario.assertionProfile === 'theme-authoring'
  )), true);
  const validated = await validateConformanceManifest(THEME_AUTHORING_SCENARIOS, {
    repositoryRoot,
    authorities: new Map(AUTHORITY_RECORDS.map((record) => [record.id, record])),
    viewports: CONFORMANCE_VIEWPORTS,
    driverIds: new Set(['ash-amber-recording-frame', 'workbench-lab']),
    measurementProfileIds: new Set(['theme-authoring']),
    assertionProfileIds: new Set(['theme-authoring']),
    deviationIds: new Set(),
    hashFile: hashAuthorityFile
  });
  assert.equal(validated.scenarios.length, 4);
});

test('Theme authoring baseline freezes approved literals without importing the target', async () => {
  const baselineText = await readFile(path.join(repositoryRoot, 'tests/conformance/baselines/theme-authoring.json'), 'utf8');
  const baseline = JSON.parse(baselineText);
  assert.equal(baseline.schemaVersion, 'pomegranate.ui.conformance-baseline.v1');
  assert.equal(baseline.authority, 'approved-theme-authoring-spec');
  assert.equal(baseline.measurementProfile, 'theme-authoring');
  assert.deepEqual(Object.keys(baseline.scenarios), THEME_AUTHORING_SCENARIOS.map(({ id }) => id));
  assert.deepEqual(baseline.scenarios['theme-authoring-ash-seed'].outcome.editable.colors, {
    canvas: '#242321', glass: '#302E2A', chrome: '#625B52', ambient: '#51493E', text: '#F3F0EA', source: '#D2B57A'
  });
  assert.deepEqual(baseline.scenarios['theme-authoring-ash-seed'].outcome.editable.materials, {
    glassDensity: 20, barOpacity: 60, selectedStrength: 6, frostLevel: 50
  });
  assert.deepEqual(baseline.scenarios['theme-authoring-ash-seed'].outcome.editable.ambient, {
    x: 57, y: 97, radius: 60, power: 56
  });
  assert.equal(baseline.scenarios['theme-authoring-ash-seed'].outcome.applied.colors.accent, '#C18A3D');
  assert.doesNotMatch(baselineText, /ASH_AMBER_TARGET|ash-amber\.ts|presets/);
});

test('Theme authoring driver measures editable and applied state independently', async () => {
  const driver = await readFile(path.join(repositoryRoot, 'tests/conformance/drivers/workbench-lab/theme-authoring.ts'), 'utf8');
  assert.match(driver, /Hex color/);
  assert.match(driver, /--pom-color-canvas/);
  assert.match(driver, /--pom-color-accent/);
  assert.match(driver, /pomegranate-ui\.workbench-lab\.theme-draft\.v1/);
  assert.match(driver, /resolveAmbientProfile/);
  assert.doesNotMatch(driver, /ASH_AMBER_TARGET|ash-amber\.ts|presets|drivers\/reference/);
});

test('Theme authoring profile and ledger gate every required outcome', async () => {
  assert.deepEqual(MEASUREMENT_PROFILES.get('theme-authoring')?.map(({ path }) => path), [
    'functional.controlsPresent',
    'functional.targetApplied',
    'functional.appliedEditableIndependent',
    'functional.workbenchIdentityStable',
    'functional.layoutIndependent',
    'outcome'
  ]);
  const ledger = parseDiscrepancyLedger(await readFile(
    path.join(repositoryRoot, 'docs/conformance/theme-authoring-ledger.md'),
    'utf8'
  ));
  assert.deepEqual(validateDiscrepancyLedger(ledger, THEME_AUTHORING_SCENARIOS).entries, []);
});

test('inspection requires one exact known scenario without permitting update mode', () => {
  assert.equal(parseInspectionArguments(['--scenario', 'dc-shell-wide']).id, 'dc-shell-wide');
  assert.equal(parseInspectionArguments(['--scenario', 'dc-int-tab-merge']).id, 'dc-int-tab-merge');
  assert.equal(parseInspectionArguments(['--scenario', 'pn-scene-compact']).id, 'pn-scene-compact');
  assert.equal(parseInspectionArguments(['--scenario', 'bn-catalog-wide']).id, 'bn-catalog-wide');
  assert.equal(parseInspectionArguments(['--scenario', 'aa-scene-wide']).id, 'aa-scene-wide');
  assert.equal(parseInspectionArguments(['--scenario', 'theme-authoring-round-trip']).id, 'theme-authoring-round-trip');
  assert.throws(() => parseInspectionArguments([]), /--scenario <id> is required/);
  assert.throws(() => parseInspectionArguments(['--scenario', 'unknown']), /Unknown conformance scenario/);
  assert.throws(() => parseInspectionArguments(['--scenario', 'dc-shell-wide', '--update-snapshots']), /Unexpected inspection argument/);
});
