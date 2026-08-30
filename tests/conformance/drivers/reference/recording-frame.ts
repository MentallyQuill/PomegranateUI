import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { PNG } from 'pngjs';

import { ConformanceError, type ConformanceScenario } from '../../types.ts';

export interface RecordingFrameReference {
  readonly absolutePath: string;
  readonly width: 1920;
  readonly height: 1280;
  readonly sha256: string;
  readonly landmarks: Readonly<Record<'upperLeft' | 'center' | 'lowerRight', readonly [number, number, number, number]>>;
}

function pixel(png: PNG, x: number, y: number): readonly [number, number, number, number] {
  const offset = (png.width * y + x) * 4;
  return Object.freeze([
    png.data[offset] ?? 0,
    png.data[offset + 1] ?? 0,
    png.data[offset + 2] ?? 0,
    png.data[offset + 3] ?? 0
  ] as const);
}

export async function readRecordingFrame(
  repositoryRoot: string,
  scenario: ConformanceScenario
): Promise<RecordingFrameReference> {
  try {
    const absolutePath = path.resolve(repositoryRoot, scenario.authorityPath);
    const relativePath = path.relative(repositoryRoot, absolutePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) throw new Error('frame path escaped the repository');
    const bytes = await readFile(absolutePath);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (sha256 !== scenario.authoritySha256?.toLowerCase()) {
      throw new ConformanceError('REFERENCE_HASH_DRIFT', `Recording frame hash drifted for ${scenario.id}.`, {
        actualSha256: sha256,
        expectedSha256: scenario.authoritySha256
      });
    }
    const png = PNG.sync.read(bytes);
    if (png.width !== 1920 || png.height !== 1280) throw new Error(`expected 1920x1280, received ${png.width}x${png.height}`);
    return Object.freeze({
      absolutePath,
      width: 1920,
      height: 1280,
      sha256,
      landmarks: Object.freeze({
        upperLeft: pixel(png, 96, 96),
        center: pixel(png, 960, 640),
        lowerRight: pixel(png, 1824, 1184)
      })
    });
  } catch (cause) {
    if (cause instanceof ConformanceError) throw cause;
    throw new ConformanceError('REFERENCE_SETUP_FAILED', `Recording reference failed for ${scenario.id}.`, {
      cause: cause instanceof Error ? cause.message : String(cause),
      scenarioId: scenario.id
    });
  }
}
