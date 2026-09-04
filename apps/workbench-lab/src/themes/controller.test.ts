import { describe, expect, it } from 'vitest';

import type { PersistedThemeDraft, ThemeDraftStorage } from '@pomegranate-ui/contracts';
import { createLabThemeController } from './controller.js';
import { decodePersistedThemeDraft, LAB_THEME_DRAFT_KEY, themeDraftStorageKey } from './draft-storage.js';

function memoryStorage() {
  const values = new Map<string, string>();
  const storage: ThemeDraftStorage = {
    load: async (key) => values.get(key) ?? null,
    save: async (key, value) => { values.set(key, value); },
    remove: async (key) => { values.delete(key); }
  };
  return { values, storage };
}

function editable(controller: ReturnType<typeof createLabThemeController>): PersistedThemeDraft {
  return structuredClone(controller.getAuthoringSnapshot().editable) as PersistedThemeDraft;
}

describe('Lab Theme authoring controller', () => {
  it('applies typography roles and scale edits live through compiled bindings', () => {
    const controller = createLabThemeController({ initialId: 'bunny' });

    expect(controller.editTypographyRole('prose', {
      family: 'Alegreya',
      fallbacks: ['ui-serif', 'serif'],
      lineHeight: 1.7,
      trackingEm: 0.02
    }).ok).toBe(true);
    expect(controller.editTypographyScale('lg', 19).ok).toBe(true);

    expect(controller.getSnapshot().compiled.bindings).toMatchObject({
      '--pom-font-prose': '"Alegreya", ui-serif, serif',
      '--pom-font-prose-line-height': '1.7',
      '--pom-font-prose-tracking': '0.02em',
      '--pom-type-lg': '19px'
    });
  });

  it('keeps typography choices independent while switching themes', () => {
    const controller = createLabThemeController({ initialId: 'bunny' });
    expect(controller.editTypographyRole('prose', {
      family: 'Pomegranate Serif',
      fallbacks: ['ui-serif', 'serif']
    }).ok).toBe(true);

    expect(controller.activate('pom-neutral').ok).toBe(true);
    expect(controller.getSnapshot().resolved.theme.typography.prose.family).toBe('Inter');
    expect(controller.activate('bunny').ok).toBe(true);
    expect(controller.getSnapshot().resolved.theme.typography.prose.family).toBe('Pomegranate Serif');
  });

  it('resets only typography while preserving sibling theme edits', () => {
    const controller = createLabThemeController({ initialId: 'ash-amber' });
    expect(controller.editColorHex('source', '#ccb477').ok).toBe(true);
    expect(controller.editTypographyRole('prose', {
      family: 'Fraunces',
      fallbacks: ['ui-serif', 'serif']
    }).ok).toBe(true);

    expect(controller.resetTypography().ok).toBe(true);
    const restored = controller.getAuthoringSnapshot().lastValidEditable;
    expect(restored.draft.colors.source).toBe('#ccb477');
    expect(restored.draft.typography).toEqual(
      createLabThemeController({ initialId: 'ash-amber' }).getSnapshot().resolved.theme.typography
    );
  });

  it('rejects non-bundled font families and fallbacks at the Lab boundary', () => {
    const controller = createLabThemeController({ initialId: 'bunny' });
    const before = controller.getSnapshot();
    const family = controller.editTypographyRole('ui', {
      family: 'Arial',
      fallbacks: ['ui-sans-serif', 'sans-serif']
    });
    expect(family.ok).toBe(false);
    if (family.ok) return;
    expect(family.diagnostics[0]).toMatchObject({
      code: 'THEME_SCHEMA_INVALID',
      path: ['draft', 'typography', 'ui', 'family']
    });
    expect(controller.getSnapshot()).toBe(before);

    const fallback = controller.editTypographyRole('ui', {
      family: 'Nunito',
      fallbacks: ['Arial', 'sans-serif']
    });
    expect(fallback.ok).toBe(false);
    if (fallback.ok) return;
    expect(fallback.diagnostics[0]).toMatchObject({
      code: 'THEME_SCHEMA_INVALID',
      path: ['draft', 'typography', 'ui', 'fallbacks']
    });
  });

  it('switches toolbar toggle presentation with the active Theme Library target', () => {
    const controller = createLabThemeController({ initialId: 'deep-current' });

    expect(controller.getSnapshot().compiled.theme.recipes.toolbarTogglePresentation).toBe('edge-labels');
    expect(controller.activate('pom-neutral').ok).toBe(true);
    expect(controller.getSnapshot().compiled.theme.recipes.toolbarTogglePresentation).toBe('bottom-chevrons');
    expect(controller.activate('deep-current').ok).toBe(true);
    expect(controller.getSnapshot().compiled.theme.recipes.toolbarTogglePresentation).toBe('edge-labels');
  });

  it('resolves target ambient through capability limits and accessibility vetoes before compiling root bindings', () => {
    const controller = createLabThemeController({
      ambientLimits: { enabled: true, maximumPower: 0.12, allowMotion: true, allowTransparency: true },
      ambientAccessibility: { reducedMotion: true, reducedTransparency: true }
    });
    expect(controller.getSnapshot().resolvedAmbient).toMatchObject({
      source: 'target',
      power: 0.12,
      transparencyEnabled: false,
      motion: { enabled: false }
    });
    expect(controller.getSnapshot().cssText).toContain('--pom-ambient-transparency-enabled:0');
    expect(controller.getSnapshot().compiled.bindings['--pom-ambient-power']).toBe('0.12');
  });

  it('applies valid edits live and retains the last applied object for invalid edits', () => {
    const controller = createLabThemeController();
    const before = controller.getSnapshot();
    const next = editable(controller);
    next.draft.colors.canvas = '#101820';
    expect(controller.editDraft(next).ok).toBe(true);
    expect(controller.getSnapshot()).not.toBe(before);
    expect(controller.getSnapshot().compiled.bindings['--pom-color-canvas']).toBe('#101820');

    const applied = controller.getSnapshot();
    const invalid = editable(controller) as any;
    invalid.draft.colors.text = 'not-a-color';
    const rejected = controller.editDraft(invalid);
    expect(rejected.ok).toBe(false);
    expect(controller.getSnapshot()).toBe(applied);
    expect((controller.getAuthoringSnapshot().editable as any).draft.colors.text).toBe('not-a-color');
    expect(controller.getAuthoringSnapshot().diagnostics[0]?.path).toContain('text');

    invalid.draft.colors.text = '#e7f6f0';
    expect(controller.editDraft(invalid).ok).toBe(true);
    expect(controller.getAuthoringSnapshot().diagnostics).toEqual([]);
  });

  it('shares recoverable invalid Hex and RGB inputs without discarding valid sibling edits', async () => {
    const { storage } = memoryStorage();
    const controller = createLabThemeController({ draftStorage: storage });

    expect(controller.editColorHex('canvas', '#broken').ok).toBe(false);
    expect(controller.getAuthoringSnapshot().colorInputs.hex.canvas).toBe('#broken');
    expect(controller.setMaterialControl('glassDensity', 61).ok).toBe(true);
    expect(controller.getAuthoringSnapshot().colorInputs.hex.canvas).toBe('#broken');
    expect(controller.getAuthoringSnapshot().diagnostics).not.toEqual([]);
    expect((await controller.saveDraft()).ok).toBe(false);

    expect(controller.editColorRgb('canvas', 0, '999').ok).toBe(false);
    expect(controller.getAuthoringSnapshot().colorInputs.rgb.canvas[0]).toBe('999');
    expect(controller.editColorRgb('canvas', 0, '16').ok).toBe(true);
    expect(controller.getAuthoringSnapshot().diagnostics).toEqual([]);
    expect(controller.getAuthoringSnapshot().lastValidEditable.draft.materials.glassDensity).toBe(61);
  });

  it.each(['deep-current', 'ash-amber'] as const)('recolors and treats the %s canvas through preset data', (id) => {
    const controller = createLabThemeController({ initialId: id });
    const next = editable(controller);
    next.draft.colors.canvas = '#101820';
    next.draft.canvas = { imageStrength: 40, overlayStrength: 50, gradientAngle: 125, vignetteStrength: 20 };

    expect(controller.editDraft(next).ok).toBe(true);
    expect(controller.getAuthoringSnapshot().canvasAvailability).toEqual({ image: true, overlay: true, gradient: true, vignette: true });
    expect(controller.getSnapshot().resolved.canvas.layers).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'image' }),
      expect.objectContaining({ kind: 'linear-gradient', angle: 125 })
    ]));
    const overlay = controller.getSnapshot().resolved.canvas.layers.find((layer) => layer.kind === 'linear-gradient' && layer.angle === 125);
    expect(overlay).toMatchObject({ stops: expect.arrayContaining([expect.objectContaining({ color: expect.stringMatching(/^#101820/i) })]) });
  });

  it('derives canvas control availability from preset profile data', () => {
    const controller = createLabThemeController({ initialId: 'pom-neutral' });
    expect(controller.getAuthoringSnapshot().canvasAvailability).toEqual({ image: false, overlay: true, gradient: true, vignette: true });
    expect(createLabThemeController({ initialId: 'bunny' }).getAuthoringSnapshot().canvasAvailability.gradient).toBe(false);
  });

  it('resets only the active base and keeps independent valid drafts while switching', () => {
    const controller = createLabThemeController();
    const deep = editable(controller);
    deep.draft.colors.ambient = '#66aacc';
    expect(controller.editDraft(deep).ok).toBe(true);
    expect(controller.activate('ash-amber').ok).toBe(true);
    expect((controller.getAuthoringSnapshot().editable as PersistedThemeDraft).draft.baseTargetId).toBe('ash-amber');
    expect(controller.activate('deep-current').ok).toBe(true);
    expect((controller.getAuthoringSnapshot().editable as PersistedThemeDraft).draft.colors.ambient).toBe('#66aacc');
    expect(controller.resetDraft().ok).toBe(true);
    expect((controller.getAuthoringSnapshot().editable as PersistedThemeDraft).draft.colors.ambient).toBe('#94d9d0');
  });

  it('saves canonical local data and restores a matching stored Ash draft', async () => {
    const { values, storage } = memoryStorage();
    const controller = createLabThemeController({ initialId: 'ash-amber', draftStorage: storage });
    const ash = editable(controller);
    ash.ambient.power = 0.72;
    ash.draft.toolbarTogglePresentation = 'bottom-chevrons';
    expect(controller.editDraft(ash).ok).toBe(true);
    expect((await controller.saveDraft()).ok).toBe(true);
    const raw = values.get(themeDraftStorageKey('ash-amber'));
    expect(raw).toBeTruthy();
    expect(decodePersistedThemeDraft(raw!).ok).toBe(true);

    const restored = createLabThemeController({ initialId: 'ash-amber', draftStorage: storage });
    expect((await restored.loadDraft()).ok).toBe(true);
    expect((restored.getAuthoringSnapshot().editable as PersistedThemeDraft).ambient.power).toBe(0.72);
    expect((restored.getAuthoringSnapshot().editable as PersistedThemeDraft).draft.toolbarTogglePresentation).toBe('bottom-chevrons');
    expect(restored.getSnapshot().compiled.theme.recipes.toolbarTogglePresentation).toBe('bottom-chevrons');
    expect(restored.getSnapshot().compiled.bindings['--pom-ambient-power']).toBe('0.72');
  });

  it('saves and reloads independent typography drafts for two themes', async () => {
    const { values, storage } = memoryStorage();
    const controller = createLabThemeController({ initialId: 'bunny', draftStorage: storage });
    expect(controller.editTypographyRole('prose', {
      family: 'Pomegranate Serif',
      fallbacks: ['ui-serif', 'serif']
    }).ok).toBe(true);
    expect((await controller.saveDraft()).ok).toBe(true);

    expect(controller.activate('pom-neutral').ok).toBe(true);
    expect(controller.editTypographyRole('technical', {
      family: 'Pomegranate Mono',
      fallbacks: ['ui-monospace', 'monospace']
    }).ok).toBe(true);
    expect((await controller.saveDraft()).ok).toBe(true);

    expect(values.has(themeDraftStorageKey('bunny'))).toBe(true);
    expect(values.has(themeDraftStorageKey('pom-neutral'))).toBe(true);
    expect(values.has(LAB_THEME_DRAFT_KEY)).toBe(false);

    const restored = createLabThemeController({ initialId: 'bunny', draftStorage: storage });
    expect((await restored.loadDraft()).ok).toBe(true);
    expect(restored.getSnapshot().resolved.theme.typography.prose.family).toBe('Pomegranate Serif');
    expect(restored.activate('pom-neutral').ok).toBe(true);
    expect((await restored.loadDraft()).ok).toBe(true);
    expect(restored.getSnapshot().resolved.theme.typography.technical.family).toBe('Pomegranate Mono');
  });

  it('migrates a matching legacy singleton and rejects stored non-bundled typography', async () => {
    const { values, storage } = memoryStorage();
    const legacyController = createLabThemeController({ initialId: 'ash-amber' });
    const legacy = editable(legacyController);
    legacy.draft.colors.source = '#ccb477';
    values.set(LAB_THEME_DRAFT_KEY, JSON.stringify(legacy));

    const migrated = createLabThemeController({ initialId: 'ash-amber', draftStorage: storage });
    expect((await migrated.loadDraft()).ok).toBe(true);
    expect((migrated.getAuthoringSnapshot().editable as PersistedThemeDraft).draft.colors.source).toBe('#ccb477');
    expect(values.has(themeDraftStorageKey('ash-amber'))).toBe(true);
    expect(values.has(LAB_THEME_DRAFT_KEY)).toBe(false);

    const tampered = editable(createLabThemeController({ initialId: 'bunny' }));
    tampered.draft.typography!.ui = {
      ...tampered.draft.typography!.ui,
      family: 'Arial',
      fallbacks: ['ui-sans-serif', 'sans-serif']
    };
    values.set(themeDraftStorageKey('bunny'), JSON.stringify(tampered));
    const rejected = createLabThemeController({ initialId: 'bunny', draftStorage: storage });
    const result = await rejected.loadDraft();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0]).toMatchObject({
      code: 'THEME_SCHEMA_INVALID',
      path: ['draft', 'typography', 'ui', 'family']
    });
    expect(rejected.getSnapshot().resolved.theme.typography.ui.family).toBe('Nunito');
  });

  it('does not mark a concurrent edit saved when an older storage write completes', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const storage: ThemeDraftStorage = {
      load: async () => null,
      save: async () => { await gate; }
    };
    const controller = createLabThemeController({ draftStorage: storage });
    const first = editable(controller);
    first.ambient.power = 0.5;
    expect(controller.editDraft(first).ok).toBe(true);

    const saving = controller.saveDraft();
    expect(controller.getAuthoringSnapshot().saving).toBe(true);
    const second = editable(controller);
    second.ambient.power = 0.7;
    expect(controller.editDraft(second).ok).toBe(true);
    release();

    expect((await saving).ok).toBe(true);
    expect(controller.getAuthoringSnapshot()).toMatchObject({ saving: false, dirty: true });
    expect(controller.getAuthoringSnapshot().lastValidEditable.ambient.power).toBe(0.7);
  });

  it('does not clear a concurrent invalid edit when an older storage write completes', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const storage: ThemeDraftStorage = {
      load: async () => null,
      save: async () => { await gate; }
    };
    const controller = createLabThemeController({ draftStorage: storage });
    const first = editable(controller);
    first.ambient.power = 0.5;
    expect(controller.editDraft(first).ok).toBe(true);

    const saving = controller.saveDraft();
    expect(controller.editColorHex('text', '#101820').ok).toBe(false);
    expect(controller.getAuthoringSnapshot().diagnostics).toContainEqual(expect.objectContaining({
      code: 'THEME_CONTRAST_UNSAFE'
    }));
    release();

    expect((await saving).ok).toBe(true);
    expect(controller.getAuthoringSnapshot()).toMatchObject({ saving: false, dirty: true });
    expect(controller.getAuthoringSnapshot().diagnostics).toContainEqual(expect.objectContaining({
      code: 'THEME_CONTRAST_UNSAFE'
    }));
    expect((await controller.saveDraft()).ok).toBe(false);
  });

  it('merges a failed older storage write with a concurrent invalid edit', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const storage: ThemeDraftStorage = {
      load: async () => null,
      save: async () => { await gate; throw new Error('offline'); }
    };
    const controller = createLabThemeController({ draftStorage: storage });
    const first = editable(controller);
    first.ambient.power = 0.5;
    expect(controller.editDraft(first).ok).toBe(true);

    const saving = controller.saveDraft();
    expect(controller.editColorHex('text', '#101820').ok).toBe(false);
    release();

    expect((await saving).ok).toBe(false);
    expect(controller.getAuthoringSnapshot().diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'THEME_CONTRAST_UNSAFE' }),
      expect.objectContaining({ path: ['storage'] })
    ]));
    expect(controller.getAuthoringSnapshot()).toMatchObject({ saving: false, dirty: true });
  });

  it('keeps in-memory authoring usable when storage is unavailable', async () => {
    const storage: ThemeDraftStorage = {
      load: async () => { throw new Error('offline'); },
      save: async () => { throw new Error('offline'); }
    };
    const controller = createLabThemeController({ draftStorage: storage });
    const before = controller.getSnapshot();
    expect((await controller.loadDraft()).ok).toBe(false);
    expect((await controller.saveDraft()).ok).toBe(false);
    expect(controller.getSnapshot()).toBe(before);
    expect(controller.getAuthoringSnapshot().editable).toBeTruthy();
  });
});
