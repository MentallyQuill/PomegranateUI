import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifestPath = path.join(root, 'design', 'theme-targets', 'deep-current', 'atmospheric-assets.json');
const sourceSha256 = '38878d2cf8a86f5e879faba4b41a214e4293f22ed755975023e02c962d61b913';

test('Atmospheric display assets are complete, user-owned, public, and hash-bound', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.equal(manifest.schemaVersion, 'pomegranate.ui.atmospheric-assets.v1');
  assert.equal(manifest.sourceAuthoritySha256, sourceSha256);
  assert.equal(manifest.ownership, 'user-authored');
  assert.equal(manifest.publicUseApproved, true);
  assert.deepEqual(manifest.assets.map(({ id }) => id), [
    'stage',
    'portrait.aven-rook',
    'portrait.mara-venn',
    'portrait.ilex',
    'portrait.quiet-diver'
  ]);
  for (const asset of manifest.assets) {
    assert.match(asset.path, /^apps\/workbench-lab\/src\/assets\/deep-current-/);
    assert.match(asset.mimeType, /^image\/(?:jpeg|webp)$/);
    assert.ok(Number.isInteger(asset.width) && asset.width > 0, `${asset.id} width`);
    assert.ok(Number.isInteger(asset.height) && asset.height > 0, `${asset.id} height`);
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    const bytes = await readFile(path.join(root, asset.path));
    assert.equal(bytes.length, asset.bytes, `${asset.id} bytes`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `${asset.id} hash`);
  }
});
