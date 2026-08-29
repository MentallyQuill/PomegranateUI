import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const referenceDirectory = path.join(root, 'design', 'theme-targets', 'ash-amber');
const manifestPath = path.join(referenceDirectory, 'reference.json');

const expectedManifest = {
  schema: 'pomegranate.ui.visual-reference.v1',
  id: 'sonderui-rw2-1-ash-amber-t80',
  source: {
    fileName: 'SonderUI_RW2_1.mp4',
    sha256: '56F84670C2A4B1318BD26A9A482790AE93C49387D47A6D6A4AF7C470C635A889',
    width: 1920,
    height: 1280,
    fps: 60,
    durationSeconds: 101.682
  },
  extraction: {
    timestampSeconds: 80,
    output: 'sonderui-rw2-1-t80.png',
    sha256: '6403A7BCFD8F43195FA42C5D9715CC79964C8B7569F47C22FDEEFD1B89804997'
  }
};

async function readRequiredFile(file, label) {
  try {
    return await readFile(file);
  } catch (error) {
    if (error?.code === 'ENOENT') assert.fail(`Missing ${label}: ${path.relative(root, file)}`);
    throw error;
  }
}

test('Ash & Amber retains the exact reviewed recording frame and manifest', async () => {
  const manifestBytes = await readRequiredFile(manifestPath, 'visual reference manifest');
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString('utf8'));
  } catch (error) {
    assert.fail(`Malformed visual reference manifest: ${error.message}`);
  }

  assert.equal(path.isAbsolute(manifest.source.fileName), false, 'source file name must be repository-neutral');
  assert.equal(path.basename(manifest.source.fileName), manifest.source.fileName, 'source file name must not contain a path');
  assert.deepEqual(manifest, expectedManifest);

  assert.equal(path.isAbsolute(manifest.extraction.output), false, 'frame output must be repository-relative');
  assert.equal(path.basename(manifest.extraction.output), manifest.extraction.output, 'frame output must stay in its reference directory');
  const framePath = path.resolve(referenceDirectory, manifest.extraction.output);
  assert.equal(path.dirname(framePath), referenceDirectory, 'frame output escaped its reference directory');

  const frameBytes = await readRequiredFile(framePath, 'reviewed Ash & Amber frame');
  const digest = createHash('sha256').update(frameBytes).digest('hex').toUpperCase();
  assert.equal(digest, expectedManifest.extraction.sha256);
});
