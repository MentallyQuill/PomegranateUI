import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'dist' || entry.name === 'node_modules') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function importSpecifiers(source) {
  const specifiers = [];
  const pattern = /(?:\bfrom\s*|\bimport\s*\()(['"])([^'"]+)\1/g;
  for (const match of source.matchAll(pattern)) specifiers.push(match[2]);
  return specifiers;
}

test('packed consumer fixtures and verifier are executable repository contracts', async () => {
  for (const relativePath of [
    'examples/mock-roleplay-backend/package.json',
    'examples/mock-roleplay-backend/tsconfig.json',
    'examples/mock-roleplay-backend/src/index.ts',
    'examples/mock-roleplay-backend/src/index.test.ts',
    'examples/sonder-integration/package.json',
    'examples/sonder-integration/tsconfig.json',
    'examples/sonder-integration/src/adapter.ts',
    'examples/sonder-integration/src/adapter.test.ts',
    'scripts/verify-packed-consumers.mjs'
  ]) {
    assert.equal((await stat(path.join(root, relativePath))).isFile(), true, relativePath);
  }

  const rootPackage = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(rootPackage.scripts['test:pack'], 'node scripts/verify-packed-consumers.mjs');
});

test('package and example imports remain public, relative, and repository-neutral', async () => {
  for (const area of ['packages', 'examples']) {
    const files = (await walk(path.join(root, area))).filter((file) => /\.(?:mjs|ts|tsx)$/.test(file));
    for (const file of files) {
      const relative = path.relative(root, file).replaceAll('\\', '/');
      const source = await readFile(file, 'utf8');
      assert.doesNotMatch(source, /Sonder_Engine/i, relative);
      assert.doesNotMatch(source, /(?:^|['"(\s])[A-Za-z]:[\\/]/m, relative);
      for (const specifier of importSpecifiers(source)) {
        assert.doesNotMatch(specifier, /^@pomegranate-ui\/[^/]+\/src(?:\/|$)/, `${relative}: ${specifier}`);
        assert.doesNotMatch(specifier, /(?:^|\/)packages\/[^/]+\/src(?:\/|$)/, `${relative}: ${specifier}`);
        if (relative.startsWith('examples/')) {
          assert.equal(specifier.startsWith('..'), false, `${relative}: escaping import ${specifier}`);
        }
        if (specifier === 'react' || specifier.startsWith('react/')) {
          assert.ok(
            relative.startsWith('packages/react/')
              || relative.startsWith('apps/workbench-lab/')
              || relative.includes('/consumer-ui/'),
            `${relative}: React import outside a binding or consumer UI`
          );
        }
      }
    }
  }
});
