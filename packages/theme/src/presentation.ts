import {
  PresentationProfileDefinitionSchema,
  type CanvasDefinition,
  type PresentationProfileDefinition
} from '@pomegranate-ui/contracts';

export type PresentationOpacity = '0' | '1';
export type PresentationDisplay = 'none' | 'inline' | 'inline-grid';

export interface PresentationBindings {
  readonly '--pom-presentation-slider-track-opacity': PresentationOpacity;
  readonly '--pom-presentation-slider-fill-opacity': PresentationOpacity;
  readonly '--pom-presentation-slider-thumb-opacity': PresentationOpacity;
  readonly '--pom-presentation-action-icon-display': Extract<PresentationDisplay, 'none' | 'inline-grid'>;
  readonly '--pom-presentation-action-label-display': Extract<PresentationDisplay, 'none' | 'inline'>;
}

export type PresentationDiagnosticCode =
  | 'PRESENTATION_PROFILE_INVALID'
  | 'PRESENTATION_CANVAS_BLUR_FORBIDDEN';

export interface PresentationDiagnostic {
  readonly code: PresentationDiagnosticCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export type PresentationCompilationResult =
  | {
      readonly ok: true;
      readonly profile: PresentationProfileDefinition;
      readonly bindings: PresentationBindings;
      readonly diagnostics: readonly [];
    }
  | {
      readonly ok: false;
      readonly diagnostics: readonly PresentationDiagnostic[];
    };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

export const DEFAULT_PRESENTATION_PROFILE: PresentationProfileDefinition = deepFreeze({
  schemaVersion: 'pomegranate.ui.presentation-profile.v1',
  id: 'default-presentation',
  slider: {
    trackVisibility: 'visible',
    fillVisibility: 'visible',
    thumbVisibility: 'visible'
  },
  actions: { content: 'text' },
  canvas: { blurPolicy: 'allow' }
});

const DEFAULT_PRESENTATION_BINDINGS: PresentationBindings = deepFreeze({
  '--pom-presentation-slider-track-opacity': '1',
  '--pom-presentation-slider-fill-opacity': '1',
  '--pom-presentation-slider-thumb-opacity': '1',
  '--pom-presentation-action-icon-display': 'none',
  '--pom-presentation-action-label-display': 'inline'
});

export function compilePresentationProfile(
  input: unknown | undefined,
  canvas: CanvasDefinition
): PresentationCompilationResult {
  const parsed = input === undefined
    ? { success: true as const, data: DEFAULT_PRESENTATION_PROFILE }
    : PresentationProfileDefinitionSchema.safeParse(input);

  if (!parsed.success) {
    return deepFreeze({
      ok: false,
      diagnostics: parsed.error.issues.map((issue) => ({
        code: 'PRESENTATION_PROFILE_INVALID',
        path: ['profile', ...issue.path.map((part) => typeof part === 'number' ? part : String(part))],
        message: issue.message
      }))
    });
  }

  const profile = parsed.data;
  if (profile.canvas.blurPolicy === 'forbid') {
    const diagnostics: PresentationDiagnostic[] = [];
    canvas.layers.forEach((layer, index) => {
      if (layer.kind === 'image' && layer.blurPx > 0) {
        diagnostics.push({
          code: 'PRESENTATION_CANVAS_BLUR_FORBIDDEN',
          path: ['canvas', 'layers', index, 'blurPx'],
          message: `Canvas image layer ${index} has blurPx ${layer.blurPx}, but this presentation profile forbids blur.`
        });
      }
    });
    if (diagnostics.length > 0) return deepFreeze({ ok: false, diagnostics });
  }

  const iconVisible = profile.actions.content !== 'text';
  const labelVisible = profile.actions.content !== 'icon';
  const bindings: PresentationBindings = {
    '--pom-presentation-slider-track-opacity': profile.slider.trackVisibility === 'visible' ? '1' : '0',
    '--pom-presentation-slider-fill-opacity': profile.slider.fillVisibility === 'visible' ? '1' : '0',
    '--pom-presentation-slider-thumb-opacity': profile.slider.thumbVisibility === 'visible' ? '1' : '0',
    '--pom-presentation-action-icon-display': iconVisible ? 'inline-grid' : 'none',
    '--pom-presentation-action-label-display': labelVisible ? 'inline' : 'none'
  };

  return deepFreeze({
    ok: true,
    profile,
    bindings: input === undefined ? DEFAULT_PRESENTATION_BINDINGS : bindings,
    diagnostics: []
  });
}
