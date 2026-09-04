import {
  PersistedThemeDraftV1Schema,
  PersistedThemeDraftSchema,
  ThemeCanvasDraftSchema,
  type PersistedThemeDraft,
  type ThemeCanvasDraft,
  type ThemeDraftStorage
} from '@pomegranate-ui/contracts';

export const LAB_THEME_DRAFT_KEY = 'pomegranate-ui.workbench-lab.theme-draft.v1' as const;
export const LAB_THEME_DRAFT_KEY_PREFIX = 'pomegranate-ui.workbench-lab.theme-draft.v2.' as const;

export function themeDraftStorageKey(baseTargetId: string): string {
  return `${LAB_THEME_DRAFT_KEY_PREFIX}${encodeURIComponent(baseTargetId)}`;
}

export type ThemeDraftCodecResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly message: string };

export function encodePersistedThemeDraft(input: unknown): ThemeDraftCodecResult<string> {
  const parsed = PersistedThemeDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Theme draft is invalid.' };
  return { ok: true, value: JSON.stringify(parsed.data) };
}

export function migratePersistedThemeDraft(
  input: unknown,
  canvasDefaults: ThemeCanvasDraft
): PersistedThemeDraft | null {
  const current = PersistedThemeDraftSchema.safeParse(input);
  if (current.success) return current.data;
  const legacy = PersistedThemeDraftV1Schema.safeParse(input);
  const canvas = ThemeCanvasDraftSchema.safeParse(canvasDefaults);
  if (!legacy.success || !canvas.success) return null;
  return PersistedThemeDraftSchema.parse({
    schemaVersion: 'pomegranate.ui.persisted-theme-draft.v2',
    draft: {
      ...legacy.data.draft,
      schemaVersion: 'pomegranate.ui.theme-draft.v2',
      canvas: canvas.data
    },
    ambient: legacy.data.ambient
  });
}

export function decodePersistedThemeDraft(
  raw: string,
  canvasDefaults?: ThemeCanvasDraft
): ThemeDraftCodecResult<PersistedThemeDraft> {
  try {
    const input = JSON.parse(raw);
    const parsed = PersistedThemeDraftSchema.safeParse(input);
    if (parsed.success) return { ok: true, value: parsed.data };
    const migrated = canvasDefaults ? migratePersistedThemeDraft(input, canvasDefaults) : null;
    return migrated
      ? { ok: true, value: migrated }
      : { ok: false, message: parsed.error.issues[0]?.message ?? 'Stored Theme draft is invalid.' };
  } catch {
    return { ok: false, message: 'Stored Theme draft is not valid JSON.' };
  }
}

export async function loadPersistedThemeDraft(
  storage: ThemeDraftStorage,
  canvasDefaults?: ThemeCanvasDraft,
  key: string = LAB_THEME_DRAFT_KEY
): Promise<ThemeDraftCodecResult<PersistedThemeDraft | null>> {
  try {
    const raw = await storage.load(key);
    if (raw === null) return { ok: true, value: null };
    return decodePersistedThemeDraft(raw, canvasDefaults);
  } catch {
    return { ok: false, message: 'Theme draft storage is unavailable.' };
  }
}

export async function savePersistedThemeDraft(
  storage: ThemeDraftStorage,
  draft: unknown,
  key: string = LAB_THEME_DRAFT_KEY
): Promise<ThemeDraftCodecResult<null>> {
  const encoded = encodePersistedThemeDraft(draft);
  if (!encoded.ok) return encoded;
  try {
    await storage.save(key, encoded.value);
    return { ok: true, value: null };
  } catch {
    return { ok: false, message: 'Theme draft storage is unavailable.' };
  }
}

export function createLocalThemeDraftStorage(
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
): ThemeDraftStorage {
  return Object.freeze({
    load: async (key: string) => storage.getItem(key),
    save: async (key: string, value: string) => { storage.setItem(key, value); },
    remove: async (key: string) => { storage.removeItem(key); }
  });
}
