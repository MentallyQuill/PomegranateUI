<script lang="ts">
  import type { PanelId, SubPanelId } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';

  let {
    panelId,
    subPanelId,
    boundary,
    weights,
    defaultWeights,
    beforeLabel,
    afterLabel,
    store
  }: {
    panelId: PanelId;
    subPanelId: SubPanelId | null;
    boundary: number;
    weights: readonly number[];
    defaultWeights: readonly number[];
    beforeLabel: string;
    afterLabel: string;
    store: WorkbenchStore;
  } = $props();

  let dragging = $state(false);
  let startX = 0;
  let surfaceWidth = 1;
  let startWeights: readonly number[] = [];

  const pairTotal = $derived((weights[boundary] ?? 0) + (weights[boundary + 1] ?? 0));
  const share = $derived(pairTotal > 0 ? (weights[boundary] ?? 0) / pairTotal : 0.5);
  const position = $derived(weights.slice(0, boundary + 1).reduce((total, weight) => total + weight, 0) * 100);

  function dispatch(next: readonly number[]) {
    store.dispatch(subPanelId === null
      ? { type: 'panel.resize-columns', panelId, weights: next }
      : { type: 'sub-panel.resize-columns', panelId, subPanelId, weights: next });
  }

  function commit(leftWeight: number, base: readonly number[] = weights) {
    const total = (base[boundary] ?? 0) + (base[boundary + 1] ?? 0);
    const minimum = Math.max(0.05, total * 0.1);
    const left = Math.max(minimum, Math.min(total - minimum, leftWeight));
    const next = [...base];
    next[boundary] = left;
    next[boundary + 1] = total - left;
    dispatch(next);
  }

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    const surface = (event.currentTarget as HTMLElement).closest<HTMLElement>('.panel-template-surface');
    if (!surface) return;
    dragging = true;
    startX = event.clientX;
    surfaceWidth = Math.max(1, surface.getBoundingClientRect().width);
    startWeights = [...weights];
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function pointerMove(event: PointerEvent) {
    if (!dragging) return;
    commit((startWeights[boundary] ?? 0) + (event.clientX - startX) / surfaceWidth, startWeights);
  }

  function pointerFinish(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    const control = event.currentTarget as HTMLElement;
    if (control.hasPointerCapture(event.pointerId)) control.releasePointerCapture(event.pointerId);
  }

  function keyDown(event: KeyboardEvent) {
    let left: number | null = null;
    const total = pairTotal;
    if (event.key === 'Home') left = total * 0.1;
    else if (event.key === 'End') left = total * 0.9;
    else if (event.key === 'ArrowRight') left = (weights[boundary] ?? 0) + 0.05 * total;
    else if (event.key === 'ArrowLeft') left = (weights[boundary] ?? 0) - 0.05 * total;
    if (left === null) return;
    event.preventDefault();
    commit(left);
  }
</script>

<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role (interactive WAI-ARIA separator) -->
<button
  type="button"
  class="column-resize-handle"
  class:is-dragging={dragging}
  data-column-boundary={boundary}
  role="separator"
  aria-label={`Resize ${beforeLabel} and ${afterLabel} columns`}
  aria-orientation="vertical"
  aria-valuemin="10"
  aria-valuemax="90"
  aria-valuenow={Math.round(share * 100)}
  style={`--pom-column-boundary:${position}%`}
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={pointerFinish}
  onpointercancel={pointerFinish}
  onkeydown={keyDown}
  ondblclick={() => dispatch(defaultWeights)}
><span data-pom-part="separator" aria-hidden="true"></span></button>
