import {
  PersistedThemeDraftSchema,
  type PersistedThemeDraft,
  type ThemeDraftStorage
} from '@pomegranate-ui/contracts';

export const LAB_THEME_DRAFT_KEY = 'pomegranate-ui.workbench-lab.theme-draft.v1' as const;

export type ThemeDraftCodecResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly message: string };

export function encodePersistedThemeDraft(input: unknown): ThemeDraftCodecResult<string> {
  const parsed = PersistedThemeDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Theme draft is invalid.' };
  return { ok: true, value: JSON.stringify(parsed.data) };
}

export function decodePersistedThemeDraft(raw: string): ThemeDraftCodecResult<PersistedThemeDraft> {
  try {
    const parsed = PersistedThemeDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success
      ? { ok: true, value: parsed.data }
      : { ok: false, message: parsed.error.issues[0]?.message ?? 'Stored Theme draft is invalid.' };
  } catch {
    return { ok: false, message: 'Stored Theme draft is not valid JSON.' };
  }
}

export async function loadPersistedThemeDraft(
  storage: ThemeDraftStorage,
  key = LAB_THEME_DRAFT_KEY
): Promise<ThemeDraftCodecResult<PersistedThemeDraft | null>> {
  try {
    const raw = await storage.load(key);
    if (raw === null) return { ok: true, value: null };
    return decodePersistedThemeDraft(raw);
  } catch {
    return { ok: false, message: 'Theme draft storage is unavailable.' };
  }
}

export async function savePersistedThemeDraft(
  storage: ThemeDraftStorage,
  draft: unknown,
  key = LAB_THEME_DRAFT_KEY
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
