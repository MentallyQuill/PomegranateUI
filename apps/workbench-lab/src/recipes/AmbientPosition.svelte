<script lang="ts">
  let {
    x,
    y,
    radius,
    power,
    onchange,
    onradiuschange,
    onpowerchange
  }: {
    x: number;
    y: number;
    radius?: number | undefined;
    power?: number | undefined;
    onchange: (next: { x: number; y: number }) => void;
    onradiuschange?: ((next: number) => void) | undefined;
    onpowerchange?: ((next: number) => void) | undefined;
  } = $props();
  const controlId = $props.id();
  const clamp = (next: number) => Math.min(1, Math.max(0, next));
  const round = (next: number) => Math.round(clamp(next) * 100) / 100;
  let stagePointer: number | null = null;

  function updateFromPointer(event: PointerEvent) {
    const bounds = event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : null;
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;
    onchange({ x: round((event.clientX - bounds.left) / bounds.width), y: round((event.clientY - bounds.top) / bounds.height) });
  }

  function stagePointerDown(event: PointerEvent) {
    if (event.target instanceof Element && event.target.closest('.ambient-ring-handle')) return;
    if (!(event.currentTarget instanceof HTMLElement)) return;
    stagePointer = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  }

  function stagePointerMove(event: PointerEvent) {
    if (stagePointer === event.pointerId) updateFromPointer(event);
  }

  function stagePointerEnd(event: PointerEvent) {
    if (stagePointer !== event.pointerId) return;
    stagePointer = null;
    if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
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

  function ringPointer(event: PointerEvent, update: (next: number) => void) {
    const stage = event.currentTarget instanceof Element ? event.currentTarget.closest('.ambient-position') : null;
    const bounds = stage instanceof HTMLElement ? stage.getBoundingClientRect() : null;
    if (!bounds) return;
    const centerX = bounds.left + bounds.width * x;
    const centerY = bounds.top + bounds.height * y;
    const degrees = Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
    update(round(((degrees + 450) % 360) / 360));
  }

  function ringPointerDown(event: PointerEvent, update: (next: number) => void) {
    if (!(event.currentTarget instanceof HTMLInputElement)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    ringPointer(event, update);
  }

  function ringPointerMove(event: PointerEvent, update: (next: number) => void) {
    if (event.currentTarget instanceof HTMLInputElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
      ringPointer(event, update);
    }
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
  onpointerdown={stagePointerDown}
  onpointermove={stagePointerMove}
  onpointerup={stagePointerEnd}
  onpointercancel={stagePointerEnd}
  onkeydown={keydown}
>
  <span class="ambient-reticle" aria-hidden="true"></span>
  {#if radius !== undefined && onradiuschange}
    <span
      class="ambient-ring"
      data-ambient-ring="size"
      style={`--ambient-ring-size:54px;--ambient-ring-angle:${radius * 360 - 90}deg;--ambient-ring-alpha:14%`}
    >
      <input
        class="ambient-ring-handle"
        aria-label="Radius"
        type="range"
        min="0"
        max="100"
        value={Math.round(radius * 100)}
        oninput={(event) => onradiuschange(Number(event.currentTarget.value) / 100)}
        onpointerdown={(event) => ringPointerDown(event, onradiuschange)}
        onpointermove={(event) => ringPointerMove(event, onradiuschange)}
      />
      <i aria-hidden="true"></i>
    </span>
  {/if}
  {#if power !== undefined && onpowerchange}
    <span
      class="ambient-ring"
      data-ambient-ring="intensity"
      style={`--ambient-ring-size:76px;--ambient-ring-angle:${power * 360 - 90}deg;--ambient-ring-alpha:21%`}
    >
      <input
        class="ambient-ring-handle"
        aria-label="Power"
        type="range"
        min="0"
        max="100"
        value={Math.round(power * 100)}
        oninput={(event) => onpowerchange(Number(event.currentTarget.value) / 100)}
        onpointerdown={(event) => ringPointerDown(event, onpowerchange)}
        onpointermove={(event) => ringPointerMove(event, onpowerchange)}
      />
      <i aria-hidden="true"></i>
    </span>
  {/if}
  <span class="ambient-position-handle" aria-hidden="true"></span>
</div>
<output>X {Math.round(x * 100)}% · Y {Math.round(y * 100)}%</output>
