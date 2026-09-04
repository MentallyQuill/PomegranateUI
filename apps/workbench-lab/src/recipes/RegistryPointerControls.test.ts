// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import RegistryAmbientPosition from '../../../../registry/recipes/theme-settings/AmbientPosition.svelte';
import RegistryColorPlane from '../../../../registry/recipes/theme-settings/ColorPlane.svelte';

afterEach(cleanup);

function preparePointerSurface(surface: HTMLElement) {
  let capturedPointer: number | null = null;
  const releasePointerCapture = vi.fn((pointerId: number) => {
    if (capturedPointer === pointerId) capturedPointer = null;
  });
  Object.defineProperties(surface, {
    getBoundingClientRect: {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) })
    },
    setPointerCapture: {
      configurable: true,
      value: (pointerId: number) => { capturedPointer = pointerId; }
    },
    hasPointerCapture: {
      configurable: true,
      value: (pointerId: number) => capturedPointer === pointerId
    },
    releasePointerCapture: { configurable: true, value: releasePointerCapture }
  });
  return { releasePointerCapture };
}

describe('copy-owned theme pointer controls', () => {
  it('tracks saturation and value throughout a drag', async () => {
    const changes: Array<{ saturation: number; value: number }> = [];
    render(RegistryColorPlane, {
      hue: 0,
      saturation: 0.2,
      value: 0.8,
      onchange: (next: { saturation: number; value: number }) => changes.push(next)
    });
    const plane = screen.getByRole('application', { name: 'Saturation and value' });
    const capture = preparePointerSurface(plane);

    await fireEvent.pointerDown(plane, { button: 0, clientX: 20, clientY: 20, pointerId: 11 });
    await fireEvent.pointerMove(plane, { buttons: 1, clientX: 80, clientY: 70, pointerId: 11 });
    expect(changes.at(-1)).toEqual({ saturation: 0.8, value: 0.3 });

    await fireEvent.pointerUp(plane, { button: 0, clientX: 90, clientY: 90, pointerId: 11 });
    expect(changes.at(-1)).toEqual({ saturation: 0.9, value: 0.1 });
    expect(capture.releasePointerCapture).toHaveBeenCalledWith(11);
  });

  it('tracks the ambient position throughout a drag', async () => {
    const changes: Array<{ x: number; y: number }> = [];
    render(RegistryAmbientPosition, {
      x: 0.5,
      y: 0.5,
      onchange: (next: { x: number; y: number }) => changes.push(next)
    });
    const position = screen.getByRole('application', { name: 'Ambient position' });
    const capture = preparePointerSurface(position);

    await fireEvent.pointerDown(position, { button: 0, clientX: 20, clientY: 20, pointerId: 12 });
    await fireEvent.pointerMove(position, { buttons: 1, clientX: 80, clientY: 70, pointerId: 12 });
    expect(changes.at(-1)).toEqual({ x: 0.8, y: 0.7 });

    await fireEvent.pointerCancel(position, { pointerId: 12 });
    await fireEvent.pointerMove(position, { buttons: 1, clientX: 90, clientY: 90, pointerId: 12 });
    expect(changes.at(-1)).toEqual({ x: 0.8, y: 0.7 });
    expect(capture.releasePointerCapture).toHaveBeenCalledWith(12);
  });
});
