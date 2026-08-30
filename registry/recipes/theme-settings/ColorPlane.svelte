<script lang="ts">
  let { hue, saturation, value, onchange }: { hue: number; saturation: number; value: number; onchange: (next: { saturation: number; value: number }) => void } = $props();
  const controlId = $props.id();
  const round = (next: number) => Math.round(Math.min(1, Math.max(0, next)) * 100) / 100;
  function point(event: PointerEvent) {
    const bounds = event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : null;
    if (bounds?.width && bounds.height) onchange({ saturation: round((event.clientX - bounds.left) / bounds.width), value: round(1 - (event.clientY - bounds.top) / bounds.height) });
  }
  function key(event: KeyboardEvent) {
    const step = event.shiftKey ? .1 : .01;
    let next = { saturation, value };
    if (event.key === 'ArrowLeft') next.saturation = round(saturation - step);
    else if (event.key === 'ArrowRight') next.saturation = round(saturation + step);
    else if (event.key === 'ArrowDown') next.value = round(value - step);
    else if (event.key === 'ArrowUp') next.value = round(value + step);
    else if (event.key === 'Home') next = { saturation: 0, value: 0 };
    else if (event.key === 'End') next = { saturation: 1, value: 1 };
    else return;
    event.preventDefault(); onchange(next);
  }
</script>
<p class="visually-hidden" id={`${controlId}-instructions`}>Use arrow keys to change saturation and value. Hold Shift for larger steps. Home selects zero and End selects full.</p>
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div class="theme-color-plane" role="application" tabindex="0" aria-label="Saturation and value" aria-describedby={`${controlId}-instructions`} style={`--theme-hue:${hue};--theme-saturation:${saturation * 100}%;--theme-value:${(1 - value) * 100}%`} onpointerdown={point} onkeydown={key}><span aria-hidden="true"></span></div>
<output class="theme-color-plane-value">Saturation {Math.round(saturation * 100)}% · Value {Math.round(value * 100)}%</output>
