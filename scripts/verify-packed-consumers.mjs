import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageNames = ['contracts', 'layout', 'core', 'react', 'testkit'];
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

  process.stdout.write(`Packed consumer verification passed: ${packageNames.length} packages, ${exampleNames.length} clean consumers.\n`);
} finally {
  if (temporaryRoot) {
    const resolvedTemporaryRoot = path.resolve(temporaryRoot);
    if (path.dirname(resolvedTemporaryRoot) !== path.resolve(os.tmpdir())) {
      throw new Error(`Refusing to remove unexpected temporary path '${resolvedTemporaryRoot}'.`);
    }
    await rm(resolvedTemporaryRoot, { recursive: true, force: true });
  }
}
