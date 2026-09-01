import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'dist' || entry.name === 'node_modules') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function importSpecifiers(source) {
  const specifiers = [];
  const pattern = /(?:\bfrom\s*|\bimport\s*\()(['"])([^'"]+)\1/g;
  for (const match of source.matchAll(pattern)) specifiers.push(match[2]);
  return specifiers;
}

test('packed consumer fixtures and verifier are executable repository contracts', async () => {
  for (const relativePath of [
    'examples/mock-roleplay-backend/package.json',
    'examples/mock-roleplay-backend/tsconfig.json',
    'examples/mock-roleplay-backend/src/index.ts',
    'examples/mock-roleplay-backend/src/index.test.ts',
    'scripts/verify-packed-consumers.mjs'
  ]) {
    assert.equal((await stat(path.join(root, relativePath))).isFile(), true, relativePath);
  }

  const rootPackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(rootPackage.scripts['test:pack'], 'node scripts/verify-packed-consumers.mjs');
  for (const exampleName of ['mock-roleplay-backend']) {
    const manifest = JSON.parse(await readFile(path.join(root, 'examples', exampleName, 'package.json'), 'utf8'));
    assert.equal(manifest.scripts.build, 'tsc -p tsconfig.json --pretty false');
    assert.doesNotMatch(manifest.scripts.build, /\.\./);
  }
});

test('packed verifier proves an isolated Svelte recipe consumer', async () => {
  const verifier = await readFile(path.join(root, 'scripts', 'verify-packed-consumers.mjs'), 'utf8');
  for (const expected of [
    "'contracts', 'theme', 'layout', 'core', 'svelte', 'testkit'",
    "'@pomegranate-ui/theme'",
    'resolveTheme',
    "consumer-svelte-recipes",
    "verify-recipes.mjs",
    "--copy', 'all', '--to",
    "svelte-check",
    "vite",
    "renderer-conformance.test.ts",
    "PanelTabs.svelte",
    "WidgetCatalog.svelte",
    "WidgetFrame.svelte",
    "WorkbenchSurface.svelte",
    "RendererState.svelte",
    "createPackedRendererHarness",
    "assertLocalResolutions",
    "onreorderrequest={openPanelOrder}",
    "data-panel-order-surface",
    "Move ${tab.name} up",
    "Move ${tab.name} down",
    "setupFiles",
    "scrollIntoView"
  ]) assert.match(verifier, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), expected);
  assert.doesNotMatch(verifier, /renderer-dom-harness\.mjs/);
  assert.doesNotMatch(verifier, /defaultPlacement: \{ kind: 'docked', edge|panelId, edge/);
  assert.match(verifier, /regionRole: 'stage'/);
  assert.match(verifier, /panelId, regionId/);
  assert.match(verifier, /data-pomegranate-region-surface/);
  assert.doesNotMatch(verifier, /data-pomegranate-dock=/);
  assert.doesNotMatch(verifier, /Move \$\{operation\.name\} \$\{operation\.direction\}/);
  assert.match(verifier, /const temporaryBase = await realpath\(os\.tmpdir\(\)\)/);
  assert.match(verifier, /mkdtemp\(path\.join\(temporaryBase, 'pomegranate-ui-pack-'\)\)/);
  assert.doesNotMatch(verifier, /path\.resolve\(os\.tmpdir\(\)\)/);

  const manifest = JSON.parse(await readFile(path.join(root, 'registry', 'recipes', 'recipe-manifest.json'), 'utf8'));
  assert.equal(manifest.schema, 'pomegranate.ui.recipes.v1');
  assert.equal(manifest.recipes.length, 8);
  for (const recipe of manifest.recipes) {
    assert.ok(recipe.files.length > 0, recipe.id);
    assert.deepEqual(Object.keys(recipe.sha256), recipe.files, recipe.id);
    for (const hash of Object.values(recipe.sha256)) assert.match(hash, /^[A-F0-9]{64}$/, recipe.id);
  }
});

test('external non-preset fixture uses public theme APIs without requiring prebuilt workspace output', async () => {
  const consumer = await readFile(path.join(root, 'tests', 'fixtures', 'external-theme-consumer.mjs'), 'utf8');
  const definition = await readFile(path.join(root, 'tests', 'fixtures', 'external-theme.ts'), 'utf8');
  assert.match(consumer, /from '@pomegranate-ui\/theme'/);
  assert.match(consumer, /compileCanvasLayers/);
  assert.match(consumer, /compileThemeBindings/);
  assert.match(consumer, /compileThemeStyleSheet/);
  assert.match(consumer, /resolveThemeV2/);
  assert.doesNotMatch(consumer, /(?:^|\/)packages\/[^/]+\/src(?:\/|$)/);
  assert.match(definition, /id: 'copper-terminal-fixture'/);
  assert.match(definition, /shape: 'square'/);
  assert.match(definition, /family: 'Pomegranate Mono'/);
});

test('package and example imports remain public, relative, and repository-neutral', async () => {
  for (const area of ['packages', 'examples']) {
    const files = (await walk(path.join(root, area))).filter((file) => /\.(?:mjs|ts|tsx)$/.test(file));
    for (const file of files) {
      const relative = path.relative(root, file).replaceAll('\\', '/');
      const source = await readFile(file, 'utf8');
      assert.doesNotMatch(source, /(?:from\s+|import\s*\()['"]@sveltejs\/kit(?:\/[^'"]*)?['"]/, relative);
      assert.doesNotMatch(source, /(?:^|['"(\s])[A-Za-z]:[\\/]/m, relative);
      for (const specifier of importSpecifiers(source)) {
        assert.doesNotMatch(specifier, /^@pomegranate-ui\/[^/]+\/src(?:\/|$)/, `${relative}: ${specifier}`);
        assert.doesNotMatch(specifier, /(?:^|\/)packages\/[^/]+\/src(?:\/|$)/, `${relative}: ${specifier}`);
        if (relative.startsWith('examples/')) {
          assert.equal(specifier.startsWith('..'), false, `${relative}: escaping import ${specifier}`);
        }
      }
    }
  }
});
