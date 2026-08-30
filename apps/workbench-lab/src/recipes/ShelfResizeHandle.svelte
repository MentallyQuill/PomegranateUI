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

  function resize(delta: number) {
    store.dispatch({
      type: 'shelf.resize', panelId, regionId, shelfId,
      weight: Math.min(1, Math.max(0.05, weight + delta))
    });
  }

  function keydown(event: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') resize(0.05 - weight);
    else if (event.key === 'End') resize(1 - weight);
    else resize(event.key === 'ArrowUp' ? 0.05 : -0.05);
  }
</script>

<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
<button
  type="button"
  class="shelf-resize-handle"
  role="separator"
  tabindex="0"
  aria-label={`Resize ${shelfId} shelf in ${regionId}`}
  aria-orientation="horizontal"
  aria-valuemin="5"
  aria-valuemax="100"
  aria-valuenow={Math.round(weight * 100)}
  onkeydown={keydown}
></button>
