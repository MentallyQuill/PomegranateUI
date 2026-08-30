import { createHash } from 'node:crypto';

import { normalizeMeasurement } from './normalize.ts';
import { ConformanceError, type ConformanceScenario } from './types.ts';

export const DEEP_FIDELITY_REGRESSION_REVIEW_SCHEMA_VERSION = 'pomegranate.ui.deep-fidelity-toolkit-regression-review.v1' as const;
export const DEEP_FIDELITY_REGRESSION_REVIEW_CRITIC = 'source-gated-toolkit-regression' as const;

export interface FidelityRegressionReview {
  readonly schemaVersion: typeof DEEP_FIDELITY_REGRESSION_REVIEW_SCHEMA_VERSION;
  readonly critic: typeof DEEP_FIDELITY_REGRESSION_REVIEW_CRITIC;
  readonly ledgerId: string;
  readonly authority: {
    readonly id: string;
    readonly path: string;
    readonly sha256: string;
  };
  readonly authorityMeasurementSha256: string;
  readonly recordingLandmarksSha256: string | null;
  readonly expectedSha256: string;
  readonly reviewSha256: string;
}

export function hashReviewValue(value: unknown): string {
  const serialized = JSON.stringify(normalizeMeasurement(value));
  if (serialized === undefined) throw new ConformanceError('MANIFEST_INVALID', 'Review evidence is not JSON-serializable.');
  return createHash('sha256').update(serialized).digest('hex');
}

function reviewPayload(review: Omit<FidelityRegressionReview, 'reviewSha256'>): Omit<FidelityRegressionReview, 'reviewSha256'> {
  return {
    schemaVersion: review.schemaVersion,
    critic: review.critic,
    ledgerId: review.ledgerId,
    authority: review.authority,
    authorityMeasurementSha256: review.authorityMeasurementSha256,
    recordingLandmarksSha256: review.recordingLandmarksSha256,
    expectedSha256: review.expectedSha256
  };
}

export function validateFidelityRegressionReview({
  scenario,
  ledgerId,
  expected,
  reference,
  recordingLandmarks,
  review
}: {
  readonly scenario: ConformanceScenario;
  readonly ledgerId: string;
  readonly expected: unknown;
  readonly reference: unknown;
  readonly recordingLandmarks: unknown | null;
  readonly review: FidelityRegressionReview;
}): void {
  if (review.schemaVersion !== DEEP_FIDELITY_REGRESSION_REVIEW_SCHEMA_VERSION || review.critic !== DEEP_FIDELITY_REGRESSION_REVIEW_CRITIC) {
    throw new ConformanceError('MANIFEST_INVALID', `Deep fidelity regression review metadata drifted for ${scenario.id}.`);
  }
  if (review.ledgerId !== ledgerId) {
    throw new ConformanceError('MANIFEST_INVALID', `Deep fidelity critic ledger link drifted for ${scenario.id}.`);
  }
  if (
    review.authority.id !== scenario.authority
    || review.authority.path !== scenario.authorityPath
    || review.authority.sha256 !== scenario.authoritySha256
  ) {
    throw new ConformanceError('REFERENCE_HASH_DRIFT', `Deep fidelity authority binding drifted for ${scenario.id}.`);
  }
  const authorityMeasurementSha256 = hashReviewValue(reference);
  if (review.authorityMeasurementSha256 !== authorityMeasurementSha256) {
    throw new ConformanceError('REFERENCE_HASH_DRIFT', `Deep fidelity authority measurement hash drifted for ${scenario.id}: expected ${review.authorityMeasurementSha256}, received ${authorityMeasurementSha256}.`, {
      actualSha256: authorityMeasurementSha256,
      expectedSha256: review.authorityMeasurementSha256
    });
  }
  const landmarksSha256 = recordingLandmarks === null ? null : hashReviewValue(recordingLandmarks);
  if (review.recordingLandmarksSha256 !== landmarksSha256) {
    throw new ConformanceError('REFERENCE_HASH_DRIFT', `Deep fidelity recording landmark hash drifted for ${scenario.id}.`, {
      actualSha256: landmarksSha256,
      expectedSha256: review.recordingLandmarksSha256
    });
  }
  if (review.expectedSha256 !== hashReviewValue(expected)) {
    throw new ConformanceError('MANIFEST_INVALID', `Deep fidelity expected measurement hash drifted for ${scenario.id}.`);
  }
  const { reviewSha256, ...payload } = review;
  if (reviewSha256 !== hashReviewValue(reviewPayload(payload))) {
    throw new ConformanceError('MANIFEST_INVALID', `Deep fidelity regression critic hash drifted for ${scenario.id}.`);
  }
}
