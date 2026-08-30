<script lang="ts">
  let { x, y, onchange }: { x: number; y: number; onchange: (next: { x: number; y: number }) => void } = $props();
  const controlId = $props.id();
  const round = (next: number) => Math.round(Math.min(1, Math.max(0, next)) * 100) / 100;
  function point(event: PointerEvent) { const bounds = event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : null; if (bounds?.width && bounds.height) onchange({ x: round((event.clientX - bounds.left) / bounds.width), y: round((event.clientY - bounds.top) / bounds.height) }); }
  function key(event: KeyboardEvent) { const step = event.shiftKey ? .1 : .01; let next = { x, y }; if (event.key === 'ArrowLeft') next.x = round(x - step); else if (event.key === 'ArrowRight') next.x = round(x + step); else if (event.key === 'ArrowUp') next.y = round(y - step); else if (event.key === 'ArrowDown') next.y = round(y + step); else if (event.key === 'Home') next = { x: 0, y: 0 }; else if (event.key === 'End') next = { x: 1, y: 1 }; else return; event.preventDefault(); onchange(next); }
</script>
<p class="visually-hidden" id={`${controlId}-instructions`}>Use arrow keys to move the ambient light. Hold Shift for larger steps.</p>
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div class="ambient-position" role="application" tabindex="0" aria-label="Ambient position" aria-describedby={`${controlId}-instructions`} style={`--ambient-x:${x * 100}%;--ambient-y:${y * 100}%`} onpointerdown={point} onkeydown={key}><span aria-hidden="true"></span></div>
<output>X {Math.round(x * 100)}% · Y {Math.round(y * 100)}%</output>
