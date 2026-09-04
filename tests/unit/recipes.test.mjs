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
    'icon-action',
    'panel-tabs',
    'sub-panel-navigation',
    'theme-settings',
    'widget-catalog',
    'widget-frame',
    'workbench-surface'
  ]);
  for (const entry of manifest.recipes) {
    const revised = { 'theme-settings': 6, 'workbench-surface': 2 };
    assert.equal(entry.revision, revised[entry.id] ?? 1);
    assert.equal(entry.compatiblePomegranateRange, '>=0.1.0-private.0 <0.2.0');
    assert.ok(entry.dependencies.includes('svelte'));
    assert.ok(entry.rendererContractIds.length > 0);
    assert.deepEqual(Object.keys(entry.sha256), entry.files);
    assert.ok(entry.files.every((file) => !file.includes('\\')));
    assert.ok(Object.values(entry.sha256).every((hash) => /^[0-9A-F]{64}$/.test(hash)));
    const owned = (await readdir(path.join(root, 'registry', 'recipes', entry.id)))
      .filter((file) => file.endsWith('.svelte') || file.endsWith('.ts'))
      .sort();
    assert.deepEqual(owned, [...entry.files].sort());
  }
  const required = new Set(manifest.recipes.flatMap((entry) => entry.rendererContractIds));
  assert.equal(required.size, 8);
});

test('recipe check mode validates actual source hashes', () => {
  const result = run(['--check']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Recipe registry verified: 8 recipes, 28 files\./);
});

test('theme authoring recipe exposes six focused elements through one shared port', async () => {
  const recipeRoot = path.join(root, 'registry', 'recipes', 'theme-settings');
  const expected = ['AmbientLight.svelte', 'AmbientPosition.svelte', 'ColorPlane.svelte', 'CustomTheme.svelte', 'HueControl.svelte', 'ThemeAuthoringTypes.ts', 'ThemeCanvasSettings.svelte', 'ThemeColors.svelte', 'ThemeMaterials.svelte', 'ThemeTypography.svelte'];
  assert.deepEqual((await readdir(recipeRoot)).sort(), expected);
  const combined = (await Promise.all(expected.map((file) => readFile(path.join(recipeRoot, file), 'utf8')))).join('\n');
  for (const element of ['overview', 'colors', 'materials', 'canvas', 'ambient', 'typography']) {
    assert.match(combined, new RegExp(`data-theme-authoring-element="${element}"`));
  }
  assert.match(combined, /toolbarTogglePresentation/);
  assert.match(combined, /Bottom-edge chevrons/);
  assert.doesNotMatch(combined, /presentation\s*[=:]|compact-theme|theme-settings-owner/);
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

test('copy-owned Workbench recipes carry optional host title and metadata presentation', async () => {
  const widgetFrame = await readFile(path.join(root, 'registry', 'recipes', 'widget-frame', 'WidgetFrame.svelte'), 'utf8');
  assert.match(widgetFrame, /title\?: string/);
  assert.match(widgetFrame, /meta\?: string/);
  assert.match(widgetFrame, /class="widget-frame-meta"/);

  for (const file of ['WorkbenchSurface.svelte', 'PanelTemplateSurface.svelte', 'DockRegion.svelte', 'DockShelf.svelte', 'WidgetGroup.svelte']) {
    const source = await readFile(path.join(root, 'registry', 'recipes', 'workbench-surface', file), 'utf8');
    assert.match(source, /titleFor/, `${file} does not carry the host title resolver.`);
  }
  const group = await readFile(path.join(root, 'registry', 'recipes', 'workbench-surface', 'WidgetGroup.svelte'), 'utf8');
  assert.match(group, /titleFor\?\.\(frame\) \?\? frame\.title/);
  const columnResize = await readFile(path.join(root, 'registry', 'recipes', 'workbench-surface', 'ColumnResizeHandle.svelte'), 'utf8');
  const rowResize = await readFile(path.join(root, 'registry', 'recipes', 'workbench-surface', 'WidgetRowResizeHandle.svelte'), 'utf8');
  assert.match(columnResize, /sub-panel\.resize-columns/);
  assert.match(columnResize, /onpointercancel=\{pointerFinish\}/);
  assert.match(rowResize, /widget\.resize-row/);
  assert.match(rowResize, /ondblclick=\{\(\) => commit\(null\)\}/);
});

test('copy-owned navigation recipes expose semantic rails and host-owned actions', async () => {
  const panelTabs = await readFile(path.join(root, 'registry', 'recipes', 'panel-tabs', 'PanelTabs.svelte'), 'utf8');
  const subPanelBar = await readFile(path.join(root, 'registry', 'recipes', 'sub-panel-navigation', 'SubPanelBar.svelte'), 'utf8');
  const subPanelDialog = await readFile(path.join(root, 'registry', 'recipes', 'sub-panel-navigation', 'SubPanelDialog.svelte'), 'utf8');

  for (const [name, source] of [['PanelTabs', panelTabs], ['SubPanelBar', subPanelBar]]) {
    assert.match(source, /data-tab-rail-shell/, `${name} is missing the semantic rail shell.`);
    assert.match(source, /data-tab-rail-scroll/, `${name} is missing the semantic rail scroll owner.`);
    assert.match(source, /data-tab-rail-edge="before"/, `${name} is missing its before cue.`);
    assert.match(source, /data-tab-rail-edge="after"/, `${name} is missing its after cue.`);
    assert.match(source, /onactivate\?:/, `${name} does not expose host activation.`);
    assert.match(source, /oncontextrequest\?:/, `${name} does not expose exact-target host context.`);
    assert.match(source, /onreorderrequest\?:/, `${name} does not expose explicit host reorder.`);
    assert.doesNotMatch(source, /role="listbox"|data-sub-panel-selector-trigger|data-sub-panel-actions-trigger|•••/);
    assert.doesNotMatch(source, /type:\s*['"](?:panel|sub-panel)\.reorder['"]/);
    assert.doesNotMatch(source, /TabRailController|apps\/workbench-lab|deep-current|pom-neutral|bunny|ash-amber/);
    assert.doesNotMatch(source, /scrollIntoView/, `${name} must reveal only through its rail scroll owner.`);
    assert.match(source, /getBoundingClientRect\(\)/, `${name} is missing rail-local reveal geometry.`);
    assert.match(source, /tablist\.scrollLeft/, `${name} is missing rail-local scroll ownership.`);
    assert.match(source, /\{#if tab\.selected && oncontextrequest\}[\s\S]*data-(?:panel|sub-panel)-tab-actions-trigger/,
      `${name} is missing its one active-tab action trigger.`);
    assert.match(source, /aria-haspopup="dialog"/, `${name} is missing the action trigger popup contract.`);
    assert.match(source, /@media \(pointer: coarse\)/, `${name} does not limit its action trigger to coarse pointers.`);
    assert.doesNotMatch(source, /press and hold|long[ -]press/i, `${name} still advertises a touch hold gesture.`);
  }

  assert.match(panelTabs, /oncontextrequest\?\.\(\{[\s\S]*panelId: tab\.panelId/);
  assert.match(subPanelBar, /oncontextrequest\?\.\(\{[\s\S]*panelId: panel\.id,[\s\S]*subPanelId: tab\.subPanelId/);
  assert.match(subPanelDialog, /invokingTab\?: HTMLElement/);
  assert.match(subPanelDialog, /onclose=\{restoreFocus\}/);
  assert.match(subPanelDialog, /\[data-pomegranate-panel-tab="\$\{CSS\.escape\(panel\.id\)\}"\] \[role="tab"\]/);
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
