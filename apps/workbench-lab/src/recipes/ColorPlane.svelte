<script lang="ts">
  let {
    hue,
    saturation,
    value,
    onchange
  }: {
    hue: number;
    saturation: number;
    value: number;
    onchange: (next: { saturation: number; value: number }) => void;
  } = $props();
  const controlId = $props.id();

  const clamp = (next: number) => Math.min(1, Math.max(0, next));
  const round = (next: number) => Math.round(clamp(next) * 100) / 100;
  let activePointer: number | null = null;

  function updateFromPointer(event: PointerEvent) {
    const bounds = event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : null;
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;
    onchange({
      saturation: round((event.clientX - bounds.left) / bounds.width),
      value: round(1 - ((event.clientY - bounds.top) / bounds.height))
    });
  }

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0 || activePointer !== null || !(event.currentTarget instanceof HTMLElement)) return;
    activePointer = event.pointerId;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers can still update in place. */ }
    updateFromPointer(event);
  }

  function pointerMove(event: PointerEvent) {
    if (activePointer === event.pointerId) updateFromPointer(event);
  }

  function finishPointer(event: PointerEvent, commitRelease: boolean) {
    if (activePointer !== event.pointerId) return;
    if (commitRelease) updateFromPointer(event);
    activePointer = null;
    if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function lostPointerCapture(event: PointerEvent) {
    if (activePointer === event.pointerId) activePointer = null;
  }

  function keydown(event: KeyboardEvent) {
    const step = event.shiftKey ? 0.1 : 0.01;
    let next = { saturation, value };
    if (event.key === 'ArrowLeft') next = { saturation: round(saturation - step), value };
    else if (event.key === 'ArrowRight') next = { saturation: round(saturation + step), value };
    else if (event.key === 'ArrowDown') next = { saturation, value: round(value - step) };
    else if (event.key === 'ArrowUp') next = { saturation, value: round(value + step) };
    else if (event.key === 'Home') next = { saturation: 0, value: 0 };
    else if (event.key === 'End') next = { saturation: 1, value: 1 };
    else return;
    event.preventDefault();
    onchange(next);
  }
</script>

<p class="visually-hidden" id={`${controlId}-instructions`}>Use arrow keys to change saturation and value. Hold Shift for larger steps. Home selects zero and End selects full.</p>
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="theme-color-plane"
  role="application"
  tabindex="0"
  aria-label="Saturation and value"
  aria-describedby={`${controlId}-instructions`}
  style={`--theme-hue:${hue};--theme-saturation:${saturation * 100}%;--theme-value:${(1 - value) * 100}%`}
  onpointerdown={pointerDown}
  onpointermove={pointerMove}
  onpointerup={(event) => finishPointer(event, true)}
  onpointercancel={(event) => finishPointer(event, false)}
  onlostpointercapture={lostPointerCapture}
  onkeydown={keydown}
>
  <span aria-hidden="true"></span>
</div>
<output class="theme-color-plane-value" aria-live="off">Saturation {Math.round(saturation * 100)}% · Value {Math.round(value * 100)}%</output>
