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
import { DEEP_CURRENT_INTERACTION_SCENARIOS, DEEP_CURRENT_MACRO_SCENARIOS, hashAuthorityFile, validateConformanceManifest } from '../conformance/manifest.ts';
import { normalizeMeasurement } from '../conformance/normalize.ts';
import { assertScenarioResolution } from '../conformance/runner.ts';
import { CONFORMANCE_VIEWPORTS } from '../conformance/viewports.ts';
import { prepareAtmosphericState } from '../conformance/drivers/reference/atmospheric.ts';
import { prepareDeepCurrentState } from '../conformance/drivers/workbench-lab/deep-current.ts';
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

test('Lab readiness permits responsive docks to remain intentionally hidden', () => {
  assert.deepEqual(VISIBLE_IMPLEMENTATION_REGION_IDS, ['shelf', 'stage', 'composer']);
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

test('inspection requires one exact known scenario without permitting update mode', () => {
  assert.equal(parseInspectionArguments(['--scenario', 'dc-shell-wide']).id, 'dc-shell-wide');
  assert.equal(parseInspectionArguments(['--scenario', 'dc-int-tab-merge']).id, 'dc-int-tab-merge');
  assert.throws(() => parseInspectionArguments([]), /--scenario <id> is required/);
  assert.throws(() => parseInspectionArguments(['--scenario', 'unknown']), /Unknown conformance scenario/);
  assert.throws(() => parseInspectionArguments(['--scenario', 'dc-shell-wide', '--update-snapshots']), /Unexpected inspection argument/);
});
