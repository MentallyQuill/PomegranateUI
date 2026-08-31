import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const LEGAL_ARTIFACTS = Object.freeze([
  Object.freeze(['LICENSE.txt', 'LICENSE']),
  Object.freeze(['THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_NOTICES.md']),
  Object.freeze(['licenses/Geist-OFL.txt', 'apps/workbench-lab/src/assets/fonts/LICENSE-Geist.txt']),
  Object.freeze(['licenses/Newsreader-OFL.txt', 'apps/workbench-lab/src/assets/fonts/LICENSE-Newsreader.txt'])
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
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifyLabDist();
  console.log(`Workbench Lab artifact verified: ${LEGAL_ARTIFACTS.length} legal files.`);
}
