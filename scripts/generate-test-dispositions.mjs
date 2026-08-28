import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEST_EVIDENCE_PATTERN = String.raw`panel|widget|catalog|dock|float|drag|layout|responsive|accessib|focus|keyboard|theme|transcript|composer|preview|frontend|\bui\b`;
const VALID_DISPOSITIONS = new Set([
  'pomegranate-generic-preserved-reference',
  'sonder-consumer-contract',
  'sonder-backend-authority',
  'not-ui-evidence'
]);

function git(sourceRoot, args, { allowFailure = false } = {}) {
  const result = spawnSync('git', ['-C', sourceRoot, ...args], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) throw new Error(String(result.stderr || result.stdout).trim());
  return result;
}

export function discoverSonderTestCandidates({ sourceRoot, sourceCommit, fallbackCandidates = [] }) {
  const tree = git(sourceRoot, ['ls-tree', '-r', '--name-only', sourceCommit, '--', 'tests'], { allowFailure: true });
  if (tree.status !== 0) return [...fallbackCandidates].sort();
  const all = tree.stdout.split(/\r?\n/).filter((entry) => /^tests\/.+\.(?:py|js|mjs|html)$/i.test(entry));
  const selected = new Set(all.filter((entry) => new RegExp(TEST_EVIDENCE_PATTERN, 'i').test(entry)));
  const grep = git(sourceRoot, ['grep', '-Il', '-E', TEST_EVIDENCE_PATTERN, sourceCommit, '--', 'tests'], { allowFailure: true });
  if (grep.status === 0) {
    for (const line of grep.stdout.split(/\r?\n/).filter(Boolean)) {
      const marker = line.indexOf(':tests/');
      selected.add(marker >= 0 ? line.slice(marker + 1) : line);
    }
  }
  return [...selected].filter((entry) => all.includes(entry)).sort();
}

function familyForPath(sourcePath, contractIndex) {
  const terms = sourcePath.toLowerCase();
  const preferred = terms.includes('access') || terms.includes('focus') || terms.includes('keyboard') ? 'POM-A11Y-'
    : terms.includes('drag') ? 'POM-DRAG-'
      : terms.includes('catalog') ? 'POM-CATALOG-'
        : terms.includes('theme') ? 'POM-THEME-'
          : terms.includes('responsive') ? 'POM-RESPONSIVE-'
            : terms.includes('persist') ? 'POM-PERSIST-'
              : terms.includes('panel') ? 'POM-PANEL-'
                : 'POM-WIDGET-';
  return contractIndex.contracts.find((contract) => contract.contractId.startsWith(preferred) && contract.status !== 'sonder-owned')?.contractId
    || contractIndex.contracts.find((contract) => contract.status !== 'sonder-owned')?.contractId;
}

export function buildTestDispositions({ candidates, sourceCommit, contractIndex }) {
  const genericPattern = /(?:composer_renderer_contract|darkreader_lock|dialogue_color|ui_(?:atmosphere_tools_contracts|catalog_extraction|foundation|icon_system|next_entry|play_contracts|shell_contracts)\.py$)/i;
  const consumerPattern = /(?:character_card_psychology_ui|host_settings_surface|ui_(?:character_persona_editor_contracts|library_authoring_contracts|library_contracts|live_story_tools_contracts|runtime_contracts|runtime_routes|settings_contracts|story_author_tools_contracts|story_tools_contracts)\.py$)/i;
  const metaPattern = /ui_(?:baseline_recorder|foundation_report|replacement_control_plane|replacement_inventory|wp12_contracts|wp13_cutover|wp14_release)\.py$/i;
  const entries = candidates.map((sourcePath) => {
    const generic = genericPattern.test(sourcePath);
    const disposition = generic ? 'pomegranate-generic-preserved-reference'
      : consumerPattern.test(sourcePath) ? 'sonder-consumer-contract'
        : metaPattern.test(sourcePath) ? 'not-ui-evidence'
          : 'sonder-backend-authority';
    const contractIds = generic ? [familyForPath(sourcePath, contractIndex)] : [];
    return {
      sourcePath,
      disposition,
      rationale: generic
        ? 'This test supplies preserved reference evidence for reusable frontend interaction behavior.'
        : disposition === 'sonder-consumer-contract'
          ? 'This test proves Sonder adapter or host integration behavior and remains in the consumer suite.'
          : disposition === 'not-ui-evidence'
            ? 'This is extraction, inventory, or release-process evidence rather than a reusable UI behavior contract.'
            : 'This test proves Sonder runtime or backend authority and remains owned by Sonder.',
      contractIds
    };
  });
  return { schemaVersion: 1, sourceCommit, discoveryPattern: TEST_EVIDENCE_PATTERN, entries };
}

export function validateTestDispositions({ candidates, dispositions, contractIndex }) {
  const findings = [];
  const knownContracts = new Set(contractIndex.contracts.map((item) => item.contractId));
  const paths = dispositions.entries?.map((item) => item.sourcePath) || [];
  for (const pathValue of candidates) {
    const count = paths.filter((entry) => entry === pathValue).length;
    if (count !== 1) findings.push(`${pathValue}: expected exactly one disposition, found ${count}`);
  }
  for (const entry of dispositions.entries || []) {
    if (!candidates.includes(entry.sourcePath)) findings.push(`${entry.sourcePath}: stale disposition`);
    if (!VALID_DISPOSITIONS.has(entry.disposition)) findings.push(`${entry.sourcePath}: invalid disposition`);
    if (!entry.rationale?.trim()) findings.push(`${entry.sourcePath}: empty rationale`);
    if (entry.disposition === 'pomegranate-generic-preserved-reference') {
      if (!entry.contractIds?.length) findings.push(`${entry.sourcePath}: generic evidence lacks a contract ID`);
      for (const id of entry.contractIds || []) if (!knownContracts.has(id)) findings.push(`${entry.sourcePath}: unknown contract ID ${id}`);
    }
  }
  return findings.sort();
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const manifestPath = path.join(root, 'provenance', 'extraction-manifest.json');
  const indexPath = path.join(root, 'provenance', 'contract-index.json');
  const outputPath = path.join(root, 'provenance', 'sonder-test-dispositions.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const contractIndex = JSON.parse(await readFile(indexPath, 'utf8'));
  const sourceRoot = process.env.PUI_SONDER_ROOT || 'F:/git/Sonder_Engine';
  const candidates = discoverSonderTestCandidates({ sourceRoot, sourceCommit: manifest.baseline.sourceCommit });
  if (!candidates.length) throw new Error('No relevant Sonder test candidates were discovered.');
  const dispositions = buildTestDispositions({ candidates, sourceCommit: manifest.baseline.sourceCommit, contractIndex });
  const findings = validateTestDispositions({ candidates, dispositions, contractIndex });
  if (findings.length) throw new Error(findings.join('\n'));
  contractIndex.sonderTests = dispositions.entries;
  manifest.testDispositions = { path: 'provenance/sonder-test-dispositions.json', count: dispositions.entries.length };
  await writeFile(outputPath, `${JSON.stringify(dispositions, null, 2)}\n`);
  await writeFile(indexPath, `${JSON.stringify(contractIndex, null, 2)}\n`);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ candidates: candidates.length, byDisposition: Object.fromEntries([...VALID_DISPOSITIONS].map((value) => [value, dispositions.entries.filter((item) => item.disposition === value).length])) })}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
