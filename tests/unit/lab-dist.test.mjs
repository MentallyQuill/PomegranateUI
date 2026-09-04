import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { BRAND_ARTIFACTS, FONT_ARTIFACTS, LEGAL_ARTIFACTS, verifyLabDist } from '../../scripts/verify-lab-dist.mjs';

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

async function writeFontFixtures(root) {
  for (const source of FONT_ARTIFACTS) {
    const contents = `font bytes for ${source}`;
    await writeFixture(root, source, contents);
    await writeFixture(root, `apps/workbench-lab/dist/assets/${path.basename(source)}`, contents);
  }
}

async function writeBrandFixtures(root) {
  for (const file of BRAND_ARTIFACTS) {
    const contents = `brand bytes for ${file}`;
    await writeFixture(root, `apps/workbench-lab/public/${file}`, contents);
    await writeFixture(root, `apps/workbench-lab/dist/${file}`, contents);
  }
}

const verifiedIndex = `<!doctype html><html><head>
  <meta name="darkreader-lock">
  <link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png">
  <link rel="shortcut icon" href="./favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png">
</head></html>`;

test('Pages artifact contains byte-identical licenses and notices', async () => {
  assert.deepEqual(LEGAL_ARTIFACTS.map(([output]) => output), [
    'LICENSE.txt',
    'THIRD_PARTY_NOTICES.md',
    'licenses/Geist-OFL.txt',
    'licenses/Newsreader-OFL.txt',
    'licenses/Inter-OFL.txt',
    'licenses/RobotoMono-OFL.txt',
    'licenses/Nunito-OFL.txt',
    'licenses/Fraunces-OFL.txt',
    'licenses/SourceSans3-OFL.txt',
    'licenses/Alegreya-OFL.txt'
  ]);
  const root = await mkdtemp(path.join(tmpdir(), 'pom-lab-dist-'));
  await writeFixture(root, 'apps/workbench-lab/dist/index.html', verifiedIndex);
  await writeLegalFixtures(root);
  await writeFontFixtures(root);
  await writeBrandFixtures(root);

  await assert.doesNotReject(verifyLabDist({ root }));
  await writeFixture(root, 'apps/workbench-lab/dist/licenses/Geist-OFL.txt', 'drifted');
  await assert.rejects(verifyLabDist({ root }), /does not match its source/);
});

test('Pages artifact contains a byte-identical asset for every bundled font', async () => {
  assert.deepEqual(FONT_ARTIFACTS.map((source) => path.basename(source)), [
    'Geist-Variable.woff2',
    'Newsreader-Variable.ttf',
    'GeistMono-Variable.woff2',
    'Inter-Variable.woff2',
    'RobotoMono-Variable.ttf',
    'Nunito-Variable.ttf',
    'Fraunces-Variable.ttf',
    'SourceSans3-Variable.ttf',
    'Alegreya-Variable.ttf'
  ]);
  const root = await mkdtemp(path.join(tmpdir(), 'pom-lab-fonts-'));
  await writeFixture(root, 'apps/workbench-lab/dist/index.html', verifiedIndex);
  await writeLegalFixtures(root);
  await writeFontFixtures(root);
  await writeBrandFixtures(root);

  await assert.doesNotReject(verifyLabDist({ root }));
  await writeFixture(root, 'apps/workbench-lab/dist/assets/Nunito-Variable.ttf', 'corrupted font');
  await assert.rejects(verifyLabDist({ root }), /Nunito-Variable\.ttf is missing a byte-identical built asset/);
});

test('Pages artifact keeps the complete favicon set and relative links', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'pom-lab-brand-'));
  await writeFixture(root, 'apps/workbench-lab/dist/index.html', `<!doctype html><html><head>
    <meta name="darkreader-lock">
    <link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="./favicon-16x16.png">
    <link rel="shortcut icon" href="./favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png">
  </head></html>`);
  await writeLegalFixtures(root);
  await writeFontFixtures(root);
  await writeBrandFixtures(root);

  await assert.doesNotReject(verifyLabDist({ root }));
  await writeFixture(root, 'apps/workbench-lab/dist/favicon-32x32.png', 'drifted');
  await assert.rejects(verifyLabDist({ root }), /favicon-32x32\.png does not match its public source/);
});

test('Pages artifact prevents extensions from recoloring theme-authored surfaces', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'pom-lab-darkreader-'));
  await writeFixture(root, 'apps/workbench-lab/dist/index.html', '<!doctype html><html><head></head></html>');
  await writeLegalFixtures(root);
  await writeFontFixtures(root);

  await assert.rejects(verifyLabDist({ root }), /missing static Dark Reader lock/);
});

test('Pages artifact rejects inactive Dark Reader lock lookalikes', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'pom-lab-darkreader-lookalike-'));
  await writeLegalFixtures(root);
  await writeFontFixtures(root);
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
