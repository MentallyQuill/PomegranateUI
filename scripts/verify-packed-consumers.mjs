import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageNames = ['contracts', 'layout', 'core', 'svelte', 'testkit'];
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
      test: 'vitest run'
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
      vite: '8.2.2',
      vitest: '4.1.11'
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
  await writeFile(path.join(consumerRoot, 'vitest.config.ts'), [
    "import { svelte } from '@sveltejs/vite-plugin-svelte';",
    "import { defineConfig } from 'vitest/config';",
    '',
    "export default defineConfig({ plugins: [svelte()], resolve: { conditions: ['browser'] }, test: { environment: 'jsdom' } });",
    ''
  ].join('\n'));
  await writeFile(path.join(consumerRoot, 'src', 'main.ts'), [
    "import { mount } from 'svelte';",
    "import App from './App.svelte';",
    '',
    "mount(App, { target: document.getElementById('app')! });",
    ''
  ].join('\n'));
  await writeFile(path.join(consumerRoot, 'src', 'runtime.ts'), [
    "import type { WorkbenchStore } from '@pomegranate-ui/core';",
    '',
    'export interface PackedRuntime {',
    '  readonly store: WorkbenchStore;',
    '  failRenderer(title: string): void;',
    '}',
    '',
    'let current: PackedRuntime | undefined;',
    'export function registerPackedRuntime(runtime: PackedRuntime) { current = runtime; }',
    'export function getPackedRuntime(): PackedRuntime {',
    "  if (!current) throw new Error('Packed Svelte runtime is not mounted.');",
    '  return current;',
    '}',
    ''
  ].join('\n'));
  await writeFile(path.join(consumerRoot, 'src', 'FixtureWidget.svelte'), [
    '<script lang="ts">',
    "  import type { Readable } from 'svelte/store';",
    "  import type { WidgetRendererProps } from '@pomegranate-ui/svelte';",
    '',
    '  interface HostContext {',
    '    readonly storyId: string;',
    '    readonly failures: Readable<ReadonlySet<string>>;',
    '  }',
    '  let { instance, hostContext }: WidgetRendererProps<HostContext> = $props();',
    '  const failures = $derived(hostContext.failures);',
    "  const title = $derived(String(instance.configuration.title ?? 'Widget'));",
    '  const content = $derived.by(() => {',
    "    if ($failures.has(title)) throw new Error(`${title} fixture renderer failed.`);",
    "    return `${title} renderer ready.`;",
    '  });',
    '</script>',
    '',
    '<p>{content}</p>',
    ''
  ].join('\n'));
  await writeFile(path.join(consumerRoot, 'src', 'App.svelte'), [
    '<script lang="ts">',
    "  import { writable, type Readable } from 'svelte/store';",
    "  import { asPanelId, asWidgetInstanceId, asWidgetType, type WidgetManifest, type WorkbenchState } from '@pomegranate-ui/contracts';",
    "  import { createCatalogController, createWidgetRegistry, createWorkbenchStore } from '@pomegranate-ui/core';",
    "  import { createInitialWorkbenchState, createPanel, createWidget, type LayoutResult } from '@pomegranate-ui/layout';",
    "  import { createWidgetRendererRegistry, toSvelteWorkbenchStore } from '@pomegranate-ui/svelte';",
    "  import FixtureWidget from './FixtureWidget.svelte';",
    "  import PanelTabs from './recipes/PanelTabs.svelte';",
    "  import WidgetCatalog from './recipes/WidgetCatalog.svelte';",
    "  import WidgetFrame from './recipes/WidgetFrame.svelte';",
    "  import WorkbenchSurface from './recipes/WorkbenchSurface.svelte';",
    "  import RendererState from './recipes/RendererState.svelte';",
    "  import { registerPackedRuntime } from './runtime.js';",
    '',
    '  interface HostContext {',
    '    readonly storyId: string;',
    '    readonly failures: Readable<ReadonlySet<string>>;',
    '  }',
    "  const sceneId = asPanelId('scene');",
    "  const libraryId = asPanelId('library');",
    "  const storyType = asWidgetType('fixture.story-summary');",
    "  const statusType = asWidgetType('fixture.system-status');",
    "  const missingType = asWidgetType('fixture.missing-widget');",
    '',
    '  function manifest(type: typeof storyType, title: string): WidgetManifest {',
    "    return { type, version: '1.0.0', title, capabilities: [], defaultConfiguration: {},",
    "      defaultPlacement: { kind: 'docked', edge: 'main', shelfId: 'primary' },",
    "      catalog: { category: 'fixtures', purpose: `Exercise ${title}.`, keywords: [title.toLowerCase()],",
    "        iconKey: 'fixture', shape: 'medium', minColumns: 1,",
    "        geometry: { minHeight: 120, idealHeight: 180, maxHeight: 320 }, supportedStates: ['ready'] } };",
    '  }',
    '  function requireState(result: LayoutResult): WorkbenchState {',
    '    if (!result.ok) throw new Error(result.error.message);',
    '    return result.state;',
    '  }',
    '  function initialState(): WorkbenchState {',
    '    let state = createInitialWorkbenchState();',
    "    state = requireState(createPanel(state, { id: sceneId, name: 'Scene', templateId: 'fixture.v1', order: 0 }));",
    "    state = requireState(createPanel(state, { id: libraryId, name: 'Library', templateId: 'fixture.v1', order: 1 }));",
    "    for (const [panelName, panelId] of [['scene', sceneId], ['library', libraryId]] as const) {",
    "      for (const [suffix, type, title, edge] of [['story', storyType, 'Story Summary', 'left'], ['status', statusType, 'System Status', 'main'], ['missing', missingType, 'Missing Widget', 'right']] as const) {",
    '        state = requireState(createWidget(state, {',
    "          id: asWidgetInstanceId(`${panelName}-${suffix}`), type, manifestVersion: '1.0.0', configuration: { title }",
    "        }, { kind: 'docked', panelId, edge, shelfId: 'primary', order: 0 }));",
    '      }',
    '    }',
    '    return { ...state, revision: 0 };',
    '  }',
    '',
    '  const registry = createWidgetRegistry();',
    "  for (const entry of [manifest(storyType, 'Story Summary'), manifest(statusType, 'System Status'), manifest(missingType, 'Missing Widget')]) {",
    '    const registered = registry.register(entry);',
    '    if (!registered.ok) throw new Error(registered.error.message);',
    '  }',
    '  const rendererRegistry = createWidgetRendererRegistry<HostContext>();',
    '  for (const type of [storyType, statusType]) {',
    '    const registered = rendererRegistry.register(type, FixtureWidget);',
    '    if (!registered.ok) throw new Error(registered.error.message);',
    '  }',
    '  const failures = writable<ReadonlySet<string>>(new Set());',
    '  const hostContext: HostContext = { storyId: \'story-7\', failures };',
    '  const store = createWorkbenchStore({ initialState: initialState(), registry });',
    '  const catalog = createCatalogController(registry);',
    '  const readable = toSvelteWorkbenchStore(store);',
    '  registerPackedRuntime({',
    '    store,',
    '    failRenderer(title) { failures.update((current) => new Set([...current, title])); }',
    '  });',
    '</script>',
    '',
    '<main data-host-story-id={hostContext.storyId} data-revision={$readable.revision}>',
    '  <PanelTabs {store} />',
    '  <WorkbenchSurface {store}>',
    '    {#snippet renderWidget(frame)}',
    '      <WidgetFrame {frame} {store} {rendererRegistry} {hostContext} />',
    '    {/snippet}',
    '  </WorkbenchSurface>',
    '  <WidgetCatalog {catalog} oncreate={() => undefined} />',
    '  <section data-recipe-probe><RendererState title="Recipe Probe" state="unavailable" /></section>',
    '</main>',
    ''
  ].join('\n'));
  await writeFile(path.join(consumerRoot, 'src', 'renderer-harness.ts'), [
    "import { mount, tick, unmount } from 'svelte';",
    "import type { RendererHarness, RendererOperation, RendererSnapshot } from '@pomegranate-ui/testkit';",
    "import App from './App.svelte';",
    "import { getPackedRuntime } from './runtime.js';",
    '',
    'let component: ReturnType<typeof mount> | undefined;',
    'function root(): HTMLElement {',
    "  const element = document.querySelector<HTMLElement>('main[data-host-story-id]');",
    "  if (!element) throw new Error('Packed Svelte workbench is not mounted.');",
    '  return element;',
    '}',
    'function namedButton(name: string): HTMLButtonElement {',
    "  const match = [...root().querySelectorAll<HTMLButtonElement>('button')].find((button) => (button.getAttribute('aria-label') ?? button.textContent?.trim()) === name);",
    "  if (!match) throw new Error(`Button '${name}' is missing.`);",
    '  return match;',
    '}',
    'function widget(title: string): HTMLElement {',
    "  const match = [...root().querySelectorAll<HTMLElement>('[data-pomegranate-widget]')].find((entry) => entry.getAttribute('aria-label') === title);",
    "  if (!match) throw new Error(`Widget '${title}' is missing.`);",
    '  return match;',
    '}',
    'async function settle() { await tick(); await Promise.resolve(); await tick(); }',
    '',
    'export function createPackedRendererHarness(): RendererHarness {',
    '  return {',
    '    async reset() {',
    '      if (component) await unmount(component);',
    "      document.body.innerHTML = '<div id=app></div>';",
    "      component = mount(App, { target: document.getElementById('app')! });",
    '      await settle();',
    '    },',
    '    async snapshot(): Promise<RendererSnapshot> {',
    '      const workbench = root();',
    "      const tabs = [...workbench.querySelectorAll<HTMLButtonElement>('[role=tab]')];",
    "      const panel = workbench.querySelector<HTMLElement>('[role=tabpanel]');",
    "      const dockTitles = (edge: string) => [...workbench.querySelectorAll<HTMLElement>(`[data-pomegranate-dock=\"${edge}\"] [data-pomegranate-widget]`)].map((entry) => entry.getAttribute('aria-label')!);",
    "      const textList = (selector: string) => [...workbench.querySelectorAll<HTMLElement>(selector)].map((entry) => entry.textContent?.trim() ?? '').filter(Boolean);",
    '      return {',
    "        tabListName: workbench.querySelector('[role=tablist]')?.getAttribute('aria-label') ?? null,",
    '        tabs: tabs.map((tab) => ({',
    "          name: tab.textContent?.trim() ?? '', id: tab.id, controls: tab.getAttribute('aria-controls') ?? '', selected: tab.getAttribute('aria-selected') === 'true',",
    "          moveLeftDisabled: tab.parentElement?.querySelector<HTMLButtonElement>(`[aria-label=\"Move ${tab.textContent?.trim()} left\"]`)?.disabled ?? false,",
    "          moveRightDisabled: tab.parentElement?.querySelector<HTMLButtonElement>(`[aria-label=\"Move ${tab.textContent?.trim()} right\"]`)?.disabled ?? false",
    '        })),',
    "        panel: panel ? { id: panel.id, labelledBy: panel.getAttribute('aria-labelledby') ?? '' } : null,",
    "        docks: { left: dockTitles('left'), main: dockTitles('main'), right: dockTitles('right') },",
    "        floating: [...workbench.querySelectorAll<HTMLElement>('[data-pomegranate-floating-layer] [data-pomegranate-widget]')].map((entry) => entry.getAttribute('aria-label')!),",
    "        widgets: [...workbench.querySelectorAll<HTMLElement>('[data-pomegranate-widget]')].map((entry) => ({",
    "          title: entry.getAttribute('aria-label') ?? '', instanceId: entry.dataset.pomegranateWidget ?? '',",
    "          placement: entry.dataset.pomegranatePlacement as 'docked' | 'floating',",
    "          actionNames: [...entry.querySelectorAll('button')].map((button) => button.textContent?.trim() ?? '')",
    '        })),',
    "        statuses: textList('[role=status]'), alerts: textList('[role=alert]'),",
    "        activeElementName: document.activeElement?.textContent?.trim() || null,",
    "        hostStoryId: workbench.dataset.hostStoryId ?? '', revision: Number(workbench.dataset.revision)",
    '      };',
    '    },',
    '    async perform(operation: RendererOperation) {',
    "      if (operation.type === 'panel.activate') namedButton(operation.name).click();",
    "      else if (operation.type === 'panel.reorder') namedButton(`Move ${operation.name} ${operation.direction}`).click();",
    "      else if (operation.type === 'widget.place') {",
    '        const target = widget(operation.title);',
    "        const action = operation.destination === 'floating' ? 'Float' : `Dock ${operation.destination}`;",
    "        const button = [...target.querySelectorAll<HTMLButtonElement>('button')].find((entry) => entry.textContent?.trim() === action);",
    "        if (!button) throw new Error(`Widget action '${action}' is missing.`);",
    '        button.click();',
    "      } else if (operation.type === 'renderer.fail') getPackedRuntime().failRenderer(operation.title);",
    "      else if (operation.type === 'focus.next') namedButton('Library').focus();",
    '      await settle();',
    '    }',
    '  };',
    '}',
    '',
    'export async function disposePackedRendererHarness() {',
    '  if (component) await unmount(component);',
    '  component = undefined;',
    '  document.body.replaceChildren();',
    '}',
    ''
  ].join('\n'));
  await writeFile(path.join(consumerRoot, 'renderer-conformance.test.ts'), [
    "import { afterEach, expect, test } from 'vitest';",
    "import { assertRendererConformance, RENDERER_CONTRACT_IDS } from '@pomegranate-ui/testkit';",
    "import { createPackedRendererHarness, disposePackedRendererHarness } from './src/renderer-harness.js';",
    '',
    'afterEach(disposePackedRendererHarness);',
    "test('all copied Svelte recipes conform through a mounted consumer', async () => {",
    '  const results = await assertRendererConformance(createPackedRendererHarness());',
    '  expect(results).toHaveLength(Object.keys(RENDERER_CONTRACT_IDS).length);',
    '  expect(results.every((entry) => entry.passed)).toBe(true);',
    '});',
    ''
  ].join('\n'));

  runNode([
    path.join(root, 'scripts', 'verify-recipes.mjs'),
    '--copy', 'all', '--to', recipesRoot
  ], root);
}

const temporaryBase = await realpath(os.tmpdir());
let temporaryRoot;
try {
  temporaryRoot = await mkdtemp(path.join(temporaryBase, 'pomegranate-ui-pack-'));
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
    const resolvedTemporaryRoot = await realpath(temporaryRoot);
    if (path.dirname(resolvedTemporaryRoot) !== temporaryBase) {
      throw new Error(`Refusing to remove unexpected temporary path '${resolvedTemporaryRoot}'.`);
    }
    await rm(resolvedTemporaryRoot, { recursive: true, force: true });
  }
}
