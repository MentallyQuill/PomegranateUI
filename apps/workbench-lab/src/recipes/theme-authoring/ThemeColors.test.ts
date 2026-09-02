// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import { createLabThemeController } from '../../themes/controller.js';
import ThemeColorsHarness from './ThemeColorsHarness.svelte';

afterEach(cleanup);

describe('shared Theme Colors element', () => {
  it('mirrors invalid Hex and RGB input across placements while the overview blocks Save', async () => {
    const controller = createLabThemeController();
    render(ThemeColorsHarness, {
      controller,
      eyedropper: { available: () => false, sample: async () => null }
    });
    const primary = within(screen.getByRole('region', { name: 'Primary colors' }));
    const secondary = within(screen.getByRole('region', { name: 'Secondary colors' }));
    const save = within(screen.getByRole('region', { name: 'Theme overview' })).getByRole('button', { name: 'Save draft' });

    await fireEvent.input(primary.getByRole('textbox', { name: 'Hex color' }), { target: { value: '#broken' } });
    expect(secondary.getByRole('textbox', { name: 'Hex color' })).toHaveValue('#broken');
    expect(save).toBeDisabled();

    await fireEvent.input(primary.getByRole('textbox', { name: 'Red' }), { target: { value: '999' } });
    expect(secondary.getByRole('textbox', { name: 'Red' })).toHaveValue('999');
    expect(save).toBeDisabled();
  });

  it('announces an eyedropper cancellation without changing either placement', async () => {
    const controller = createLabThemeController();
    render(ThemeColorsHarness, {
      controller,
      eyedropper: { available: () => true, sample: async () => null }
    });
    const primary = within(screen.getByRole('region', { name: 'Primary colors' }));
    const secondary = within(screen.getByRole('region', { name: 'Secondary colors' }));
    const before = (primary.getByRole('textbox', { name: 'Hex color' }) as HTMLInputElement).value;

    await fireEvent.click(primary.getByRole('button', { name: 'Use Eyedropper' }));
    const status = await waitFor(() => primary.getByText(/did not change/));
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(primary.getByRole('textbox', { name: 'Hex color' })).toHaveValue(before);
    expect(secondary.getByRole('textbox', { name: 'Hex color' })).toHaveValue(before);
  });
});
