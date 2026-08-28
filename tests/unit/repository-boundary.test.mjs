import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const reservedReadmes = [
  'apps/workbench-lab/README.md',
  'apps/documentation/README.md',
  'design/foundations/README.md',
  'design/widget-specifications/README.md',
  'examples/mock-roleplay-backend/README.md',
  'examples/sonder-integration/README.md',
  'packages/contracts/README.md',
  'packages/core/README.md',
  'packages/layout/README.md',
  'packages/react/README.md',
  'packages/testkit/README.md',
  'packages/theme/README.md',
  'prototypes/sonder-baseline/README.md',
  'provenance/README.md',
  'registry/widgets/README.md'
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

test('repository reserves every approved toolkit area', async () => {
  for (const relativePath of reservedReadmes) {
    assert.equal((await stat(path.join(root, relativePath))).isFile(), true, relativePath);
  }
});

test('repository carries a preservation CI workflow', async () => {
  const workflow = await readFile(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(workflow, /node-version:\s*24/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /contents:\s*read/);
});

test('Git never normalizes byte-preserved evidence paths', async () => {
  const attributes = await readFile(path.join(root, '.gitattributes'), 'utf8');
  for (const pattern of [
    '/design/foundations/sonder-ui-bible/** -text',
    '/design/widget-specifications/sonder-panels-and-widgets/** -text',
    '/prototypes/sonder-baseline/** -text',
    '/provenance/SONDER_LICENSE.txt -text',
    '/provenance/assets/** -text',
    '/provenance/sonder-design/** -text',
    '/provenance/sonder-guides/** -text',
    '/provenance/sonder-plans-and-specs/** -text',
    '/provenance/extraction-ledger.md -text',
    '/provenance/migration-report.md -text',
    '/provenance/preserved-harness-cases.json -text'
  ]) assert.ok(attributes.split(/\r?\n/).includes(pattern), pattern);
});

test('root documentation keeps PomegranateUI a toolkit rather than an application frontend', async () => {
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /developer toolkit/i);
  assert.match(readme, /not an application frontend/i);
  assert.match(readme, /legacy evidence lane/i);
  assert.match(readme, /native toolkit lane/i);
  assert.match(readme, /TypeScript begins in Tranche 3/i);
});

test('package and example boundaries do not claim unimplemented production code', async () => {
  const packageNames = ['contracts', 'core', 'layout', 'react', 'testkit', 'theme'];
  for (const packageName of packageNames) {
    const readme = await readFile(path.join(root, 'packages', packageName, 'README.md'), 'utf8');
    assert.match(readme, new RegExp(`@pomegranate-ui/${packageName}`));
    assert.match(readme, /reserved for Tranche 3/i);
  }

  for (const exampleName of ['mock-roleplay-backend', 'sonder-integration']) {
    const readme = await readFile(path.join(root, 'examples', exampleName, 'README.md'), 'utf8');
    assert.match(readme, /must not import Sonder server code/i);
  }
});

test('Tranches 0-2 contain no production TypeScript implementation', async () => {
  const files = await walk(root);
  const productionTypeScript = files.filter((file) => {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    return !relative.startsWith('tests/') && /\.(?:ts|tsx)$/.test(relative);
  });
  assert.deepEqual(productionTypeScript, []);
});
