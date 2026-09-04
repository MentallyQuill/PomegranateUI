// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLabThemeController } from '../../themes/controller.js';
import ThemeColorsHarness from './ThemeColorsHarness.svelte';

afterEach(cleanup);

describe('shared Theme Colors element', () => {
  it('tracks the active pointer until release', async () => {
    const controller = createLabThemeController();
    render(ThemeColorsHarness, {
      controller,
      eyedropper: { available: () => false, sample: async () => null }
    });
    const primary = within(screen.getByRole('region', { name: 'Primary colors' }));
    const plane = primary.getByRole('application', { name: 'Saturation and value' });
    let capturedPointer: number | null = null;
    const setPointerCapture = vi.fn((pointerId: number) => { capturedPointer = pointerId; });
    const releasePointerCapture = vi.fn((pointerId: number) => {
      if (capturedPointer === pointerId) capturedPointer = null;
    });
    Object.defineProperties(plane, {
      getBoundingClientRect: {
        configurable: true,
        value: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
      },
      setPointerCapture: { configurable: true, value: setPointerCapture },
      hasPointerCapture: { configurable: true, value: (pointerId: number) => capturedPointer === pointerId },
      releasePointerCapture: { configurable: true, value: releasePointerCapture }
    });

    await fireEvent.pointerDown(plane, { button: 0, clientX: 20, clientY: 20, pointerId: 7 });
    expect(primary.getByText('Saturation 20% · Value 80%')).toBeInTheDocument();
    expect(setPointerCapture).toHaveBeenCalledWith(7);

    await fireEvent.pointerMove(plane, { buttons: 1, clientX: 80, clientY: 70, pointerId: 7 });
    expect(primary.getByText('Saturation 81% · Value 30%')).toBeInTheDocument();

    await fireEvent.pointerUp(plane, { button: 0, clientX: 90, clientY: 90, pointerId: 7 });
    expect(primary.getByText('Saturation 88% · Value 10%')).toBeInTheDocument();
    expect(releasePointerCapture).toHaveBeenCalledWith(7);

    await fireEvent.pointerMove(plane, { buttons: 0, clientX: 10, clientY: 10, pointerId: 7 });
    expect(primary.getByText('Saturation 88% · Value 10%')).toBeInTheDocument();
  });

  it('stops tracking a cancelled pointer', async () => {
    const controller = createLabThemeController();
    render(ThemeColorsHarness, {
      controller,
      eyedropper: { available: () => false, sample: async () => null }
    });
    const primary = within(screen.getByRole('region', { name: 'Primary colors' }));
    const plane = primary.getByRole('application', { name: 'Saturation and value' });
    let capturedPointer: number | null = null;
    Object.defineProperties(plane, {
      getBoundingClientRect: {
        configurable: true,
        value: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
      },
      setPointerCapture: { configurable: true, value: (pointerId: number) => { capturedPointer = pointerId; } },
      hasPointerCapture: { configurable: true, value: (pointerId: number) => capturedPointer === pointerId },
      releasePointerCapture: {
        configurable: true,
        value: (pointerId: number) => { if (capturedPointer === pointerId) capturedPointer = null; }
      }
    });

    await fireEvent.pointerDown(plane, { button: 0, clientX: 20, clientY: 20, pointerId: 8 });
    await fireEvent.pointerMove(plane, { buttons: 1, clientX: 60, clientY: 40, pointerId: 8 });
    expect(primary.getByText('Saturation 60% · Value 60%')).toBeInTheDocument();

    await fireEvent.pointerCancel(plane, { pointerId: 8 });
    await fireEvent.pointerMove(plane, { buttons: 1, clientX: 90, clientY: 90, pointerId: 8 });
    expect(primary.getByText('Saturation 60% · Value 60%')).toBeInTheDocument();
  });

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
