<script lang="ts">
  import type { PanelId } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';

  let { edge, panelId, measure, minimum, maximum, store }: {
    edge: 'left' | 'right';
    panelId: PanelId;
    measure: number;
    minimum: number;
    maximum: number;
    store: WorkbenchStore;
  } = $props();

  let dragging = $state(false);
  let moved = false;
  let startX = 0;
  let startMeasure = 0;
  let previewMeasure = 0;
  let previewOwner: HTMLElement | null = null;

  const label = $derived(`Resize Story width from ${edge} edge`);
  const clamp = (value: number) => Math.max(minimum, Math.min(maximum, Math.round(value)));
  const writePreview = (value: number) => previewOwner?.style.setProperty('--pom-story-measure', `${value}px`);
  const clearPreview = () => previewOwner?.style.removeProperty('--pom-story-measure');
  const commit = (value: number) => store.dispatch({
    type: 'panel.set-story-measure', panelId, measure: clamp(value)
  });

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    const control = event.currentTarget as HTMLElement;
    dragging = true;
    moved = false;
    startX = event.clientX;
    startMeasure = measure;
    previewMeasure = measure;
    previewOwner = control.closest<HTMLElement>('.panel-template-surface');
    if (typeof control.setPointerCapture === 'function') control.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function pointerMove(event: PointerEvent) {
    if (!dragging) return;
    const outward = edge === 'left' ? startX - event.clientX : event.clientX - startX;
    if (Math.abs(outward) >= 1) moved = true;
    previewMeasure = clamp(startMeasure + outward * 2);
    writePreview(previewMeasure);
  }

  function releaseCapture(event: PointerEvent) {
    const control = event.currentTarget as HTMLElement;
    if (typeof control.hasPointerCapture === 'function'
      && control.hasPointerCapture(event.pointerId)
      && typeof control.releasePointerCapture === 'function') {
      control.releasePointerCapture(event.pointerId);
    }
  }

  function pointerUp(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    releaseCapture(event);
    if (moved) commit(previewMeasure);
    clearPreview();
    previewOwner = null;
  }

  function pointerCancel(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    releaseCapture(event);
    clearPreview();
    previewOwner = null;
  }

  function keyDown(event: KeyboardEvent) {
    let next: number | null = null;
    const outward = edge === 'left' ? 'ArrowLeft' : 'ArrowRight';
    const inward = edge === 'left' ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === 'Home') next = minimum;
    else if (event.key === 'End') next = maximum;
    else if (event.key === outward || event.key === 'ArrowUp') next = measure + 16;
    else if (event.key === inward || event.key === 'ArrowDown') next = measure - 16;
    if (next === null) return;
    event.preventDefault();
    commit(next);
  }
</script>

<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role (interactive WAI-ARIA separator) -->
<button
  type="button"
  class="story-measure-resize-handle"
  class:is-dragging={dragging}
  data-story-measure-resizer={edge}
  data-pom-part="story.measure-resizer"
  role="separator"
  aria-label={label}
  aria-orientation="vertical"
  aria-valuemin={Math.round(minimum)}
  aria-valuemax={Math.round(maximum)}
  aria-valuenow={Math.round(measure)}
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={pointerUp}
  onpointercancel={pointerCancel}
  onkeydown={keyDown}
><span aria-hidden="true"></span></button>
