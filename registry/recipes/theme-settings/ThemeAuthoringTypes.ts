import { PersistedThemeDraftSchema, type PersistedThemeDraft, type ThemeDraftColorRole, type ThemeTypography, type ThemeTypographyRole } from '@pomegranate-ui/contracts';

export type ThemeTypographyRoleId = 'ui' | 'prose' | 'display' | 'technical';
export type ThemeTypographyScaleId = keyof ThemeTypography['scale'];

export interface BundledFontChoice {
  readonly family: string;
  readonly label: string;
  readonly fallbacks: ThemeTypographyRole['fallbacks'];
}

export interface ThemeAuthoringDiagnostic {
  readonly message: string;
  readonly path: readonly (string | number)[];
}

export interface ThemeAuthoringSnapshot {
  readonly editable: unknown;
  readonly lastValidEditable: PersistedThemeDraft;
  readonly applied: { readonly resolved: { readonly theme: { readonly label: string; readonly typography: ThemeTypography } } };
  readonly diagnostics: readonly ThemeAuthoringDiagnostic[];
  readonly canvasAvailability: { readonly image: boolean; readonly overlay: boolean; readonly gradient: boolean; readonly vignette: boolean };
  readonly colorInputs: {
    readonly hex: Readonly<Record<ThemeDraftColorRole, string>>;
    readonly rgb: Readonly<Record<ThemeDraftColorRole, readonly [string, string, string]>>;
  };
  readonly dirty: boolean;
  readonly saving: boolean;
}

export interface ThemeAuthoringResult {
  readonly ok: boolean;
  readonly authoring: ThemeAuthoringSnapshot;
  readonly diagnostics?: readonly ThemeAuthoringDiagnostic[];
}

export interface ThemeAuthoringPort {
  readonly authoring: ThemeAuthoringSnapshot;
  readonly fontChoices: Readonly<Record<ThemeTypographyRoleId, readonly BundledFontChoice[]>>;
  readonly editDraft: (next: unknown) => ThemeAuthoringResult;
  readonly editColorHex: (role: ThemeDraftColorRole, value: string) => ThemeAuthoringResult;
  readonly editColorRgb: (role: ThemeDraftColorRole, channel: 0 | 1 | 2, value: string) => ThemeAuthoringResult;
  readonly editTypographyRole: (role: ThemeTypographyRoleId, patch: Partial<ThemeTypographyRole>) => ThemeAuthoringResult;
  readonly editTypographyScale: (step: ThemeTypographyScaleId, value: number) => ThemeAuthoringResult;
  readonly resetTypography: () => ThemeAuthoringResult;
  readonly resetDraft: () => ThemeAuthoringResult;
  readonly saveDraft: () => Promise<ThemeAuthoringResult>;
}

export interface EyeDropperPort {
  available(): boolean;
  sample(): Promise<string | null>;
}

export function editableThemeDraft(theme: ThemeAuthoringPort): PersistedThemeDraft {
  const editable = PersistedThemeDraftSchema.safeParse(theme.authoring.editable);
  if (editable.success) return structuredClone(editable.data);
  const raw = structuredClone(theme.authoring.editable) as Record<string, unknown> | null;
  const draft = raw && typeof raw === 'object' ? raw.draft as Record<string, unknown> | null : null;
  if (draft && typeof draft === 'object' && draft.colors && typeof draft.colors === 'object' && draft.materials && typeof draft.materials === 'object' && draft.canvas && typeof draft.canvas === 'object' && raw?.ambient && typeof raw.ambient === 'object') return raw as unknown as PersistedThemeDraft;
  return structuredClone(theme.authoring.lastValidEditable);
}

export function diagnosticsFor(theme: ThemeAuthoringPort, prefixes: readonly string[]): readonly ThemeAuthoringDiagnostic[] {
  return theme.authoring.diagnostics.filter(({ path }) => path.some((part) => prefixes.includes(String(part))));
}
