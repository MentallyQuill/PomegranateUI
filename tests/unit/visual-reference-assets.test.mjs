import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const referenceDirectory = path.join(root, 'design', 'theme-targets', 'ash-amber');
const manifestPath = path.join(referenceDirectory, 'reference.json');
const deepManifestPath = path.join(
  root,
  'design',
  'theme-targets',
  'deep-current',
  'recordings',
  'reference.json'
);

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

const expectedDeepManifest = {
  schema: 'pomegranate.ui.recording-reference.v1',
  id: 'sonderui-rw2-deep-current',
  sources: [
    {
      id: 'rw2',
      fileName: 'SonderUI_RW2.mp4',
      sha256: '5E188EF5866BB82AEA25653AF4FEA6161E36596F760EB00E6FEDF42B2675E011',
      width: 1920,
      height: 1280,
      fps: 60
    },
    {
      id: 'rw2-1',
      fileName: 'SonderUI_RW2_1.mp4',
      sha256: '56F84670C2A4B1318BD26A9A482790AE93C49387D47A6D6A4AF7C470C635A889',
      width: 1920,
      height: 1280,
      fps: 60
    }
  ],
  frames: [
    ['deep-base-scene', 'rw2', 52, 'design/theme-targets/deep-current/recordings/rw2-t52.png', '7EAC0F71B594CE5860D8A93EED8A3FCE129074933A981F33A6300833E81F5856', 'Base Scene with Characters, Custom Theme, Scene Effects, and Personas'],
    ['deep-floating-connections', 'rw2', 59, 'design/theme-targets/deep-current/recordings/rw2-t59.png', 'DEDB153CCC0119DB01A5653B1C7D6463725C877A456C2271062F92FB7F71A8DD', 'Floating AI Connections and integrated right tab'],
    ['deep-right-stack', 'rw2', 67, 'design/theme-targets/deep-current/recordings/rw2-t67.png', 'F365B4A925BE6D0AAE43C7D18C17D446EDBB6E2E06956466811307F7106F5DCC', 'Right Characters and AI Connections shelf stack'],
    ['deep-widget-shelf', 'rw2', 76, 'design/theme-targets/deep-current/recordings/rw2-t76.png', 'C1CF2D281A2C900056C7B5BDB3507E7F4CAEAE77619129B75F068421BF3B0AC6', 'Widget Shelf with hidden Custom Theme'],
    ['deep-restored-theme-tab', 'rw2', 84, 'design/theme-targets/deep-current/recordings/rw2-t84.png', '5F8313D53802FE9A783A684616BC685C752325E4BD039E94D6A75CC708B5F7D9', 'Custom Theme restored as a left tab'],
    ['deep-canvas-ink', 'rw2-1', 2, 'design/theme-targets/deep-current/recordings/rw2-1-t2.png', '343267F966A3D1A7E0C8DACE8ADFC886792708E45CA2DD472A79539F6F23F11B', 'Canvas Ink authoring'],
    ['deep-control-chrome', 'rw2-1', 14, 'design/theme-targets/deep-current/recordings/rw2-1-t14.png', '131540F086240423291473B0CD5EC0106AC0054E5A9DF3E3B524123580853AA7', 'Control Chrome propagation'],
    ['deep-ambient-chrome', 'rw2-1', 26, 'design/theme-targets/deep-current/recordings/rw2-1-t26.png', 'C36E7AD1A28660C2DAE68FAFC84880887016CBEB1843D530EC347AD2B88B2653', 'Ambient and chrome color interaction'],
    ['deep-interface-text', 'rw2-1', 39, 'design/theme-targets/deep-current/recordings/rw2-1-t39.png', '1F2F08A310FF15C9F9B53B1AB9E66ED7E774270F9DF66DB59CE44CCD6872A735', 'Interface Text propagation and unsafe-edit behavior'],
    ['deep-muted-chrome', 'rw2-1', 60, 'design/theme-targets/deep-current/recordings/rw2-1-t60.png', '61E80EDC61D6CD78B853E86474486470ABDF6C2D27C29EAFB5445B6C227D9520', 'Muted chrome, ambient authoring, and floating surfaces'],
    ['ash-amber-final', 'rw2-1', 80, 'design/theme-targets/ash-amber/sonderui-rw2-1-t80.png', '6403A7BCFD8F43195FA42C5D9715CC79964C8B7569F47C22FDEEFD1B89804997', 'Final Ash & Amber target']
  ].map(([id, sourceId, timestampSeconds, file, sha256, purpose]) => ({
    id,
    sourceId,
    timestampSeconds,
    file,
    sha256,
    purpose
  }))
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

test('Deep Current retains the complete exact recording frame manifest', async () => {
  const manifestBytes = await readRequiredFile(deepManifestPath, 'Deep recording manifest');
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString('utf8'));
  } catch (error) {
    assert.fail(`Malformed Deep recording manifest: ${error.message}`);
  }

  assert.deepEqual(manifest, expectedDeepManifest);
  assert.equal(new Set(manifest.sources.map(({ id }) => id)).size, 2, 'source IDs must be unique');
  assert.equal(new Set(manifest.frames.map(({ id }) => id)).size, 11, 'scenario IDs must be unique');

  for (const source of manifest.sources) {
    assert.equal(path.isAbsolute(source.fileName), false, 'source file name must be repository-neutral');
    assert.equal(path.basename(source.fileName), source.fileName, 'source file name must not contain a path');
  }

  for (const frame of manifest.frames) {
    assert.equal(path.isAbsolute(frame.file), false, 'frame path must be repository-relative');
    assert.equal(path.extname(frame.file), '.png', 'manifest must point at extracted PNG evidence');
    assert.ok(frame.purpose.length > 0, 'every frame requires an authority purpose');

    const framePath = path.resolve(root, frame.file);
    assert.ok(framePath.startsWith(path.join(root, 'design') + path.sep), 'frame escaped the design evidence tree');
    const frameBytes = await readRequiredFile(framePath, `recording frame ${frame.id}`);
    const digest = createHash('sha256').update(frameBytes).digest('hex').toUpperCase();
    assert.equal(digest, frame.sha256, `${frame.id} hash drift`);
  }
});
