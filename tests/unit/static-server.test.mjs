import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createStaticServer } from '../../scripts/serve-static.mjs';

function rawStatus(origin, requestPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(origin);
    const pending = request({ hostname: url.hostname, port: url.port, path: requestPath }, (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode));
    });
    pending.on('error', reject);
    pending.end();
  });
}

test('static server serves known MIME types and rejects missing or escaping paths', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'pomegranate-static-'));
  await mkdir(path.join(root, 'assets'));
  await writeFile(path.join(root, 'index.html'), '<h1>Pomegranate</h1>');
  await writeFile(path.join(root, 'assets', 'app.js'), 'export {};');
  await writeFile(path.join(root, 'assets', 'style.css'), 'body{}');
  await writeFile(path.join(root, 'assets', 'icon.svg'), '<svg/>');
  await writeFile(path.join(root, 'assets', 'font.woff2'), Buffer.from([0, 1, 2]));
  const server = createStaticServer({ root, host: '127.0.0.1', port: 0 });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const [url, type] of [
    ['/index.html', 'text/html'], ['/assets/app.js', 'text/javascript'],
    ['/assets/style.css', 'text/css'], ['/assets/icon.svg', 'image/svg+xml'],
    ['/assets/font.woff2', 'font/woff2']
  ]) {
    const response = await fetch(`${origin}${url}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type').startsWith(type), true);
  }
  assert.equal((await fetch(`${origin}/missing.html`)).status, 404);
  assert.equal(await rawStatus(origin, '/%2e%2e/secret.txt'), 403);
  assert.equal(await rawStatus(origin, '/..%2fsecret.txt'), 403);
});
