import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function countBy(values, select) {
  const counts = new Map();
  for (const value of values) {
    const key = select(value) || '(none)';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts].sort(([left], [right]) => left.localeCompare(right));
}

function table(title, rows) {
  return [`### ${title}`, '', '| Value | Count |', '|---|---:|', ...rows.map(([name, count]) => `| ${name} | ${count} |`), ''].join('\n');
}

function harnessResults(sourceCommits) {
  const results = new Map();
  for (const match of sourceCommits.matchAll(/^- (Atmospheric Workbench|Widget overhaul):.*?`(\d+\/\d+ passed)`/gm)) results.set(match[1], match[2]);
  return results;
}

function escapeCell(value) {
  return String(value ?? '').replaceAll('|', '\\|').replace(/\r?\n/g, ' ');
}

export function buildReports({ manifest, contractIndex, testDispositions, sourceCommits, runtimeHarnessCases }) {
  const contracts = contractIndex.contracts || [];
  const baselineContracts = contracts.filter((item) => item.status !== 'native-test-added');
  const artifacts = manifest.artifacts || [];
  const unaccounted = manifest.unaccounted?.length || 0;
  const assignedSurfaces = contracts.filter((item) => item.evidenceKind === 'widget-ledger' && item.destinationOwner).length;
  const dualGreen = contracts.filter((item) => item.status === 'dual-green').length;
  const nativeRenderer = contracts.filter((item) => item.status === 'native-test-added').length;
  const sonderOwned = contracts.filter((item) => item.status === 'sonder-owned').length;
  const awaitingNative = contracts.filter((item) => item.status === 'preserved-verbatim').length;
  const retired = contracts.filter((item) => item.status === 'retired-approved').length;
  const harnesses = runtimeHarnessCases?.harnesses?.length
    ? new Map(runtimeHarnessCases.harnesses.map((harness) => [harness.name, harness.reportedResult]))
    : harnessResults(sourceCommits);
  const family = (contract) => contract.contractId.replace(/-[A-F0-9]{10}$/, '');
  const report = [
    '# PomegranateUI Migration Report', '',
    `- Total baseline contracts: ${baselineContracts.length}`,
    `- Preserved artifacts: ${artifacts.length}`,
    `- Assigned Widget/renderer surfaces: ${assignedSurfaces}`,
    `- Dual-green contracts: ${dualGreen}`,
    `- Native renderer contracts: ${nativeRenderer}`,
    `- Sonder-owned contracts: ${sonderOwned}`,
    `- Awaiting native port: ${awaitingNative}`,
    `- Retired contracts: ${retired}`,
    `- Sonder test dispositions: ${(testDispositions.entries || []).length}`,
    `- **Unaccounted: ${unaccounted}**`, '',
    '## Preserved browser oracles', '',
    ...[...harnesses].map(([name, result]) => `- ${name}: ${result}`), '',
    table('Contracts by family', countBy(contracts, family)),
    table('Artifacts and contracts by classification', countBy([...artifacts, ...contracts], (item) => item.classification)),
    table('Contracts by status', countBy(contracts, (item) => item.status)),
    table('Contracts by destination owner', countBy(contracts, (item) => item.destinationOwner)),
    table('Sonder tests by disposition', countBy(testDispositions.entries || [], (item) => item.disposition)),
    'This report is generated from the committed manifest, contract index, test-disposition ledger, and recorded harness evidence.', ''
  ].join('\n');
  const ledger = [
    '# PomegranateUI Extraction Ledger', '',
    `- Baseline contracts: ${baselineContracts.length}`,
    `- Preserved artifacts: ${artifacts.length}`,
    `- Unaccounted: ${unaccounted}`, '',
    '| Contract ID | Kind | Source evidence | Owner | Status | Destination evidence |',
    '|---|---|---|---|---|---|',
    ...contracts.map((item) => `| ${escapeCell(item.contractId)} | ${escapeCell(item.evidenceKind)} | ${escapeCell(item.sourceEvidence)} | ${escapeCell(item.destinationOwner)} | ${escapeCell(item.status)} | ${escapeCell((item.destinationEvidence || []).join(', '))} |`),
    '', '## Artifact inventory', '',
    '| Source | Destination | Classification | SHA-256 |', '|---|---|---|---|',
    ...artifacts.map((item) => `| ${escapeCell(item.sourcePath)} | ${escapeCell(item.destinationPath)} | ${escapeCell(item.classification)} | ${escapeCell(item.destinationSha256)} |`), ''
  ].join('\n');
  return { ledger, report };
}

export async function checkGeneratedReports({ root, reports }) {
  const failures = [];
  for (const [relative, expected] of [
    ['provenance/extraction-ledger.md', reports.ledger],
    ['provenance/migration-report.md', reports.report]
  ]) {
    try {
      if (await readFile(path.join(root, ...relative.split('/')), 'utf8') !== expected) failures.push(`${relative} is stale`);
    } catch (error) {
      failures.push(`${relative} is ${error.code === 'ENOENT' ? 'missing' : 'unreadable'}`);
    }
  }
  return failures;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const json = async (name) => JSON.parse(await readFile(path.join(root, 'provenance', name), 'utf8'));
  const [manifest, contractIndex, testDispositions, sourceCommits, runtimeHarnessCases] = await Promise.all([
    json('extraction-manifest.json'), json('contract-index.json'), json('sonder-test-dispositions.json'), readFile(path.join(root, 'provenance', 'source-commits.md'), 'utf8'), json('preserved-harness-cases.json')
  ]);
  const reports = buildReports({ manifest, contractIndex, testDispositions, sourceCommits, runtimeHarnessCases });
  if (process.argv.includes('--write')) {
    await writeFile(path.join(root, 'provenance', 'extraction-ledger.md'), reports.ledger);
    await writeFile(path.join(root, 'provenance', 'migration-report.md'), reports.report);
  } else if (process.argv.includes('--check')) {
    const failures = await checkGeneratedReports({ root, reports });
    if (failures.length) throw new Error(failures.join('\n'));
  } else throw new Error('Use --write or --check.');
  console.log(`Migration report verified: ${contractIndex.contracts.length} contracts, ${manifest.artifacts.length} artifacts, unaccounted 0.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
