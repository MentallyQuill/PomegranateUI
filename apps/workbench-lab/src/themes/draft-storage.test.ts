import { describe, expect, it } from 'vitest';

import type { PersistedThemeDraft, ThemeCanvasDraft, ThemeDraftStorage } from '@pomegranate-ui/contracts';
import {
  LAB_THEME_DRAFT_KEY,
  createLocalThemeDraftStorage,
  decodePersistedThemeDraft,
  encodePersistedThemeDraft,
  loadPersistedThemeDraft,
  migratePersistedThemeDraft,
  savePersistedThemeDraft
} from './draft-storage.js';

const canvasDefaults: ThemeCanvasDraft = {
  imageStrength: 72,
  overlayStrength: 56,
  gradientAngle: 90,
  vignetteStrength: 28
};

const fixture = (): PersistedThemeDraft => ({
  schemaVersion: 'pomegranate.ui.persisted-theme-draft.v2',
  draft: {
    schemaVersion: 'pomegranate.ui.theme-draft.v2',
    baseTargetId: 'ash-amber',
    colors: {
      canvas: '#242321', glass: '#302E2A', chrome: '#625B52',
      ambient: '#51493E', text: '#F3F0EA', source: '#D2B57A'
    },
    materials: { glassDensity: 20, barOpacity: 60, selectedStrength: 6, frostLevel: 50 },
    canvas: canvasDefaults
  },
  ambient: {
    schemaVersion: 'pomegranate.ui.ambient.v1', id: 'ash-amber', colorRole: 'selection',
    position: { x: 0.57, y: 0.97 }, radius: 0.6, power: 0.56
  }
});

describe('Theme draft storage', () => {
  it('encodes canonical schema order and decodes one exact record', () => {
    const encoded = encodePersistedThemeDraft(fixture());
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(encoded.value).toBe('{"schemaVersion":"pomegranate.ui.persisted-theme-draft.v2","draft":{"schemaVersion":"pomegranate.ui.theme-draft.v2","baseTargetId":"ash-amber","colors":{"canvas":"#242321","glass":"#302E2A","chrome":"#625B52","ambient":"#51493E","text":"#F3F0EA","source":"#D2B57A"},"materials":{"glassDensity":20,"barOpacity":60,"selectedStrength":6,"frostLevel":50},"canvas":{"imageStrength":72,"overlayStrength":56,"gradientAngle":90,"vignetteStrength":28}},"ambient":{"schemaVersion":"pomegranate.ui.ambient.v1","id":"ash-amber","colorRole":"selection","position":{"x":0.57,"y":0.97},"radius":0.6,"power":0.56}}');
    expect(decodePersistedThemeDraft(encoded.value)).toEqual({ ok: true, value: fixture() });
  });

  it('migrates one valid v1 record with preset-owned canvas defaults', () => {
    const current = fixture();
    const legacy = {
      schemaVersion: 'pomegranate.ui.persisted-theme-draft.v1',
      draft: {
        schemaVersion: 'pomegranate.ui.theme-draft.v1',
        baseTargetId: current.draft.baseTargetId,
        colors: current.draft.colors,
        materials: current.draft.materials
      },
      ambient: current.ambient
    };

    expect(migratePersistedThemeDraft(legacy, canvasDefaults)).toEqual(current);
  });

  it.each(['not JSON', '{}', '{"schemaVersion":"future.v9"}'])('rejects malformed or mismatched input: %s', (raw) => {
    expect(decodePersistedThemeDraft(raw).ok).toBe(false);
  });

  it('loads, saves, removes, and contains unavailable storage failures', async () => {
    const values = new Map<string, string>();
    const storage: ThemeDraftStorage = {
      load: async (key) => values.get(key) ?? null,
      save: async (key, value) => { values.set(key, value); },
      remove: async (key) => { values.delete(key); }
    };
    expect(await loadPersistedThemeDraft(storage, canvasDefaults)).toEqual({ ok: true, value: null });
    expect((await savePersistedThemeDraft(storage, fixture())).ok).toBe(true);
    expect(values.has(LAB_THEME_DRAFT_KEY)).toBe(true);
    expect(await loadPersistedThemeDraft(storage, canvasDefaults)).toEqual({ ok: true, value: fixture() });
    await storage.remove?.(LAB_THEME_DRAFT_KEY);
    expect(await loadPersistedThemeDraft(storage)).toEqual({ ok: true, value: null });

    const unavailable: ThemeDraftStorage = {
      load: async () => { throw new Error('unavailable'); },
      save: async () => { throw new Error('unavailable'); }
    };
    expect((await loadPersistedThemeDraft(unavailable, canvasDefaults)).ok).toBe(false);
    expect((await savePersistedThemeDraft(unavailable, fixture())).ok).toBe(false);
  });

  it('adapts browser storage without exposing it through contracts', async () => {
    window.localStorage.clear();
    const storage = createLocalThemeDraftStorage(window.localStorage);
    await storage.save('draft', 'value');
    expect(await storage.load('draft')).toBe('value');
    await storage.remove?.('draft');
    expect(await storage.load('draft')).toBeNull();
  });
});
