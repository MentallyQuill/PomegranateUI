import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const LEGAL_ARTIFACTS = Object.freeze([
  Object.freeze(['LICENSE.txt', 'LICENSE']),
  Object.freeze(['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.md']),
  Object.freeze(['licenses/Geist-OFL.txt', 'apps/workbench-lab/src/assets/fonts/LICENSE-Geist.txt']),
  Object.freeze(['licenses/Newsreader-OFL.txt', 'apps/workbench-lab/src/assets/fonts/LICENSE-Newsreader.txt']),
  Object.freeze(['licenses/Inter-OFL.txt', 'apps/workbench-lab/src/assets/fonts/LICENSE-Inter.txt']),
  Object.freeze(['licenses/RobotoMono-OFL.txt', 'apps/workbench-lab/src/assets/fonts/LICENSE-RobotoMono.txt']),
  Object.freeze(['licenses/Nunito-OFL.txt', 'apps/workbench-lab/src/assets/fonts/LICENSE-Nunito.txt']),
  Object.freeze(['licenses/Fraunces-OFL.txt', 'apps/workbench-lab/src/assets/fonts/LICENSE-Fraunces.txt']),
  Object.freeze(['licenses/SourceSans3-OFL.txt', 'apps/workbench-lab/src/assets/fonts/LICENSE-SourceSans3.txt']),
  Object.freeze(['licenses/Alegreya-OFL.txt', 'apps/workbench-lab/src/assets/fonts/LICENSE-Alegreya.txt'])
]);

export const FONT_ARTIFACTS = Object.freeze([
  'apps/workbench-lab/src/assets/fonts/Geist-Variable.woff2',
  'apps/workbench-lab/src/assets/fonts/Newsreader-Variable.ttf',
  'apps/workbench-lab/src/assets/fonts/GeistMono-Variable.woff2',
  'apps/workbench-lab/src/assets/fonts/Inter-Variable.woff2',
  'apps/workbench-lab/src/assets/fonts/RobotoMono-Variable.ttf',
  'apps/workbench-lab/src/assets/fonts/Nunito-Variable.ttf',
  'apps/workbench-lab/src/assets/fonts/Fraunces-Variable.ttf',
  'apps/workbench-lab/src/assets/fonts/SourceSans3-Variable.ttf',
  'apps/workbench-lab/src/assets/fonts/Alegreya-Variable.ttf'
]);

export const BRAND_ARTIFACTS = Object.freeze([
  'pomegranateui-mark-64.png',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'favicon.ico',
  'apple-touch-icon.png'
]);

const BRAND_LINKS = Object.freeze([
  Object.freeze(['link[rel="icon"][sizes="32x32"]', './favicon-32x32.png']),
  Object.freeze(['link[rel="icon"][sizes="16x16"]', './favicon-16x16.png']),
  Object.freeze(['link[rel="shortcut icon"]', './favicon.ico']),
  Object.freeze(['link[rel="apple-touch-icon"][sizes="180x180"]', './apple-touch-icon.png'])
]);

export async function verifyLabDist({ root = repositoryRoot } = {}) {
  const dist = path.join(root, 'apps', 'workbench-lab', 'dist');
  const indexPath = path.join(dist, 'index.html');
  assert.equal((await stat(indexPath)).isFile(), true, 'Workbench Lab dist is missing index.html');
  const indexHtml = await readFile(indexPath, 'utf8');
  const dom = new JSDOM(indexHtml);
  try {
    assert.ok(
      dom.window.document.head.querySelector('meta[name="darkreader-lock"]'),
      'Workbench Lab dist is missing static Dark Reader lock'
    );
    for (const [selector, href] of BRAND_LINKS) {
      assert.equal(
        dom.window.document.head.querySelector(selector)?.getAttribute('href'),
        href,
        `Workbench Lab dist is missing relative brand link ${href}`
      );
    }
  } finally {
    dom.window.close();
  }

  for (const [output, source] of LEGAL_ARTIFACTS) {
    const [actual, expected] = await Promise.all([
      readFile(path.join(dist, output)),
      readFile(path.join(root, source))
    ]);
    assert.equal(actual.equals(expected), true, `${output} does not match its source ${source}`);
  }

  const builtAssets = await readdir(path.join(dist, 'assets'));
  for (const source of FONT_ARTIFACTS) {
    const expected = await readFile(path.join(root, source));
    let found = false;
    for (const output of builtAssets) {
      if (path.extname(output) !== path.extname(source)) continue;
      const actual = await readFile(path.join(dist, 'assets', output));
      if (actual.equals(expected)) {
        found = true;
        break;
      }
    }
    assert.equal(found, true, `${path.basename(source)} is missing a byte-identical built asset`);
  }

  for (const file of BRAND_ARTIFACTS) {
    const [actual, expected] = await Promise.all([
      readFile(path.join(dist, file)),
      readFile(path.join(root, 'apps', 'workbench-lab', 'public', file))
    ]);
    assert.equal(actual.equals(expected), true, `${file} does not match its public source`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyLabDist();
  console.log(`Workbench Lab artifact verified: ${LEGAL_ARTIFACTS.length} legal files, ${FONT_ARTIFACTS.length} bundled fonts, and ${BRAND_ARTIFACTS.length} brand assets.`);
}
