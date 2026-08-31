import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

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
