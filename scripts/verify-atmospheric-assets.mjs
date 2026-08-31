import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'design', 'theme-targets', 'deep-current', 'atmospheric-assets.json'), 'utf8'));

function jpegDimensions(bytes) {
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }
  throw new Error('JPEG dimensions unavailable.');
}

function webpDimensions(bytes) {
  const kind = bytes.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  if (kind === 'VP8 ') return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  if (kind === 'VP8L') {
    const bits = bytes.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  throw new Error(`Unsupported WebP chunk ${kind}.`);
}

assert.equal(manifest.schemaVersion, 'pomegranate.ui.atmospheric-assets.v1');
assert.equal(manifest.ownership, 'user-authored');
assert.equal(manifest.publicUseApproved, true);
for (const asset of manifest.assets) {
  const bytes = await readFile(path.join(root, asset.path));
  assert.equal(bytes.length, asset.bytes, `${asset.id} byte length`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `${asset.id} SHA-256`);
  const dimensions = asset.mimeType === 'image/jpeg' ? jpegDimensions(bytes) : webpDimensions(bytes);
  assert.deepEqual(dimensions, { width: asset.width, height: asset.height }, `${asset.id} dimensions`);
}
process.stdout.write(`Atmospheric assets verified: ${manifest.assets.length}.\n`);
