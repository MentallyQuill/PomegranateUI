import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createImageDiff } from '../../scripts/conformance/image-diff.mjs';
import { normalizeMeasurement } from './normalize.ts';
import { ConformanceError } from './types.ts';

export interface EvidencePaths {
  readonly directory: string;
  readonly referencePng: string;
  readonly actualPng: string;
  readonly overlayPng: string;
  readonly diffPng: string;
  readonly measurementsJson: string;
  readonly reportJson: string;
}

export interface ImageDiffSummary {
  readonly compatible: boolean;
  readonly reference: { readonly width: number; readonly height: number };
  readonly actual: { readonly width: number; readonly height: number };
  readonly differingPixels: number | null;
  readonly maximumChannelDelta: number | null;
}

export function createEvidencePaths(outputDirectory: string, scenarioId: string): EvidencePaths {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(scenarioId)) {
    throw new ConformanceError(
      'MANIFEST_INVALID',
      `Unsafe evidence scenario identity: ${scenarioId}.`,
      { scenarioId }
    );
  }
  const directory = path.resolve(outputDirectory);
  return Object.freeze({
    directory,
    referencePng: path.join(directory, `${scenarioId}.reference.png`),
    actualPng: path.join(directory, `${scenarioId}.actual.png`),
    overlayPng: path.join(directory, `${scenarioId}.overlay.png`),
    diffPng: path.join(directory, `${scenarioId}.diff.png`),
    measurementsJson: path.join(directory, `${scenarioId}.measurements.json`),
    reportJson: path.join(directory, `${scenarioId}.report.json`)
  });
}

let temporaryFileSequence = 0;

async function writeStableJson(targetPath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(targetPath), { recursive: true });
  const body = `${JSON.stringify(normalizeMeasurement(value), null, 2)}\n`;
  temporaryFileSequence += 1;
  const temporaryPath = `${targetPath}.${process.pid}.${temporaryFileSequence}.tmp`;
  await writeFile(temporaryPath, body, { encoding: 'utf8', flag: 'wx' });
  await rename(temporaryPath, targetPath);
}

export async function writeComparisonReport(paths: EvidencePaths, report: unknown): Promise<void> {
  await writeStableJson(paths.reportJson, report);
}

export async function writeMeasurementEvidence(paths: EvidencePaths, measurements: unknown): Promise<void> {
  await writeStableJson(paths.measurementsJson, measurements);
}

export async function createDiagnosticImages(
  referencePath: string,
  actualPath: string,
  paths: EvidencePaths
): Promise<ImageDiffSummary> {
  const result = createImageDiff(await readFile(referencePath), await readFile(actualPath));
  if (result.overlay && result.diff) {
    await mkdir(paths.directory, { recursive: true });
    await Promise.all([
      writeFile(paths.overlayPng, result.overlay),
      writeFile(paths.diffPng, result.diff)
    ]);
  }
  return result.summary;
}
