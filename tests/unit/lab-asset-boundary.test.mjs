import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');
const readBytes = (relativePath) => readFile(path.join(root, relativePath));

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG');
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

test('Workbench Lab uses only Pomegranate-owned asset paths', async () => {
  const [styles, app, deepCurrent] = await Promise.all([
    read('apps/workbench-lab/src/styles.css'),
    read('apps/workbench-lab/src/App.svelte'),
    read('apps/workbench-lab/src/themes/deep-current.ts')
  ]);

  for (const font of ['Geist-Variable.woff2', 'GeistMono-Variable.woff2', 'Newsreader-Variable.ttf']) {
    assert.match(styles, new RegExp(`assets/fonts/${font.replace('.', '\\.')}`));
  }
  for (const icon of ['dock-left', 'move', 'grid', 'dock-right', 'float', 'remove', 'more']) {
    assert.match(styles, new RegExp(`assets/icons/${icon}\\.svg`));
    assert.match(await read(`apps/workbench-lab/src/assets/icons/${icon}.svg`), /<svg/);
  }

  assert.doesNotMatch(styles, /prototypes\//i);
  assert.doesNotMatch(app, /deep-current-stage/i);
  assert.doesNotMatch(deepCurrent, /image\.deep-current-stage|kind:\s*'image'/i);
  assert.match(deepCurrent, /localImages:\s*false/);
});

test('Workbench Lab ships a lightweight square favicon set from its header mark', async () => {
  const index = await read('apps/workbench-lab/index.html');
  assert.match(index, /rel="icon" type="image\/png" sizes="32x32" href="\.\/favicon-32x32\.png"/);
  assert.match(index, /rel="icon" type="image\/png" sizes="16x16" href="\.\/favicon-16x16\.png"/);
  assert.match(index, /rel="shortcut icon" href="\.\/favicon\.ico"/);
  assert.match(index, /rel="apple-touch-icon" sizes="180x180" href="\.\/apple-touch-icon\.png"/);

  // Alpha-bounds square derivatives of the approved source asset, SHA-256
  // 4267d929a25ad1b7d495d9360d41f1b5d1a1bcbad48707cd11dfeefadd87b532.
  for (const [file, size, byteBudget, sha256] of [
    ['pomegranateui-mark-64.png', 64, 8_000, '1f46fadee22da1c6553b7aba9395e2311edea782f4b476c4abcf7c042a35e34b'],
    ['favicon-32x32.png', 32, 5_000, '2e8196b59e66fe50d84fbe001e3fb2733ad57f338679c61232e54cf05e0037dc'],
    ['favicon-16x16.png', 16, 3_000, 'e90ed9d8e6dfa6461a59d3df598d58af205e2e6166cec71941d1e43fbd5ef40b'],
    ['apple-touch-icon.png', 180, 30_000, '2e86d547cc4eba28e618925790d44837563837f4fdd35f212058146632046a98']
  ]) {
    const bytes = await readBytes(`apps/workbench-lab/public/${file}`);
    assert.deepEqual(pngDimensions(bytes), [size, size], `${file} must be ${size}x${size}`);
    assert.ok(bytes.length <= byteBudget, `${file} exceeds its ${byteBudget}-byte budget`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), sha256, `${file} drifted from its approved pixels`);
  }

  const ico = await readBytes('apps/workbench-lab/public/favicon.ico');
  assert.deepEqual([...ico.subarray(0, 4)], [0, 0, 1, 0]);
  assert.equal(ico.readUInt16LE(4), 3, 'favicon.ico must contain 16px, 32px, and 48px images');
  const icoDimensions = Array.from({ length: 3 }, (_, index) => {
    const entryOffset = 6 + index * 16;
    const width = ico[entryOffset] || 256;
    const height = ico[entryOffset + 1] || 256;
    return [width, height];
  });
  assert.deepEqual(icoDimensions, [[16, 16], [32, 32], [48, 48]]);
  assert.ok(ico.length <= 20_000, 'favicon.ico exceeds its 20,000-byte budget');
  assert.equal(createHash('sha256').update(ico).digest('hex'), '844df377088dbd7bba5f30eadc29697c0881603e221b08e38c37f082a0a3db0f');
});
