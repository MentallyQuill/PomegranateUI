import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recipesRoot = path.join(root, 'registry', 'recipes');
const manifestPath = path.join(recipesRoot, 'recipe-manifest.json');
const installRecordName = '.pomegranate-recipes.json';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function loadManifest() {
  return JSON.parse(await readFile(manifestPath, 'utf8'));
}

async function actualRecipeFiles(recipe) {
  return (await readdir(path.join(recipesRoot, recipe.id), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svelte'))
    .map((entry) => entry.name)
    .sort();
}

async function inspect(manifest) {
  const findings = [];
  if (manifest.schema !== 'pomegranate.ui.recipes.v1') findings.push('RECIPE_SCHEMA_INVALID');
  const ids = manifest.recipes.map((entry) => entry.id);
  if (ids.join('|') !== [...ids].sort().join('|')) findings.push('RECIPE_ORDER_UNSTABLE');
  if (new Set(ids).size !== ids.length) findings.push('RECIPE_ID_DUPLICATE');
  const hashes = new Map();
  for (const recipe of manifest.recipes) {
    if (recipe.revision !== 1) findings.push(`RECIPE_REVISION_INVALID: ${recipe.id}`);
    if (recipe.compatiblePomegranateRange !== '>=0.1.0-private.0 <0.2.0') {
      findings.push(`RECIPE_RANGE_INVALID: ${recipe.id}`);
    }
    if (!recipe.dependencies.includes('svelte')) findings.push(`RECIPE_SVELTE_DEPENDENCY_MISSING: ${recipe.id}`);
    if (!recipe.rendererContractIds.length) findings.push(`RECIPE_CONTRACTS_MISSING: ${recipe.id}`);
    if (recipe.files.some((file) => file.includes('\\') || path.posix.isAbsolute(file) || file.includes('..'))) {
      findings.push(`RECIPE_PATH_INVALID: ${recipe.id}`);
    }
    const actualFiles = await actualRecipeFiles(recipe);
    if (actualFiles.join('|') !== [...recipe.files].sort().join('|')) {
      findings.push(`RECIPE_OWNED_FILES_MISMATCH: ${recipe.id}`);
    }
    for (const file of recipe.files) {
      const sourcePath = path.join(recipesRoot, recipe.id, ...file.split('/'));
      const actualHash = sha256(await readFile(sourcePath));
      hashes.set(`${recipe.id}/${file}`, actualHash);
      if (recipe.sha256[file] !== actualHash) findings.push(`RECIPE_HASH_MISMATCH: ${recipe.id}/${file}`);
    }
    if (Object.keys(recipe.sha256).join('|') !== recipe.files.join('|')) {
      findings.push(`RECIPE_HASH_KEYS_MISMATCH: ${recipe.id}`);
    }
  }
  return { findings: [...new Set(findings)].sort(), hashes };
}

async function writeHashes(manifest) {
  for (const recipe of manifest.recipes) {
    const next = {};
    for (const file of recipe.files) {
      next[file] = sha256(await readFile(path.join(recipesRoot, recipe.id, ...file.split('/'))));
    }
    recipe.sha256 = next;
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Recipe registry written: ${manifest.recipes.length} recipes.`);
}

async function loadInstallRecord(target) {
  const recordPath = path.join(target, installRecordName);
  if (!await exists(recordPath)) return { schema: 'pomegranate.ui.recipe-install.v1', recipes: {} };
  const record = JSON.parse(await readFile(recordPath, 'utf8'));
  if (record.schema !== 'pomegranate.ui.recipe-install.v1') throw new Error('RECIPE_INSTALL_RECORD_INVALID');
  return record;
}

async function copyRecipes(manifest, requested, targetArgument) {
  if (!targetArgument) throw new Error('RECIPE_DESTINATION_REQUIRED');
  const target = path.resolve(root, targetArgument);
  const selected = requested === 'all'
    ? manifest.recipes
    : manifest.recipes.filter((entry) => entry.id === requested);
  if (selected.length === 0) throw new Error(`RECIPE_UNKNOWN: ${requested}`);
  await mkdir(target, { recursive: true });
  const record = await loadInstallRecord(target);
  for (const recipe of selected) {
    for (const file of recipe.files) {
      const source = path.join(recipesRoot, recipe.id, ...file.split('/'));
      const destinationName = path.posix.basename(file);
      const destination = path.join(target, destinationName);
      const sourceBytes = await readFile(source);
      const sourceHash = sha256(sourceBytes);
      if (await exists(destination)) {
        const destinationHash = sha256(await readFile(destination));
        const recordedHash = record.recipes[recipe.id]?.files?.[destinationName];
        if (destinationHash !== (recordedHash ?? sourceHash)) {
          throw new Error(`RECIPE_DESTINATION_MODIFIED: ${destinationName}`);
        }
      }
      await writeFile(destination, sourceBytes);
      record.recipes[recipe.id] = {
        revision: recipe.revision,
        files: { [destinationName]: sourceHash }
      };
    }
  }
  await writeFile(path.join(target, installRecordName), `${JSON.stringify(record, null, 2)}\n`);
  console.log(`Copied ${selected.length} recipe${selected.length === 1 ? '' : 's'} to ${target}.`);
}

async function main() {
  const args = process.argv.slice(2);
  const manifest = await loadManifest();
  if (args.includes('--write')) {
    await writeHashes(manifest);
    return;
  }
  const copyIndex = args.indexOf('--copy');
  if (copyIndex >= 0) {
    const targetIndex = args.indexOf('--to');
    await copyRecipes(manifest, args[copyIndex + 1], targetIndex >= 0 ? args[targetIndex + 1] : undefined);
    return;
  }
  if (!args.includes('--check')) throw new Error('Use --check, --write, or --copy <id|all> --to <directory>.');
  const { findings } = await inspect(manifest);
  if (findings.length) throw new Error(findings.join('\n'));
  const fileCount = manifest.recipes.reduce((total, recipe) => total + recipe.files.length, 0);
  console.log(`Recipe registry verified: ${manifest.recipes.length} recipes, ${fileCount} files.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
