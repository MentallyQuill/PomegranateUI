import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const packageNames = ['contracts', 'core', 'layout', 'svelte', 'testkit', 'theme'];
const retiredHostName = new RegExp(['son', 'der'].join(''), 'i');
const ignoredDirectories = new Set([
  '.git',
  '.worktrees',
  '.codex-remote-attachments',
  '.codex-worktree-recovery',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results'
]);

function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: root })
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

async function repositoryManifests() {
  const manifests = [
    'package.json',
    'apps/workbench-lab/package.json',
    'examples/mock-roleplay-backend/package.json',
    ...packageNames.map((name) => `packages/${name}/package.json`)
  ];
  return Promise.all(manifests.map(async (relativePath) => ({
    relativePath,
    value: JSON.parse(await readFile(path.join(root, relativePath), 'utf8'))
  })));
}

test('tracked source tree contains no retired host-specific material', async () => {
  for (const relativePath of trackedFiles()) {
    assert.doesNotMatch(relativePath, retiredHostName, relativePath);
    const contents = await readFile(path.join(root, relativePath));
    if (contents.subarray(0, 8192).includes(0)) continue;
    assert.doesNotMatch(contents.toString('utf8'), retiredHostName, relativePath);
  }
});

test('repository reserves every public toolkit area', async () => {
  const readmes = [
    'apps/workbench-lab/README.md',
    'apps/documentation/README.md',
    'design/foundations/README.md',
    'design/widget-specifications/README.md',
    'examples/mock-roleplay-backend/README.md',
    ...packageNames.map((name) => `packages/${name}/README.md`),
    'registry/widgets/README.md'
  ];
  for (const relativePath of readmes) {
    assert.equal((await stat(path.join(root, relativePath))).isFile(), true, relativePath);
  }
});

test('root check composes only public native gates', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(
    manifest.scripts.check,
    'npm run test:unit && npm run typecheck && npm run test:native && npm run build && npm run check:lab-dist && npm run check:recipes && npm run test:pack && npm run test:browser'
  );
  for (const retiredScript of ['check:extraction', 'report', 'test:conformance', 'inspect:conformance']) {
    assert.equal(manifest.scripts[retiredScript], undefined, retiredScript);
  }
});

test('repository-owned packages declare the MentallyQuill MIT license', async () => {
  const license = await readFile(path.join(root, 'LICENSE'), 'utf8');
  assert.match(license, /^MIT License\r?\n/);
  assert.match(license, /Copyright \(c\) 2026 MentallyQuill/);
  for (const { relativePath, value } of await repositoryManifests()) {
    assert.equal(value.license, 'MIT', relativePath);
  }
  assert.equal((await stat(path.join(root, 'THIRD_PARTY_NOTICES.md'))).isFile(), true);
});

test('cross-platform CI deploys the verified static Lab through GitHub Pages', async () => {
  const workflow = await readFile(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(workflow, /^name:\s*Native toolkit CI/m);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /os:\s*\[ubuntu-latest, windows-latest\]/);
  assert.match(workflow, /publish-demo:/);
  assert.match(workflow, /needs:\s*verification/);
  assert.match(workflow, /github\.event\.repository\.visibility == 'public'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /path:\s*apps\/workbench-lab\/dist/);
  assert.match(workflow, /actions\/configure-pages@/);
  assert.match(workflow, /actions\/upload-pages-artifact@/);
  assert.match(workflow, /actions\/deploy-pages@/);
  for (const line of workflow.split(/\r?\n/).filter((value) => /^\s*uses:/.test(value))) {
    assert.match(line, /@[a-f0-9]{40}(?:\s+#.*)?$/, line);
  }
});

test('public documentation keeps the toolkit boundary and demo contract', async () => {
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  for (const expected of [
    /developer toolkit/i,
    /not an application frontend/i,
    /AI roleplay frontends/i,
    /@pomegranate-ui\/contracts/,
    /contracts\s*->\s*layout\s*->\s*core\s*->\s*svelte/i,
    /source-owned recipes/i,
    /npm\.cmd run dev:lab/,
    /apps\/workbench-lab\/dist/,
    /https:\/\/mentallyquill\.github\.io\/PomegranateUI\//,
    /MIT/i
  ]) assert.match(readme, expected);
  assert.doesNotMatch(readme, /private incubator/i);
});

test('packages stay strict, private-to-npm, and independently packable', async () => {
  for (const name of packageNames) {
    const packageRoot = path.join(root, 'packages', name);
    const manifest = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
    assert.equal(manifest.name, `@pomegranate-ui/${name}`);
    assert.equal(manifest.version, '0.1.0-private.0');
    assert.equal(manifest.private, true);
    assert.equal(manifest.type, 'module');
    assert.equal(manifest.license, 'MIT');
    assert.deepEqual(manifest.files, ['dist', 'README.md']);
    assert.ok(manifest.exports['.']);
    assert.equal((await stat(path.join(packageRoot, 'tsconfig.json'))).isFile(), true);
    assert.equal((await stat(path.join(packageRoot, 'src', 'index.ts'))).isFile(), true);
  }
});

test('framework-neutral packages do not import view frameworks or DOM globals', async () => {
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

test('visual baselines stay Windows-canonical while functional CI is cross-platform', async () => {
  const visual = await readFile(path.join(root, 'tests', 'browser', 'native-workbench-visual.spec.ts'), 'utf8');
  const workflow = await readFile(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(visual, /test\.skip\(process\.platform !== 'win32'/);
  assert.match(workflow, /os:\s*\[ubuntu-latest, windows-latest\]/);
  assert.match(workflow, /npm run check/);
});

test('active repository configuration contains no React view layer', async () => {
  const activeFiles = [
    'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.tests.json',
    'vitest.config.ts', 'README.md', 'AGENTS.md', 'scripts/verify-packed-consumers.mjs'
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
