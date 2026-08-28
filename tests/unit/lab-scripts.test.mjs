import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..', '..');
const json = async (relative) => JSON.parse(await readFile(path.join(root, relative), 'utf8'));

test('Lab development and preview scripts bind fixed loopback ports', async () => {
  const rootPackage = await json('package.json');
  assert.equal(
    rootPackage.scripts['dev:lab'],
    'npm exec --workspace @pomegranate-ui/workbench-lab -- vite --host 127.0.0.1 --port 5173 --strictPort'
  );
  assert.equal(
    rootPackage.scripts['preview:lab'],
    'npm exec --workspace @pomegranate-ui/workbench-lab -- vite preview --host 127.0.0.1 --port 4174 --strictPort'
  );
});

test('Lab Vite production output is static and base-relative', async () => {
  const vite = await readFile(path.join(root, 'apps', 'workbench-lab', 'vite.config.ts'), 'utf8');
  assert.match(vite, /base:\s*['"]\.\/['"]/);
  assert.match(vite, /outDir:\s*['"]dist['"]/);
  assert.match(vite, /emptyOutDir:\s*true/);
  assert.doesNotMatch(vite, /server\s*:/);
});
