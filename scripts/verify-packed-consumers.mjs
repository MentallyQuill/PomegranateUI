import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageNames = ['contracts', 'layout', 'core', 'react', 'svelte', 'testkit'];
const exampleNames = ['mock-roleplay-backend', 'sonder-integration'];
const npmCli = process.env.npm_execpath;
const npmCommand = process.platform === 'win32' ? process.execPath : 'npm';
const npmPrefix = process.platform === 'win32'
  ? [npmCli ?? (() => { throw new Error('npm_execpath is required on Windows.'); })()]
  : [];
const npmLabel = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args, cwd) {
  const result = spawnSync(npmCommand, [...npmPrefix, ...args], {
    cwd,
    encoding: 'utf8',
    shell: false,
    env: {
      ...process.env,
      npm_config_audit: 'false',
      npm_config_fund: 'false',
      npm_config_update_notifier: 'false'
    }
  });
  if (result.status !== 0) {
    throw new Error([
      `${npmLabel} ${args.join(' ')} failed in ${cwd}`,
      result.error?.message,
      result.stdout,
      result.stderr
    ].filter(Boolean).join('\n'));
  }
  return result.stdout;
}

function runNode(args, cwd) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    env: { ...process.env }
  });
  if (result.status !== 0) {
    throw new Error([
      `node ${args.join(' ')} failed in ${cwd}`,
      result.error?.message,
      result.stdout,
      result.stderr
    ].filter(Boolean).join('\n'));
  }
  return result.stdout;
}

function parsePackJson(output, label) {
  try {
    const parsed = JSON.parse(output);
    if (!Array.isArray(parsed) || !parsed[0]) throw new Error('missing first result');
    return parsed[0];
  } catch (error) {
    throw new Error(`Could not parse npm pack JSON for ${label}: ${error.message}\n${output}`);
  }
}

function verifyContents(report, label) {
  const paths = report.files.map((entry) => String(entry.path).replaceAll('\\', '/'));
  for (const file of paths) {
    if (
      /(?:^|\/)src(?:\/|$)/.test(file)
      || /\.test\.[cm]?[jt]sx?$/.test(file)
      || /(?:^|\/)prototypes(?:\/|$)/.test(file)
      || /(?:^|\/)provenance(?:\/|$)/.test(file)
    ) {
      throw new Error(`${label} tarball contains forbidden path '${file}'.`);
    }
  }
  for (const required of ['package.json', 'README.md', 'dist/index.js', 'dist/index.d.ts']) {
    if (!paths.includes(required)) throw new Error(`${label} tarball is missing '${required}'.`);
  }
}

