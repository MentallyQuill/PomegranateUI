import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  findReferencedIconBasenames,
  importBaseline,
  listCommitFiles,
  normalizeRepoPath,
  readCommitFile,
  resolveScope,
  sha256
} from '../../scripts/lib/extraction.mjs';

const temporaryRoots = [];

test.after(async () => {
  await Promise.all(temporaryRoots.map((root) => rm(root, { recursive: true, force: true })));
});

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

async function createSourceRepository() {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'pomegranate-import-'));
  temporaryRoots.push(temporaryRoot);
  const sourceRoot = path.join(temporaryRoot, 'source');
  const destinationRoot = path.join(temporaryRoot, 'destination');
  await mkdir(path.join(sourceRoot, 'docs', 'prototype'), { recursive: true });
  await mkdir(path.join(sourceRoot, 'assets', 'icons'), { recursive: true });
  await mkdir(destinationRoot, { recursive: true });
  git(sourceRoot, ['init', '-b', 'interface']);
  git(sourceRoot, ['config', 'user.name', 'PomegranateUI Test']);
  git(sourceRoot, ['config', 'user.email', 'pomegranate@example.invalid']);
  git(sourceRoot, ['remote', 'add', 'origin', 'https://example.invalid/source.git']);

  await writeFile(path.join(sourceRoot, 'docs', 'prototype', 'oracle.html'), '<p>committed 700-test-icon.svg</p>\n');
  await writeFile(path.join(sourceRoot, 'docs', 'single.md'), 'single committed\n');
  await writeFile(path.join(sourceRoot, 'assets', 'icons', '700-test-icon.svg'), Buffer.from([0, 1, 2, 3, 255]));
  await writeFile(path.join(sourceRoot, 'assets', 'icons', 'manifest.json'), JSON.stringify({ icons: [{ filename: '700-test-icon.svg', sha256: sha256(Buffer.from([0, 1, 2, 3, 255])), licenseMetadata: 'CC0' }] }, null, 2));
  git(sourceRoot, ['add', '.']);
  git(sourceRoot, ['commit', '-m', 'fixture baseline']);
  const sourceCommit = git(sourceRoot, ['rev-parse', 'HEAD']);
  await writeFile(path.join(sourceRoot, 'docs', 'prototype', 'oracle.html'), '<p>dirty working tree</p>\n');

  const scope = {
    schemaVersion: 1,
    sourceBranch: 'interface',
    mappings: [
      { sourcePath: 'docs/prototype/', destinationPath: 'prototype/', classification: 'historical-evidence' },
      { sourcePath: 'docs/single.md', destinationPath: 'records/single.md', classification: 'toolkit-generic' },
      { sourcePath: 'assets/icons/manifest.json', destinationPath: 'records/icons/manifest.json', classification: 'asset-or-license' }
    ],
    referencedAssetRules: [{
      sourceDirectory: 'assets/icons/',
      sourceManifest: 'assets/icons/manifest.json',
      destinationDirectory: 'prototype/assets/',
      filenamePattern: '\\b\\d+-[A-Za-z0-9._-]+\\.svg\\b',
      classification: 'asset-or-license',
      licenseEvidence: ['records/icons/manifest.json']
    }]
  };
  return { destinationRoot, scope, sourceCommit, sourceRoot };
}

test('normalizes repository paths and rejects absolute or escaping paths', () => {
  assert.equal(normalizeRepoPath('.\\docs\\prototype\\oracle.html'), 'docs/prototype/oracle.html');
  for (const invalid of ['../secret', 'docs/../../secret', '/absolute', 'F:\\absolute']) {
    assert.throws(() => normalizeRepoPath(invalid), /repository-relative path/i);
  }
});

test('hashes exact bytes with lower-case SHA-256', () => {
  assert.equal(sha256(Buffer.from('pomegranate')), 'cdc56610ee59993ee752f47de6bf28086441a2b5c9a8ef0bfdcce632c760d7b2');
});

