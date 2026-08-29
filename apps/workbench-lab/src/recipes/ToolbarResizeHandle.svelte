<script lang="ts">
  import type { PanelId } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';

  let {
    edge,
    panelId,
    width,
    store
  }: {
    edge: 'left' | 'right';
    panelId: PanelId;
    width: number;
    store: WorkbenchStore;
  } = $props();

  let dragging = $state(false);
  let startX = 0;
  let startWidth = 0;

  const clamp = (value: number) => Math.max(200, Math.min(420, Math.round(value)));
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
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function pointerMove(event: PointerEvent) {
    if (!dragging) return;
    const delta = edge === 'left' ? event.clientX - startX : startX - event.clientX;
    commit(startWidth + delta);
  }

  function pointerFinish(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    const control = event.currentTarget as HTMLElement;
    if (control.hasPointerCapture(event.pointerId)) control.releasePointerCapture(event.pointerId);
  }

  function keyDown(event: KeyboardEvent) {
    let next: number | null = null;
    if (event.key === 'Home') next = 200;
    else if (event.key === 'End') next = 420;
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
  aria-valuemin="200"
  aria-valuemax="420"
  aria-valuenow={width}
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={pointerFinish}
  onpointercancel={pointerFinish}
  onkeydown={keyDown}
><span data-pom-part="separator" aria-hidden="true"></span></button>