async function rewriteTarballDependencies(exampleRoot, tarballs) {
  const manifestPath = path.join(exampleRoot, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  for (const field of ['dependencies', 'devDependencies']) {
    const dependencies = manifest[field];
    if (!dependencies) continue;
    for (const [name, tarball] of tarballs) {
      if (Object.hasOwn(dependencies, name)) {
        dependencies[name] = `file:${tarball.replaceAll('\\', '/')}`;
      }
    }
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function fileDependency(tarballs, name) {
  const tarball = tarballs.get(name);
  if (!tarball) throw new Error(`Packed tarball is missing for ${name}.`);
  return `file:${tarball.replaceAll('\\', '/')}`;
}

async function assertLocalResolutions(consumerRoot, names) {
  const resolvedRoot = await realpath(consumerRoot);
  for (const name of names) {
    const packageRoot = await realpath(path.join(consumerRoot, 'node_modules', ...name.split('/')));
    const relative = path.relative(resolvedRoot, packageRoot);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`${name} resolved outside the packed consumer: ${packageRoot}`);
    }
  }
  for (const relativePath of ['package.json', 'package-lock.json']) {
    const source = await readFile(path.join(consumerRoot, relativePath), 'utf8');
    if (/workspace:|@pomegranate-ui\/[^"']+\/src|(?:^|["'])\.\.\//m.test(source)) {
      throw new Error(`${relativePath} contains a workspace or repository-source dependency.`);
    }
    if (source.includes(root.replaceAll('\\', '/'))) {
      throw new Error(`${relativePath} leaks the repository root.`);
    }
  }
}

async function writeSvelteConsumer(consumerRoot, tarballs) {
  const recipesRoot = path.join(consumerRoot, 'src', 'recipes');
  await mkdir(recipesRoot, { recursive: true });
  const manifest = {
    name: 'consumer-svelte-recipes',
    version: '0.0.0-private',
    private: true,
    type: 'module',
    scripts: {
      typecheck: 'svelte-check --tsgo --tsconfig ./tsconfig.json',
      build: 'vite build',
      test: 'node --test renderer-conformance.test.mjs'
    },
    dependencies: Object.fromEntries([
      '@pomegranate-ui/contracts',
      '@pomegranate-ui/layout',
      '@pomegranate-ui/core',
      '@pomegranate-ui/svelte',
      '@pomegranate-ui/testkit'
    ].map((name) => [name, fileDependency(tarballs, name)])),
    devDependencies: {
      '@sveltejs/vite-plugin-svelte': '7.3.0',
      '@typescript/native': 'npm:typescript@7.0.2',
      jsdom: '30.0.1',
      svelte: '5.56.10',
      'svelte-check': '4.7.6',
      typescript: '6.0.2',
      vite: '8.2.2'
    }
  };
  await writeFile(path.join(consumerRoot, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(consumerRoot, 'index.html'), '<main id="app"></main><script type="module" src="/src/main.ts"></script>\n');
  await writeFile(path.join(consumerRoot, 'tsconfig.json'), `${JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      skipLibCheck: true,
      verbatimModuleSyntax: true,
      noEmit: true
    },
    include: ['src/**/*.ts', 'src/**/*.svelte']
  }, null, 2)}\n`);
  await writeFile(path.join(consumerRoot, 'vite.config.ts'), [
    "import { svelte } from '@sveltejs/vite-plugin-svelte';",
    "import { defineConfig } from 'vite';",
    '',
    "export default defineConfig({ base: './', plugins: [svelte()] });",
    ''
  ].join('\n'));
  await writeFile(path.join(consumerRoot, 'src', 'main.ts'), [
    "import { mount } from 'svelte';",
    "import App from './App.svelte';",
    '',
    "mount(App, { target: document.getElementById('app')! });",
    ''
  ].join('\n'));
  await writeFile(path.join(consumerRoot, 'src', 'App.svelte'), [
    '<script lang="ts">',
    "  import { asPanelId } from '@pomegranate-ui/contracts';",
    "  import { createWorkbenchStore } from '@pomegranate-ui/core';",
    "  import { createInitialWorkbenchState, createPanel } from '@pomegranate-ui/layout';",
    "  import { toSvelteWorkbenchStore } from '@pomegranate-ui/svelte';",
    "  import PanelTabs from './recipes/PanelTabs.svelte';",
    '',
    '  const sceneId = asPanelId(\'scene\');',
    '  const created = createPanel(createInitialWorkbenchState(), {',
    "    id: sceneId, name: 'Scene', templateId: 'consumer.v1', order: 0, configuration: {}",
    '  });',
    "  if (!created.ok) throw new Error(created.error.message);",
    '  const store = createWorkbenchStore({ initialState: created.state });',
    '  const readable = toSvelteWorkbenchStore(store);',
    '</script>',
    '',
    '<PanelTabs {store} />',
    '<p data-revision={$readable.revision}>Packed Svelte consumer</p>',
    ''
  ].join('\n'));
  await writeFile(path.join(consumerRoot, 'renderer-dom-harness.mjs'), await readFile(path.join(root, 'tests', 'fixtures', 'renderer-dom-harness.mjs'), 'utf8'));
  await writeFile(path.join(consumerRoot, 'renderer-conformance.test.mjs'), [
    "import assert from 'node:assert/strict';",
    "import test from 'node:test';",
    "import { JSDOM } from 'jsdom';",
    "import { assertRendererConformance, RENDERER_CONTRACT_IDS } from '@pomegranate-ui/testkit';",
    "import { createRendererDomHarness } from './renderer-dom-harness.mjs';",
    '',
    "test('packed renderer conforms through public APIs', async () => {",
    "  const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });",
    '  const results = await assertRendererConformance(createRendererDomHarness(dom.window.document));',
    '  assert.equal(results.length, Object.keys(RENDERER_CONTRACT_IDS).length);',
    '  assert.equal(results.every((entry) => entry.passed), true);',
    '  dom.window.close();',
    '});',
    ''
  ].join('\n'));

  runNode([
    path.join(root, 'scripts', 'verify-recipes.mjs'),
    '--copy', 'all', '--to', recipesRoot
  ], root);
}

let temporaryRoot;
try {
  temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'pomegranate-ui-pack-'));
  const tarballs = new Map();

  for (const packageName of packageNames) {
    const packageRoot = path.join(root, 'packages', packageName);
    const label = `@pomegranate-ui/${packageName}`;
    const dryRun = parsePackJson(run(['pack', '--dry-run', '--json'], packageRoot), label);
    verifyContents(dryRun, label);
    const packed = parsePackJson(
      run(['pack', '--json', '--pack-destination', temporaryRoot], packageRoot),
      label
    );
    verifyContents(packed, label);
    tarballs.set(label, path.join(temporaryRoot, packed.filename));
  }

  for (const exampleName of exampleNames) {
    const cleanRoot = path.join(temporaryRoot, `consumer-${exampleName}`);
    await cp(path.join(root, 'examples', exampleName), cleanRoot, { recursive: true });
    await rewriteTarballDependencies(cleanRoot, tarballs);
    run(['install', '--ignore-scripts'], cleanRoot);
    run(['run', 'build'], cleanRoot);
    run(['test'], cleanRoot);
  }

  const svelteConsumerRoot = path.join(temporaryRoot, 'consumer-svelte-recipes');
  await writeSvelteConsumer(svelteConsumerRoot, tarballs);
  run(['install', '--ignore-scripts'], svelteConsumerRoot);
  await assertLocalResolutions(svelteConsumerRoot, [
    '@pomegranate-ui/contracts',
    '@pomegranate-ui/layout',
    '@pomegranate-ui/core',
    '@pomegranate-ui/svelte',
    '@pomegranate-ui/testkit',
    'svelte'
  ]);
  run(['run', 'typecheck'], svelteConsumerRoot);
  run(['run', 'build'], svelteConsumerRoot);
  run(['test'], svelteConsumerRoot);

  process.stdout.write(`Packed consumer verification passed: ${packageNames.length} packages, ${exampleNames.length + 1} clean consumers.\n`);
} finally {
  if (temporaryRoot) {
    const resolvedTemporaryRoot = path.resolve(temporaryRoot);
    if (path.dirname(resolvedTemporaryRoot) !== path.resolve(os.tmpdir())) {
      throw new Error(`Refusing to remove unexpected temporary path '${resolvedTemporaryRoot}'.`);
    }
    await rm(resolvedTemporaryRoot, { recursive: true, force: true });
  }
}
