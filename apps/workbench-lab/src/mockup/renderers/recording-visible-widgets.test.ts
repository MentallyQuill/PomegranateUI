// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { asWidgetInstanceId, asWidgetType, type JsonObject, type WidgetType } from '@pomegranate-ui/contracts';
import type { WidgetRendererProps } from '@pomegranate-ui/svelte';

import type { LabHostContext } from '../host-context.js';
import { createLabHostContext } from '../host-context.js';
import { IMPLEMENTED_SURFACE_TYPES } from '../implemented-surfaces.js';
import { resolveLabShowcaseMediaProfile } from '../showcase-media.js';
import { createLabThemeController } from '../../themes/controller.js';
import { BUNDLED_FONT_CHOICES } from '../../themes/bundled-fonts.js';
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
    fontChoices: BUNDLED_FONT_CHOICES,
    activate: () => undefined,
    setMaterialControl: () => undefined,
    resetMaterialControls: () => undefined,
    openSettings: () => undefined,
    editDraft: (next) => controller.editDraft(next),
    editColorHex: (role, value) => controller.editColorHex(role, value),
    editColorRgb: (role, channel, value) => controller.editColorRgb(role, channel, value),
    editTypographyRole: (role, patch) => controller.editTypographyRole(role, patch),
    editTypographyScale: (step, value) => controller.editTypographyScale(step, value),
    resetTypography: () => controller.resetTypography(),
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
  it('renders the four-person Characters roster without omniscient location or presence metadata', () => {
    renderSurface('story.characters');

    const roster = screen.getByRole('list', { name: 'Characters roster' });
    expect(within(roster).getAllByRole('listitem')).toHaveLength(4);
    expect(within(roster).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Aven Rook',
      'Mara Venn',
      'Ilex',
      'The Quiet Diver'
    ]);
    expect(within(roster).getAllByRole('img').map((portrait) => portrait.getAttribute('alt') ?? portrait.getAttribute('aria-label'))).toEqual([
      'Portrait of Aven Rook',
      'Portrait of Mara Venn',
      'Portrait of Ilex',
      'Portrait of The Quiet Diver'
    ]);
    expect(within(roster).queryByText('near the western rail')).not.toBeInTheDocument();
    expect(within(roster).queryByText('voice behind the glass')).not.toBeInTheDocument();
    expect(within(roster).queryByText('signal room, lower deck')).not.toBeInTheDocument();
    expect(within(roster).queryByTestId('character-presence')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decrease character portrait size' })).toHaveTextContent('−');
    expect(screen.getByRole('button', { name: 'Increase character portrait size' })).toHaveTextContent('+');
  });

  it('cycles from name-only rows through small and large portrait modes', async () => {
    renderSurface('story.characters');

    const roster = screen.getByRole('list', { name: 'Characters roster' });
    const decrease = screen.getByRole('button', { name: 'Decrease character portrait size' });
    const increase = screen.getByRole('button', { name: 'Increase character portrait size' });
    expect(roster).toHaveAttribute('data-portrait-scale', '2');
    expect(within(roster).getAllByRole('img')).toHaveLength(4);

    await fireEvent.click(decrease);
    expect(roster).toHaveAttribute('data-portrait-scale', '1');
    expect(within(roster).queryByRole('img')).not.toBeInTheDocument();
    expect(decrease).toBeDisabled();
    expect(within(roster).getAllByRole('listitem').map((row) => row.textContent?.trim())).toEqual([
      'Aven Rook',
      'Mara Venn',
      'Ilex',
      'The Quiet Diver'
    ]);

    await fireEvent.click(increase);
    expect(roster).toHaveAttribute('data-portrait-scale', '2');
    expect(within(roster).getAllByRole('img')).toHaveLength(4);
    await fireEvent.click(increase);
    expect(roster).toHaveAttribute('data-portrait-scale', '3');
    expect(increase).toBeDisabled();
  });

  it('opens one concise viewpoint-safe character synopsis at a time', async () => {
    renderSurface('story.characters');

    const aven = screen.getByRole('button', { name: 'Aven Rook' });
    const mara = screen.getByRole('button', { name: 'Mara Venn' });
    expect(aven).toHaveAttribute('aria-expanded', 'false');
    expect(aven).not.toHaveAttribute('aria-controls');

    await fireEvent.click(screen.getByRole('img', { name: 'Portrait of Aven Rook' }));
    expect(aven).toHaveAttribute('aria-expanded', 'true');
    expect(aven).toHaveAttribute('aria-controls', 'character-details-0');
    expect(screen.getByText(/Aven is a measured traveler/)).toBeVisible();

    await fireEvent.click(mara);
    expect(aven).toHaveAttribute('aria-expanded', 'false');
    expect(aven).not.toHaveAttribute('aria-controls');
    expect(mara).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByText(/Aven is a measured traveler/)).not.toBeInTheDocument();
    expect(screen.getByText(/Mara is a cartographer/)).toBeVisible();

    await fireEvent.click(mara);
    expect(mara).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Mara is a cartographer/)).not.toBeInTheDocument();
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