test('reads directory listings and bytes from the requested commit', async () => {
  const fixture = await createSourceRepository();
  assert.deepEqual(listCommitFiles({ sourceRoot: fixture.sourceRoot, sourceCommit: fixture.sourceCommit, sourcePath: 'docs/prototype/' }), ['docs/prototype/oracle.html']);
  assert.equal(readCommitFile({ sourceRoot: fixture.sourceRoot, sourceCommit: fixture.sourceCommit, sourcePath: 'docs/prototype/oracle.html' }).toString('utf8'), '<p>committed 700-test-icon.svg</p>\n');
});

test('resolves directory and file mappings before writing', async () => {
  const fixture = await createSourceRepository();
  const resolved = resolveScope({ sourceRoot: fixture.sourceRoot, sourceCommit: fixture.sourceCommit, scope: fixture.scope });
  assert.deepEqual(resolved.map((item) => item.destinationPath), [
    'prototype/oracle.html',
    'records/single.md',
    'records/icons/manifest.json'
  ]);
});

test('rejects missing sources and duplicate destinations', async () => {
  const fixture = await createSourceRepository();
  const missing = structuredClone(fixture.scope);
  missing.mappings.push({ sourcePath: 'missing.md', destinationPath: 'missing.md', classification: 'historical-evidence' });
  assert.throws(() => resolveScope({ sourceRoot: fixture.sourceRoot, sourceCommit: fixture.sourceCommit, scope: missing }), /missing source/i);

  const duplicate = structuredClone(fixture.scope);
  duplicate.mappings.push({ sourcePath: 'docs/single.md', destinationPath: 'records/single.md', classification: 'toolkit-generic' });
  assert.throws(() => resolveScope({ sourceRoot: fixture.sourceRoot, sourceCommit: fixture.sourceCommit, scope: duplicate }), /duplicate destination/i);
});

test('discovers referenced icon basenames without duplicates', () => {
  const files = [
    { destinationPath: 'one.html', bytes: Buffer.from('700-test-icon.svg and 701-next.svg') },
    { destinationPath: 'two.md', bytes: Buffer.from('700-test-icon.svg') }
  ];
  assert.deepEqual(findReferencedIconBasenames(files, /\b\d+-[A-Za-z0-9._-]+\.svg\b/g), ['700-test-icon.svg', '701-next.svg']);
});

test('imports committed bytes, referenced assets, hashes, and source identity', async () => {
  const fixture = await createSourceRepository();
  const manifest = await importBaseline({
    sourceRoot: fixture.sourceRoot,
    sourceCommit: fixture.sourceCommit,
    destinationRoot: fixture.destinationRoot,
    scope: fixture.scope
  });

  assert.equal(await readFile(path.join(fixture.destinationRoot, 'prototype', 'oracle.html'), 'utf8'), '<p>committed 700-test-icon.svg</p>\n');
  assert.deepEqual(await readFile(path.join(fixture.destinationRoot, 'prototype', 'assets', '700-test-icon.svg')), Buffer.from([0, 1, 2, 3, 255]));
  assert.equal(manifest.baseline.sourceCommit, fixture.sourceCommit);
  assert.equal(manifest.baseline.sourceBranch, 'interface');
  assert.equal(manifest.baseline.sourceRepository, 'https://example.invalid/source.git');
  assert.equal(manifest.artifacts.every((artifact) => artifact.sourceSha256 === artifact.destinationSha256), true);
  assert.equal(manifest.artifacts.every((artifact) => artifact.status === 'preserved-verbatim'), true);
});

test('fails before writing when a referenced icon is absent from its source manifest', async () => {
  const fixture = await createSourceRepository();
  const badCommitRoot = fixture.sourceRoot;
  await writeFile(path.join(badCommitRoot, 'docs', 'prototype', 'oracle.html'), '<p>999-missing.svg</p>\n');
  git(badCommitRoot, ['add', '.']);
  git(badCommitRoot, ['commit', '-m', 'missing referenced icon']);
  const badCommit = git(badCommitRoot, ['rev-parse', 'HEAD']);
  await assert.rejects(
    importBaseline({ sourceRoot: badCommitRoot, sourceCommit: badCommit, destinationRoot: fixture.destinationRoot, scope: fixture.scope }),
    /referenced icon.*source manifest/i
  );
  await assert.rejects(readFile(path.join(fixture.destinationRoot, 'prototype', 'oracle.html')), /ENOENT/);
});
