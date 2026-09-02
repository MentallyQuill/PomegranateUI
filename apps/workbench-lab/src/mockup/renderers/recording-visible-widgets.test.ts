// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { asWidgetInstanceId, asWidgetType, type JsonObject, type WidgetType } from '@pomegranate-ui/contracts';
import type { WidgetRendererProps } from '@pomegranate-ui/svelte';

import type { LabHostContext } from '../host-context.js';
import { createLabHostContext } from '../host-context.js';
import { IMPLEMENTED_SURFACE_TYPES } from '../implemented-surfaces.js';
import { resolveLabShowcaseMediaProfile } from '../showcase-media.js';
import { createLabThemeController } from '../../themes/controller.js';
import ImplementedWidget from './ImplementedWidget.svelte';

afterEach(cleanup);

function recordingHostContext(activeId: 'deep-current' | 'pom-neutral' | 'bunny' | 'ash-amber' = 'deep-current'): LabHostContext {
  const controller = createLabThemeController({ initialId: activeId });
  const snapshot = controller.getSnapshot();
  return createLabHostContext({
    activeId,
    presets: [],
    inspector: {
      colors: snapshot.compiled.theme.colors,
      typography: [],
      geometry: 'rounded · 4px',
      density: 'compact',
      iconPackId: snapshot.compiled.theme.iconPackId
    },
    materialControls: snapshot.materialControls,
    authoring: controller.getAuthoringSnapshot(),
    activate: () => undefined,
    setMaterialControl: () => undefined,
    resetMaterialControls: () => undefined,
    openSettings: () => undefined,
    editDraft: (next) => controller.editDraft(next),
    editColorHex: (role, value) => controller.editColorHex(role, value),
    editColorRgb: (role, channel, value) => controller.editColorRgb(role, channel, value),
    resetDraft: () => controller.resetDraft(),
    saveDraft: () => controller.saveDraft()
  }, 'ready', resolveLabShowcaseMediaProfile(activeId));
}

const dispatch: WidgetRendererProps<LabHostContext>['dispatch'] = () => {
  throw new Error('Recording-visible fixtures do not dispatch Workbench commands.');
};

function renderSurface(
  rawType: string,
  configuration: JsonObject = { presentation: 'recording' },
  activeId: 'deep-current' | 'pom-neutral' | 'bunny' | 'ash-amber' = 'deep-current'
) {
  const type = asWidgetType(rawType);
  render(ImplementedWidget, {
    instance: {
      id: asWidgetInstanceId(`recording-${rawType.replaceAll('.', '-')}`),
      type,
      manifestVersion: '1.0.0',
      configuration
    },
    hostContext: recordingHostContext(activeId),
    capabilities: [],
    dispatch
  });
  return type as WidgetType;
}

describe('recording-visible Deep Current Widget anatomy', () => {
  it('renders the literal four-person Characters roster with named portrait semantics and quiet scale actions', () => {
    renderSurface('story.characters');

    const roster = screen.getByRole('list', { name: 'Characters roster' });
    expect(within(roster).getAllByRole('listitem')).toHaveLength(4);
    expect(within(roster).getAllByRole('img').map((portrait) => portrait.getAttribute('alt') ?? portrait.getAttribute('aria-label'))).toEqual([
      'Portrait of Aven Rook',
      'Portrait of Mara Venn',
      'Portrait of Ilex',
      'Portrait of The Quiet Diver'
    ]);
    expect(within(roster).getByText('near the western rail')).toBeVisible();
    expect(within(roster).getByText('voice behind the glass')).toBeVisible();
    expect(within(roster).getByText('signal room, lower deck')).toBeVisible();
    expect(within(roster).getByText('identity unresolved')).toBeVisible();
    expect(within(roster).getAllByTestId('character-presence').map((state) => state.textContent)).toEqual(['SEEN', 'NEAR', 'AWAY', '?']);
    expect(screen.getByRole('button', { name: 'Decrease character portrait size' })).toHaveTextContent('−');
    expect(screen.getByRole('button', { name: 'Increase character portrait size' })).toHaveTextContent('+');
  });

  it.each([
    ['pom-neutral', 'pomos-character-atlas'],
    ['bunny', 'bunny-character-atlas'],
    ['ash-amber', 'ash-amber-character-atlas']
  ] as const)('renders real Lab-owned portrait media for %s without changing character identity', (activeId, assetName) => {
    renderSurface('story.characters', { presentation: 'recording' }, activeId);

    const portraits = screen.getByRole('list', { name: 'Characters roster' }).querySelectorAll('img');
    expect(portraits).toHaveLength(4);
    expect([...portraits].map((portrait) => portrait.getAttribute('src'))).toEqual([
      expect.stringContaining(assetName),
      expect.stringContaining(assetName),
      expect.stringContaining(assetName),
      expect.stringContaining(assetName)
    ]);
  });

  it('renders Scene Effects as four labeled technical controls with the recorded values', () => {
    renderSurface('story.room-ambience');

    const effects = screen.getByRole('group', { name: 'Scene Effects controls' });
    for (const [name, value] of [
      ['Atmosphere', '62'],
      ['Contrast', '38'],
      ['Motion', '20'],
      ['Reading Veil', '48']
    ] as const) {
      expect(within(effects).getByRole('slider', { name })).toHaveValue(value);
    }
    expect(within(effects).getByText('IDLE')).toBeVisible();
  });

  it('renders the recorded active Persona facts as semantic terms and values', () => {
    renderSurface('story.personas');

    expect(screen.getByText('Active perspective')).toBeVisible();
    expect(screen.getByText('Aven Rook')).toBeVisible();
    expect(screen.getByText('A cartographer listening for structures beneath the waterline.')).toBeVisible();
    const facts = screen.getByRole('list', { name: 'Persona facts' });
    expect(within(facts).getAllByRole('term').map((term) => term.textContent)).toEqual(['Voice', 'Memory lens', 'Agency', 'Private context']);
    expect(within(facts).getAllByRole('definition').map((value) => value.textContent)).toEqual(['Measured', 'Close', 'Player', '6 notes']);
  });

  it('renders AI Connections as the recorded inference-route status surface', () => {
    expect(IMPLEMENTED_SURFACE_TYPES).toContain(asWidgetType('settings.connections'));
    renderSurface('settings.connections');

    expect(screen.getByText('Inference route')).toBeVisible();
    expect(screen.getAllByText('Ready')).toHaveLength(1);
    const routes = screen.getByRole('list', { name: 'Inference routes' });
    expect(within(routes).getAllByRole('listitem').map((row) => row.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Director Connected',
      'Narrator Connected',
      'Characters 6 routes',
      'Latency 742 ms'
    ]);
  });

  it('renders the same focused Theme Materials element used by Scene and Settings', () => {
    renderSurface('settings.theme-materials');

    expect(document.querySelector('[data-theme-authoring-element="materials"]')).not.toBeNull();
    for (const [name, value] of [
      ['Glass Density', '20'],
      ['Bar Opacity', '60'],
      ['Selected Strength', '6'],
      ['Frost Level', '50']
    ] as const) {
      expect(screen.getByRole('slider', { name })).toHaveValue(value);
    }
    expect(screen.queryByRole('slider', { name: 'Radius' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
  });
});
