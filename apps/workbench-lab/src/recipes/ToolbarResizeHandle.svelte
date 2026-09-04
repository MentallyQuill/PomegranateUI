<script lang="ts">
  import type { PanelId } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';

  let {
    edge,
    panelId,
    width,
    minimum = 200,
    maximum = 420,
    store
  }: {
    edge: 'left' | 'right';
    panelId: PanelId;
    width: number;
    minimum?: number;
    maximum?: number;
    store: WorkbenchStore;
  } = $props();

  let dragging = $state(false);
  let startX = 0;
  let startWidth = 0;
  let previewWidth = 0;
  let moved = false;
  let previewOwner: HTMLElement | null = null;

  const clamp = (value: number) => Math.max(minimum, Math.min(maximum, Math.round(value)));
  const commit = (value: number) => store.dispatch({
    type: 'panel.resize-dock',
    panelId,
    edge,
    width: clamp(value)
  });

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    dragging = true;
    startX = event.clientX;
    startWidth = width;
    previewWidth = width;
    moved = false;
    const control = event.currentTarget as HTMLElement;
    previewOwner = control.closest<HTMLElement>('[data-pomegranate-panel]');
    if (typeof control.setPointerCapture === 'function') control.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function pointerMove(event: PointerEvent) {
    if (!dragging) return;
    const delta = edge === 'left' ? event.clientX - startX : startX - event.clientX;
    if (Math.abs(delta) >= 1) moved = true;
    previewWidth = clamp(startWidth + delta);
    previewOwner?.style.setProperty(`--pom-${edge}-width`, `${previewWidth}px`);
  }

  function pointerFinish(event: PointerEvent, cancelled = false) {
    if (!dragging) return;
    dragging = false;
    const control = event.currentTarget as HTMLElement;
    if (typeof control.hasPointerCapture === 'function'
      && control.hasPointerCapture(event.pointerId)
      && typeof control.releasePointerCapture === 'function') control.releasePointerCapture(event.pointerId);
    if (cancelled || !moved) previewOwner?.style.setProperty(`--pom-${edge}-width`, `${width}px`);
    else {
      commit(previewWidth);
      previewOwner?.style.removeProperty(`--pom-${edge}-width`);
    }
    previewOwner = null;
  }

  function keyDown(event: KeyboardEvent) {
    let next: number | null = null;
    if (event.key === 'Home') next = minimum;
    else if (event.key === 'End') next = maximum;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = width + 8;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = width - 8;
    if (next === null) return;
    event.preventDefault();
    commit(next);
  }
</script>

<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role (a focusable separator with aria-valuenow is an interactive WAI-ARIA separator) -->
<button
  type="button"
  class="toolbar-resize-handle"
  class:is-dragging={dragging}
  data-dock-resizer={edge}
  role="separator"
  aria-label={`Resize ${edge} toolbar`}
  aria-orientation="vertical"
  aria-valuemin={Math.round(minimum)}
  aria-valuemax={Math.round(maximum)}
  aria-valuenow={width}
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={(event) => pointerFinish(event)}
  onpointercancel={(event) => pointerFinish(event, true)}
  onkeydown={keyDown}
><span data-pom-part="separator" aria-hidden="true"></span></button>
