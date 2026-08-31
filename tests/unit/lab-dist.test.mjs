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

test('Pages artifact contains byte-identical licenses and notices', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'pom-lab-dist-'));
  await writeFixture(root, 'apps/workbench-lab/dist/index.html', '<!doctype html>');
  for (const [output, source] of LEGAL_ARTIFACTS) {
    const contents = `notice for ${source}`;
    await writeFixture(root, source, contents);
    await writeFixture(root, `apps/workbench-lab/dist/${output}`, contents);
  }

  await assert.doesNotReject(verifyLabDist({ root }));
  await writeFixture(root, 'apps/workbench-lab/dist/licenses/Geist-OFL.txt', 'drifted');
  await assert.rejects(verifyLabDist({ root }), /does not match its source/);
});
