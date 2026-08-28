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
  'packages/svelte/README.md',
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
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue;
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

test('root check composes every native and preservation gate in the approved order', async () => {
  const rootPackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(
    rootPackage.scripts.check,
    'npm run test:unit && npm run typecheck && npm run test:native && npm run build && npm run check:extraction && npm run check:recipes && npm run report && npm run test:pack && npm run test:browser'
  );
});

test('repository carries cross-platform native toolkit and preservation CI', async () => {
  const workflow = await readFile(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(workflow, /^name:\s*Native toolkit and preservation CI/m);
  assert.match(workflow, /node-version:\s*24/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /os:\s*\[ubuntu-latest, windows-latest\]/);
  assert.match(workflow, /playwright install --with-deps chromium/);
  assert.match(workflow, /playwright install chromium/);
  assert.match(workflow, /if:\s*failure\(\)/);
  assert.match(workflow, /playwright-report\//);
  assert.match(workflow, /test-results\//);
  for (const line of workflow.split(/\r?\n/).filter((value) => /^\s*uses:/.test(value))) {
    assert.match(line, /@[a-f0-9]{40}(?:\s+#.*)?$/, line);
  }
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
  assert.match(readme, /@pomegranate-ui\/contracts/);
  assert.match(readme, /private incubator/i);
  assert.match(readme, /contracts\s*->\s*layout\s*->\s*core\s*->\s*svelte/i);
  assert.match(readme, /source-owned recipes/i);
  assert.match(readme, /npm\.cmd run dev:lab/);
  assert.match(readme, /127\.0\.0\.1:5173/);
  assert.match(readme, /127\.0\.0\.1:4174/);
  assert.match(readme, /apps\/workbench-lab\/dist/);
});

test('root verification docs match scripts and record unpublished, uncut boundaries', async () => {
  const rootPackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  for (const document of ['README.md', 'AGENTS.md']) {
    const source = await readFile(path.join(root, document), 'utf8');
    for (const script of [
      'test:unit',
      'typecheck',
      'test:native',
      'build',
      'check:extraction',
      'report',
      'test:pack',
      'test:browser',
      'check'
    ]) {
      assert.equal(typeof rootPackage.scripts[script], 'string', script);
      assert.match(source, new RegExp(`npm\\.cmd run ${script.replace(':', '\\:')}`), `${document}: ${script}`);
    }
    assert.match(source, /npm package publication has not occurred/i, document);
    assert.match(source, /Sonder cutover has not occurred/i, document);
  }
});

test('package and example documentation preserves the adopter boundary', async () => {
  for (const packageName of ['contracts', 'core', 'layout', 'svelte', 'testkit', 'theme']) {
    const readme = await readFile(path.join(root, 'packages', packageName, 'README.md'), 'utf8');
    assert.match(readme, new RegExp(`@pomegranate-ui/${packageName}`));
    assert.doesNotMatch(readme, /reserved for Tranche 3/i);
  }

  const themeReadme = await readFile(path.join(root, 'packages', 'theme', 'README.md'), 'utf8');
  assert.match(themeReadme, /framework-neutral/i);
  assert.match(themeReadme, /declarative/i);
  assert.match(themeReadme, /adopter/i);
  assert.match(themeReadme, /does not bundle.*preset/i);

  for (const exampleName of ['mock-roleplay-backend', 'sonder-integration']) {
    const readme = await readFile(path.join(root, 'examples', exampleName, 'README.md'), 'utf8');
    assert.match(readme, /must not import Sonder server code/i);
  }
});

test('Tranche 3 exposes strict separately packable packages', async () => {
  const rootPackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.deepEqual(rootPackage.workspaces, ['packages/*', 'apps/*', 'examples/*']);
  for (const script of ['typecheck', 'test:native', 'build']) {
    assert.equal(typeof rootPackage.scripts[script], 'string', script);
  }

  for (const name of ['contracts', 'layout', 'core', 'svelte', 'testkit', 'theme']) {
    const packageRoot = path.join(root, 'packages', name);
    const manifest = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
    assert.equal(manifest.name, `@pomegranate-ui/${name}`);
    assert.equal(manifest.version, '0.1.0-private.0');
    assert.equal(manifest.private, true);
    assert.equal(manifest.type, 'module');
    assert.deepEqual(manifest.files, ['dist', 'README.md']);
    assert.ok(manifest.exports['.']);
    assert.equal((await stat(path.join(packageRoot, 'tsconfig.json'))).isFile(), true);
    assert.equal((await stat(path.join(packageRoot, 'src', 'index.ts'))).isFile(), true);
  }
});

test('framework-neutral packages do not import a view framework or DOM', async () => {
  for (const name of ['contracts', 'layout', 'core', 'theme']) {
    const files = (await walk(path.join(root, 'packages', name, 'src')))
      .filter((file) => /\.(?:ts|tsx)$/.test(file));
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      assert.doesNotMatch(source, /(?:from\s+|import\s*\()['"]react(?:\/[^'"]*)?['"]/);
      assert.doesNotMatch(source, /(?:from\s+|import\s*\()['"]svelte(?:\/[^'"]*)?['"]/);
      assert.doesNotMatch(source, /\b(?:document|window|HTMLElement|Element)\b/);
    }
  }
});

test('active-source scans exclude generated package output', async () => {
  const files = await walk(path.join(root, 'packages'));
  assert.equal(files.some((file) => file.split(path.sep).includes('dist')), false);
});

test('visual baselines are canonical on Windows while functional browser coverage remains cross-platform', async () => {
  const visual = await readFile(path.join(root, 'tests', 'browser', 'native-workbench-visual.spec.ts'), 'utf8');
  const workflow = await readFile(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(visual, /test\.skip\(process\.platform !== 'win32'/);
  assert.match(workflow, /os:\s*\[ubuntu-latest, windows-latest\]/);
  assert.match(workflow, /npm run check/);
});

test('active repository configuration contains no retired React view layer', async () => {
  const activeFiles = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'tsconfig.tests.json',
    'vitest.config.ts',
    'README.md',
    'AGENTS.md',
    'scripts/verify-packed-consumers.mjs'
  ];
  for (const area of ['packages', 'apps', 'examples']) {
    for (const file of await walk(path.join(root, area))) {
      if (/\.(?:json|mjs|ts|tsx|svelte|md)$/.test(file)) activeFiles.push(path.relative(root, file));
    }
  }
  const forbidden = /@pomegranate-ui\/react|@testing-library\/react|@types\/react(?:-dom)?|@vitejs\/plugin-react|(?:^|["'\/])react-dom(?:["'\/]|$)|(?:^|["'\/])react(?:["'\/]|$)/m;
  for (const relativePath of activeFiles) {
    const source = await readFile(path.join(root, relativePath), 'utf8');
    assert.doesNotMatch(source, forbidden, relativePath.replaceAll('\\', '/'));
  }
});
