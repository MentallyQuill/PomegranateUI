<script lang="ts">
  import type { PanelId } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';

  let { panelId, regionId, shelfId, weight, store }: {
    panelId: PanelId;
    regionId: string;
    shelfId: string;
    weight: number;
    store: WorkbenchStore;
  } = $props();

  let dragging = $state(false);
  let startY = 0;
  let startWeight = 0;
  let regionHeight = 1;

  function commit(nextWeight: number) {
    store.dispatch({
      type: 'shelf.resize', panelId, regionId, shelfId,
      weight: Math.min(1, Math.max(0.05, nextWeight))
    });
  }

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    const region = (event.currentTarget as HTMLElement).closest<HTMLElement>('.dock-region');
    if (!region) return;
    dragging = true;
    startY = event.clientY;
    startWeight = weight;
    regionHeight = Math.max(1, region.getBoundingClientRect().height);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function pointerMove(event: PointerEvent) {
    if (!dragging) return;
    commit(startWeight + (event.clientY - startY) / regionHeight);
  }

  function pointerFinish(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    const control = event.currentTarget as HTMLElement;
    if (control.hasPointerCapture(event.pointerId)) control.releasePointerCapture(event.pointerId);
  }

  function keydown(event: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') commit(0.05);
    else if (event.key === 'End') commit(1);
    else commit(weight + (event.key === 'ArrowUp' ? 0.05 : -0.05));
  }
</script>

<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
<button
  type="button"
  class="shelf-resize-handle"
  class:is-dragging={dragging}
  role="separator"
  tabindex="0"
  aria-label={`Resize ${shelfId} shelf in ${regionId}`}
  aria-orientation="horizontal"
  aria-valuemin="5"
  aria-valuemax="100"
  aria-valuenow={Math.round(weight * 100)}
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={pointerFinish}
  onpointercancel={pointerFinish}
  onkeydown={keydown}
></button>
