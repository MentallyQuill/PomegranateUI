// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { asWidgetInstanceId, asWidgetType, type WidgetType } from '@pomegranate-ui/contracts';
import type { WidgetRendererProps } from '@pomegranate-ui/svelte';

import type { LabHostContext } from '../host-context.js';
import ImplementedWidget from './ImplementedWidget.svelte';

afterEach(cleanup);

const hostContext = { surfaceState: 'ready' } as LabHostContext;
const dispatch: WidgetRendererProps<LabHostContext>['dispatch'] = () => {
  throw new Error('Recording-visible fixtures do not dispatch Workbench commands.');
};

function renderSurface(rawType: string) {
  const type = asWidgetType(rawType);
  render(ImplementedWidget, {
    instance: {
      id: asWidgetInstanceId(`recording-${rawType.replaceAll('.', '-')}`),
      type,
      manifestVersion: '1.0.0',
      configuration: {}
    },
    hostContext,
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
    expect(within(roster).getAllByRole('img').map((portrait) => portrait.getAttribute('aria-label'))).toEqual([
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
});
