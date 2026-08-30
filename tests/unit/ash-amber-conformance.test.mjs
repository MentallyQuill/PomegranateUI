import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('Ash & Amber exposes a hash-locked three-scenario conformance lane', async () => {
  const [{ AUTHORITY_RECORDS }, manifest, { CONFORMANCE_VIEWPORTS }, { MEASUREMENT_PROFILES }] = await Promise.all([
    import('../conformance/authorities.ts'),
    import('../conformance/manifest.ts'),
    import('../conformance/viewports.ts'),
    import('../conformance/compare.ts')
  ]);
  assert.ok(manifest.ASH_AMBER_SCENARIOS, 'ASH_AMBER_SCENARIOS must be exported');
  assert.deepEqual(manifest.ASH_AMBER_SCENARIOS.map(({ id, target, viewport, referenceState }) => ({
    id, target, viewport, referenceState
  })), [
    { id: 'aa-scene-wide', target: 'ash-amber', viewport: 'recording-wide', referenceState: 'scene' },
    { id: 'aa-scene-compact', target: 'ash-amber', viewport: 'compact-small', referenceState: 'scene' },
    { id: 'aa-catalog-wide', target: 'ash-amber', viewport: 'standard', referenceState: 'catalog' }
  ]);
  const authority = AUTHORITY_RECORDS.find(({ id }) => id === 'ash-amber-recording-frame');
  assert.deepEqual(authority, {
    id: 'ash-amber-recording-frame',
    path: 'design/theme-targets/ash-amber/sonderui-rw2-1-t80.png',
    sha256: '6403a7bcfd8f43195fa42c5d9715cc79964c8b7569f47c22fdeefd1b89804997'
  });
  const validated = await manifest.validateConformanceManifest(manifest.ASH_AMBER_SCENARIOS, {
    repositoryRoot,
    authorities: new Map(AUTHORITY_RECORDS.map((record) => [record.id, record])),
    viewports: CONFORMANCE_VIEWPORTS,
    driverIds: new Set(['ash-amber-recording-frame', 'workbench-lab']),
    measurementProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
    assertionProfileIds: new Set(MEASUREMENT_PROFILES.keys()),
    deviationIds: new Set(),
    hashFile: manifest.hashAuthorityFile
  });
  assert.equal(validated.scenarios.length, 3);
});

test('Ash & Amber reference and implementation drivers stay independent', async () => {
  const [referenceDriver, labDriver] = await Promise.all([
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/reference/ash-amber.ts'), 'utf8'),
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/workbench-lab/theme-target.ts'), 'utf8')
  ]);
  assert.doesNotMatch(referenceDriver, /workbench-lab|LAB_THEME|data-pomegranate|data-pom-theme/);
  assert.doesNotMatch(labDriver, /sonderui-rw2-1-t80|design\/theme-targets\/ash-amber|\.\.\/reference/);
});

test('Ash & Amber reference semantics preserve the corrected neutral and rounded rubric', async () => {
  const [referenceDriver, ledgerText] = await Promise.all([
    readFile(path.join(repositoryRoot, 'tests/conformance/drivers/reference/ash-amber.ts'), 'utf8'),
    readFile(path.join(repositoryRoot, 'docs/conformance/ash-amber-ledger.md'), 'utf8')
  ]);

  for (const expected of ["canvas: '#242321'", "accent: '#C18A3D'", "text: '#F3F0EA'", "shellRadius: '4px'", "widgetRadius: '4px'", "buttonRadius: '4px'"]) {
    assert.match(referenceDriver, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(referenceDriver, /#2C2938|#84008E|#FFFFFF|Radius: '0px'/);
  assert.match(ledgerText, /neutral graphite\/ash surfaces/i);
  assert.match(ledgerText, /later approved palette correction/i);
  assert.match(ledgerText, /no purple\s+or magenta/i);
  assert.doesNotMatch(ledgerText, /charcoal-plum|purple selection|magenta ambient/i);
});

test('Ash & Amber baseline and ledger freeze every reviewed scenario without a waiver', async () => {
  const [{ ASH_AMBER_SCENARIOS }, { parseDiscrepancyLedger, validateDiscrepancyLedger }] = await Promise.all([
    import('../conformance/manifest.ts'),
    import('../conformance/ledger.ts')
  ]);
  const [baseline, ledgerText] = await Promise.all([
    readFile(path.join(repositoryRoot, 'tests/conformance/baselines/ash-amber-target.json'), 'utf8').then(JSON.parse),
    readFile(path.join(repositoryRoot, 'docs/conformance/ash-amber-ledger.md'), 'utf8')
  ]);
  assert.equal(baseline.schemaVersion, 'pomegranate.ui.conformance-baseline.v1');
  assert.equal(baseline.authoritySha256, '6403a7bcfd8f43195fa42c5d9715cc79964c8b7569f47c22fdeefd1b89804997');
  assert.deepEqual(Object.keys(baseline.scenarios), ASH_AMBER_SCENARIOS.map(({ id }) => id));
  assert.equal(Object.values(baseline.scenarios).every(({ pass }) => pass === true), true);
  const ledger = parseDiscrepancyLedger(ledgerText);
  assert.deepEqual(validateDiscrepancyLedger(ledger, ASH_AMBER_SCENARIOS).entries, []);
});
