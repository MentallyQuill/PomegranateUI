<script lang="ts">
  let { x, y, onchange }: { x: number; y: number; onchange: (next: { x: number; y: number }) => void } = $props();
  const controlId = $props.id();
  const clamp = (next: number) => Math.min(1, Math.max(0, next));
  const round = (next: number) => Math.round(clamp(next) * 100) / 100;

  function updateFromPointer(event: PointerEvent) {
    const bounds = event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : null;
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;
    onchange({ x: round((event.clientX - bounds.left) / bounds.width), y: round((event.clientY - bounds.top) / bounds.height) });
  }

  function keydown(event: KeyboardEvent) {
    const step = event.shiftKey ? 0.1 : 0.01;
    let next = { x, y };
    if (event.key === 'ArrowLeft') next = { x: round(x - step), y };
    else if (event.key === 'ArrowRight') next = { x: round(x + step), y };
    else if (event.key === 'ArrowUp') next = { x, y: round(y - step) };
    else if (event.key === 'ArrowDown') next = { x, y: round(y + step) };
    else if (event.key === 'Home') next = { x: 0, y: 0 };
    else if (event.key === 'End') next = { x: 1, y: 1 };
    else return;
    event.preventDefault();
    onchange(next);
  }
</script>

<p class="visually-hidden" id={`${controlId}-instructions`}>Use arrow keys to move the ambient light. Hold Shift for larger steps. Home moves to the top left and End moves to the bottom right.</p>
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="ambient-position"
  role="application"
  tabindex="0"
  aria-label="Ambient position"
  aria-describedby={`${controlId}-instructions`}
  style={`--ambient-x:${x * 100}%;--ambient-y:${y * 100}%`}
  onpointerdown={updateFromPointer}
  onkeydown={keydown}
><span aria-hidden="true"></span></div>
<output>X {Math.round(x * 100)}% · Y {Math.round(y * 100)}%</output>
