import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { LEGAL_ARTIFACTS, verifyLabDist } from '../../scripts/verify-lab-dist.mjs';

async function writeFixture(root, relativePath, contents) {
  const absolute = path.join(root, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, contents);
}

async function writeLegalFixtures(root) {
  for (const [output, source] of LEGAL_ARTIFACTS) {
    const contents = `notice for ${source}`;
    await writeFixture(root, source, contents);
    await writeFixture(root, `apps/workbench-lab/dist/${output}`, contents);
  }
}

test('Pages artifact contains byte-identical licenses and notices', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'pom-lab-dist-'));
  await writeFixture(root, 'apps/workbench-lab/dist/index.html', '<!doctype html><html><head><meta name="darkreader-lock"></head></html>');
  await writeLegalFixtures(root);

  await assert.doesNotReject(verifyLabDist({ root }));
  await writeFixture(root, 'apps/workbench-lab/dist/licenses/Geist-OFL.txt', 'drifted');
  await assert.rejects(verifyLabDist({ root }), /does not match its source/);
});

test('Pages artifact prevents extensions from recoloring theme-authored surfaces', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'pom-lab-darkreader-'));
  await writeFixture(root, 'apps/workbench-lab/dist/index.html', '<!doctype html><html><head></head></html>');
  await writeLegalFixtures(root);

  await assert.rejects(verifyLabDist({ root }), /missing static Dark Reader lock/);
});

test('Pages artifact rejects inactive Dark Reader lock lookalikes', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'pom-lab-darkreader-lookalike-'));
  await writeLegalFixtures(root);
  const lookalikes = [
    ['data attribute', '<!doctype html><html><head><meta data-name="darkreader-lock"></head></html>'],
    ['comment', '<!doctype html><html><head><!-- <meta name="darkreader-lock"> --></head></html>'],
    ['script text', '<!doctype html><html><head><script>const example = `<meta name="darkreader-lock">`;</script></head></html>'],
    ['body placement', '<!doctype html><html><head></head><body><meta name="darkreader-lock"></body></html>']
  ];

  for (const [name, indexHtml] of lookalikes) {
    await t.test(name, async () => {
      await writeFixture(root, 'apps/workbench-lab/dist/index.html', indexHtml);
      await assert.rejects(verifyLabDist({ root }), /missing static Dark Reader lock/);
    });
  }
});
