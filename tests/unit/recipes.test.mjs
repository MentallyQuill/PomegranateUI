import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..', '..');
const manifestPath = path.join(root, 'registry', 'recipes', 'recipe-manifest.json');
const verifierPath = path.join(root, 'scripts', 'verify-recipes.mjs');
const temporaryRoots = [];

test.after(async () => {
  await Promise.all(temporaryRoots.map((entry) => rm(entry, { recursive: true, force: true })));
});

function run(args) {
  return spawnSync(process.execPath, [verifierPath, ...args], {
    cwd: root,
    encoding: 'utf8'
  });
}

test('recipe registry is deterministic, source-owned, and renderer-contract complete', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.equal(manifest.schema, 'pomegranate.ui.recipes.v1');
  assert.deepEqual(manifest.recipes.map((entry) => entry.id), [
    'error-state',
    'panel-tabs',
    'widget-catalog',
    'widget-frame',
    'workbench-surface'
  ]);
  for (const entry of manifest.recipes) {
    assert.equal(entry.revision, 1);
    assert.equal(entry.compatiblePomegranateRange, '>=0.1.0-private.0 <0.2.0');
    assert.ok(entry.dependencies.includes('svelte'));
    assert.ok(entry.rendererContractIds.length > 0);
    assert.deepEqual(Object.keys(entry.sha256), entry.files);
    assert.ok(entry.files.every((file) => !file.includes('\\')));
    assert.ok(Object.values(entry.sha256).every((hash) => /^[0-9A-F]{64}$/.test(hash)));
    const owned = (await readdir(path.join(root, 'registry', 'recipes', entry.id)))
      .filter((file) => file.endsWith('.svelte'))
      .sort();
    assert.deepEqual(owned, [...entry.files].sort());
  }
  const required = new Set(manifest.recipes.flatMap((entry) => entry.rendererContractIds));
  assert.equal(required.size, 8);
});

test('recipe check mode validates actual source hashes', () => {
  const result = run(['--check']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Recipe registry verified: 5 recipes, 5 files\./);
});

test('recipe copy is clean and refuses to overwrite adopter edits', async () => {
  const target = await mkdtemp(path.join(tmpdir(), 'pomegranate-recipes-'));
  temporaryRoots.push(target);
  const copied = run(['--copy', 'panel-tabs', '--to', target]);
  assert.equal(copied.status, 0, copied.stderr || copied.stdout);
  const destination = path.join(target, 'PanelTabs.svelte');
  assert.match(await readFile(destination, 'utf8'), /data-pomegranate-panel-tab/);
  await writeFile(destination, '<!-- adopter edit -->\n');
  const refused = run(['--copy', 'panel-tabs', '--to', target]);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /RECIPE_DESTINATION_MODIFIED: PanelTabs\.svelte/);
});

test('recipe hashes treat LF and CRLF as the same source-owned text', async () => {
  const target = await mkdtemp(path.join(tmpdir(), 'pomegranate-recipes-eol-'));
  temporaryRoots.push(target);
  const copied = run(['--copy', 'panel-tabs', '--to', target]);
  assert.equal(copied.status, 0, copied.stderr || copied.stdout);

  const destination = path.join(target, 'PanelTabs.svelte');
  const original = await readFile(destination, 'utf8');
  const alternate = original.includes('\r\n')
    ? original.replaceAll('\r\n', '\n')
    : original.replaceAll('\n', '\r\n');
  assert.notEqual(alternate, original);
  await writeFile(destination, alternate);

  const refreshed = run(['--copy', 'panel-tabs', '--to', target]);
  assert.equal(refreshed.status, 0, refreshed.stderr || refreshed.stdout);
});

test('recipe copy preflights every destination before writing an upgrade', async () => {
  const target = await mkdtemp(path.join(tmpdir(), 'pomegranate-recipes-transaction-'));
  temporaryRoots.push(target);
  const copied = run(['--copy', 'all', '--to', target]);
  assert.equal(copied.status, 0, copied.stderr || copied.stdout);

  const panelTabsPath = path.join(target, 'PanelTabs.svelte');
  const guardedPath = path.join(target, 'WorkbenchSurface.svelte');
  const recordPath = path.join(target, '.pomegranate-recipes.json');
  const olderPanelTabs = '<!-- previously installed PanelTabs -->\n';
  await writeFile(panelTabsPath, olderPanelTabs);
  await writeFile(guardedPath, '<!-- adopter-owned WorkbenchSurface edit -->\n');
  const record = JSON.parse(await readFile(recordPath, 'utf8'));
  record.recipes['panel-tabs'].files['PanelTabs.svelte'] = createHash('sha256')
    .update(olderPanelTabs)
    .digest('hex')
    .toUpperCase();
  await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`);
  const recordBefore = await readFile(recordPath, 'utf8');

  const refused = run(['--copy', 'all', '--to', target]);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /RECIPE_DESTINATION_MODIFIED: WorkbenchSurface\.svelte/);
  assert.equal(await readFile(panelTabsPath, 'utf8'), olderPanelTabs);
  assert.equal(await readFile(recordPath, 'utf8'), recordBefore);
});
