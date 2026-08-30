import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const allowedParts = new Set([
  'canvas.surface', 'chrome.shelf', 'chrome.context', 'dock.surface', 'panel.surface', 'group.surface',
  'widget.surface', 'widget.header', 'widget.content', 'widget.actions', 'row.surface', 'separator',
  'field.surface', 'button.surface', 'button.icon', 'menu.surface', 'dialog.surface', 'floating.surface',
  'slider.input', 'slider.track', 'slider.fill', 'slider.thumb'
]);

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return ['.css', '.svelte', '.ts'].includes(extname(entry.name)) ? [path] : [];
  });
}

function semanticPartLiterals(source) {
  return [
    ...source.matchAll(/data-pom-part=["']([^"']+)["']/g),
    ...source.matchAll(/\bsurfacePart\s*=\s*["']([^"']+)["']/g)
  ].map((match) => match[1]);
}

test('production theme consumers contain no concrete theme-id selectors', () => {
  const files = [
    ...sourceFiles(join(root, 'apps', 'workbench-lab', 'src')),
    ...sourceFiles(join(root, 'registry', 'recipes'))
  ];
  const violations = files.flatMap((path) => {
    const source = readFileSync(path, 'utf8');
    return /\[data-pom-theme\s*=/.test(source) ? [relative(root, path)] : [];
  });
  assert.deepEqual(violations, []);
});

test('Pom-owned Svelte recipes use only the public semantic part vocabulary', () => {
  const files = [
    ...sourceFiles(join(root, 'apps', 'workbench-lab', 'src', 'recipes')),
    ...sourceFiles(join(root, 'registry', 'recipes'))
  ].filter((path) => extname(path) === '.svelte');
  const seen = new Set();
  const invalid = [];
  for (const path of files) {
    const source = readFileSync(path, 'utf8');
    for (const part of semanticPartLiterals(source)) {
      if (!allowedParts.has(part)) invalid.push(`${relative(root, path)}:${part}`);
      seen.add(part);
    }
  }
  assert.deepEqual(invalid, []);
  for (const required of [
    'canvas.surface', 'dock.surface', 'group.surface', 'widget.surface', 'widget.header',
    'widget.content', 'widget.actions', 'button.icon', 'menu.surface'
  ]) assert.ok(seen.has(required), `missing recipe annotation for ${required}`);
});

test('semantic part audit recognizes typed optional-prop defaults', () => {
  const source = `<script lang="ts">let { surfacePart = 'dock.surface' }: { surfacePart?: 'dock.surface' | null } = $props();</script>
    <section data-pom-part={surfacePart ?? undefined}></section>`;
  assert.deepEqual(semanticPartLiterals(source), ['dock.surface']);
});

test('the fixed compiler owns a rule for every allowed semantic part', () => {
  const source = readFileSync(join(root, 'packages', 'theme', 'src', 'compile.ts'), 'utf8');
  assert.match(source, /THEME_PART_IDS\.map\(partRule\)/);
  assert.doesNotMatch(source, /theme\.id/);
});

test('Lab presets are independent data-only v2 consumers of the public compiler', () => {
  const themesRoot = join(root, 'apps', 'workbench-lab', 'src', 'themes');
  assert.equal(existsSync(join(themesRoot, 'bindings.ts')), false);
  const targets = ['deep-current.ts', 'pom-neutral.ts', 'bunny.ts'];
  for (const target of targets) {
    const source = readFileSync(join(themesRoot, target), 'utf8');
    assert.match(source, /pomegranate\.ui\.theme\.v2/);
    for (const peer of targets.filter((candidate) => candidate !== target)) {
      assert.doesNotMatch(source, new RegExp(peer.replace('.ts', '').replaceAll('-', '[-_]'), 'i'), `${target} imports ${peer}`);
    }
    assert.doesNotMatch(source, /data-pom-theme|selector|cssText/);
  }
});
