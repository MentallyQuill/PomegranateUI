<script lang="ts">
  import { onMount } from 'svelte';
  import type { WidgetInstanceId } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';

  let { instanceId, label, height, minimum, maximum, store }: {
    instanceId: WidgetInstanceId;
    label: string;
    height: number | undefined;
    minimum: number;
    maximum: number;
    store: WorkbenchStore;
  } = $props();

  let control = $state<HTMLButtonElement>();
  let measuredHeight = $state(0);
  let dragging = $state(false);
  let startY = 0;
  let startHeight = 0;

  const clamp = (value: number) => Math.max(minimum, Math.min(maximum, Math.round(value)));
  const commit = (value: number | null) => store.dispatch({
    type: 'widget.resize-row', instanceId, height: value === null ? null : clamp(value)
  });

  function measure() {
    const row = control?.previousElementSibling as HTMLElement | null;
    if (row) measuredHeight = Math.round(row.getBoundingClientRect().height);
  }

  onMount(() => {
    measure();
    const row = control?.previousElementSibling as HTMLElement | null;
    if (!row || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  });

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    measure();
    dragging = true;
    startY = event.clientY;
    startHeight = height ?? measuredHeight;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function pointerMove(event: PointerEvent) {
    if (!dragging) return;
    commit(startHeight + event.clientY - startY);
  }

  function pointerFinish(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  }

  function keyDown(event: KeyboardEvent) {
    let next: number | null = null;
    const current = height ?? measuredHeight;
    if (event.key === 'Home') next = minimum;
    else if (event.key === 'End') next = maximum;
    else if (event.key === 'ArrowDown') next = current + 8;
    else if (event.key === 'ArrowUp') next = current - 8;
    if (next === null) return;
    event.preventDefault();
    commit(next);
  }
</script>

<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role (interactive WAI-ARIA separator) -->
<button
  bind:this={control}
  type="button"
  class="widget-row-resize-handle"
  class:is-dragging={dragging}
  data-row-resizer={instanceId}
  role="separator"
  aria-label={`Resize ${label} row`}
  aria-orientation="horizontal"
  aria-valuemin={minimum}
  aria-valuemax={maximum}
  aria-valuenow={height ?? (measuredHeight || minimum)}
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={pointerFinish}
  onpointercancel={pointerFinish}
  onkeydown={keyDown}
  ondblclick={() => commit(null)}
><span data-pom-part="separator" aria-hidden="true"></span></button>
