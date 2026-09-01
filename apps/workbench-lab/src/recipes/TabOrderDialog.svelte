<script module lang="ts">
  export interface TabOrderItem {
    readonly id: string;
    readonly name: string;
    readonly active: boolean;
  }

  export interface TabOrderDialogOpenOptions {
    readonly label: string;
    readonly items: readonly TabOrderItem[];
    readonly invokingTab: HTMLElement;
  }
</script>

<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { createTabReorderController } from './TabReorderController.js';

  let {
    onmove,
    onclose
  }: {
    onmove: (id: string, toIndex: number) => void;
    onclose?: (() => void) | undefined;
  } = $props();

  let dialog = $state<HTMLDialogElement>();
  let list = $state<HTMLOListElement>();
  let label = $state('Reorder tabs');
  const orderListLabel = $derived(`${label.replace(/^Reorder\s+/, '')} order`);
  let items = $state<TabOrderItem[]>([]);
  let invokingTab: HTMLElement | undefined;
  let listPan: {
    pointerId: number;
    startY: number;
    scrollTop: number;
  } | null = null;

  const drag = createTabReorderController({
    axis: 'vertical',
    getItems: () => items.flatMap((item) => {
      const element = list?.querySelector<HTMLElement>(
        `[data-tab-order-id="${CSS.escape(item.id)}"]`
      );
      return element ? [{ id: item.id, element }] : [];
    }),
    commit: (id, toIndex) => moveTo(id, toIndex)
  });
  onDestroy(drag.destroy);

  export function open(options: TabOrderDialogOpenOptions) {
    drag.destroy();
    label = options.label;
    items = options.items.map((item) => ({ ...item }));
    invokingTab = options.invokingTab;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    void tick().then(() => list?.querySelector<HTMLButtonElement>('[data-tab-order-handle]')?.focus());
  }

  function moveTo(id: string, toIndex: number) {
    const fromIndex = items.findIndex((item) => item.id === id);
    const destination = Math.max(0, Math.min(items.length - 1, toIndex));
    if (fromIndex < 0 || fromIndex === destination) return;
    onmove(id, destination);
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(destination, 0, moved);
    items = next;
  }

  function moveBy(id: string, delta: number) {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    moveTo(id, index + delta);
    void tick().then(() => list?.querySelector<HTMLButtonElement>(
      `[data-tab-order-id="${CSS.escape(id)}"] [data-tab-order-handle]`
    )?.focus());
  }

  function close(value: 'done' | 'cancel') {
    drag.destroy();
    dialog?.close(value);
  }

  function restoreFocus() {
    const fallback = document.querySelector<HTMLElement>(
      '[role="tablist"][aria-label="Panels"] [role="tab"][aria-selected="true"]'
    );
    const target = invokingTab?.isConnected ? invokingTab : fallback;
    invokingTab = undefined;
    queueMicrotask(() => target?.focus());
  }

  function handleClose() {
    listPan = null;
    restoreFocus();
    onclose?.();
  }

  function handleCancel(event: Event) {
    event.preventDefault();
    close('cancel');
  }

  function beginListPan(event: PointerEvent) {
    if (event.button !== 0 || event.pointerType === 'touch') return;
    if (event.target instanceof Element && event.target.closest('button')) return;
    const owner = event.currentTarget as HTMLOListElement;
    listPan = { pointerId: event.pointerId, startY: event.clientY, scrollTop: owner.scrollTop };
    try { owner.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers do not need capture. */ }
  }

  function updateListPan(event: PointerEvent) {
    if (!listPan || listPan.pointerId !== event.pointerId) return;
    event.preventDefault();
    (event.currentTarget as HTMLOListElement).scrollTop = listPan.scrollTop + listPan.startY - event.clientY;
  }

  function endListPan(event: PointerEvent) {
    if (!listPan || listPan.pointerId !== event.pointerId) return;
    listPan = null;
  }
</script>

<dialog
  bind:this={dialog}
  class="tab-order-dialog"
  aria-label={label}
  oncancel={handleCancel}
  onclose={handleClose}
>
  <section>
    <header>
      <h2>{label}</h2>
      <p>Drag a handle or use the move buttons to change the order.</p>
    </header>
    <ol
      bind:this={list}
      aria-label={orderListLabel}
      data-tab-order-list
      onpointerdown={beginListPan}
      onpointermove={updateListPan}
      onpointerup={endListPan}
      onpointercancel={endListPan}
    >
      {#each items as item, index (item.id)}
        <li data-tab-reorder-item data-tab-order-id={item.id}>
          <button
            type="button"
            class="tab-order-handle"
            data-tab-order-handle
            data-tab-touch-reorder-grip
            aria-label={`Reorder ${item.name}`}
            onpointerdown={(event) => drag.pointerDown(event, item.id)}
            onpointermove={(event) => drag.pointerMove(event)}
            onpointerup={(event) => drag.pointerUp(event)}
            onpointercancel={(event) => drag.pointerCancel(event)}
          >
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="M4 5h8M4 8h8M4 11h8" />
            </svg>
          </button>
          <span class="tab-order-name">{item.name}</span>
          {#if item.active}<span class="tab-order-active">Active</span>{/if}
          <button
            type="button"
            aria-label={`Move ${item.name} up`}
            disabled={index === 0}
            onclick={() => moveBy(item.id, -1)}
          >Move up</button>
          <button
            type="button"
            aria-label={`Move ${item.name} down`}
            disabled={index === items.length - 1}
            onclick={() => moveBy(item.id, 1)}
          >Move down</button>
        </li>
      {/each}
    </ol>
    <footer>
      <button type="button" onclick={() => close('cancel')}>Cancel</button>
      <button type="button" onclick={() => close('done')}>Done</button>
    </footer>
  </section>
</dialog>

<style>
  .tab-order-dialog {
    width: min(42rem, calc(100vw - 2rem));
    max-height: min(44rem, calc(100vh - 2rem));
    padding: 0;
    overflow: hidden;
  }

  section { display: grid; max-height: inherit; }
  header { padding: 1rem 1rem .75rem; border-bottom: 1px solid var(--line); }
  h2 { margin: 0; font-size: 1.2rem; }
  p { margin: .35rem 0 0; color: var(--muted); font-size: .8rem; }

  ol {
    display: grid;
    gap: .4rem;
    max-height: min(28rem, calc(100vh - 13rem));
    margin: 0;
    padding: .75rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    user-select: none;
  }

  li {
    display: grid;
    grid-template-columns: 44px minmax(7rem, 1fr) auto auto auto;
    gap: .45rem;
    align-items: center;
    min-height: 52px;
    padding: .35rem;
    border: 1px solid var(--line);
    border-radius: var(--pom-radius-small, .45rem);
    background: color-mix(in srgb, var(--pom-material-panel, var(--glass)) 88%, transparent);
  }

  .tab-order-handle {
    display: grid;
    place-items: center;
    width: 44px;
    min-width: 44px;
    height: 44px;
    min-height: 44px;
    padding: 0;
    cursor: grab;
    touch-action: none;
  }
  .tab-order-handle:active { cursor: grabbing; }
  .tab-order-handle svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; }
  .tab-order-name { min-width: 0; overflow-wrap: anywhere; }
  .tab-order-active { color: var(--muted); font-size: .72rem; }
  footer { display: flex; justify-content: flex-end; gap: .5rem; padding: .75rem 1rem 1rem; border-top: 1px solid var(--line); }

  :global(.tab-order-dialog .tab-reorder-marker) { width: 100% !important; }
  :global(.tab-order-dialog .is-tab-reorder-origin) { min-height: 0; padding-block: 0; border-width: 0; }

  @media (max-width: 520px), (pointer: coarse) {
    .tab-order-dialog {
      width: 100vw;
      max-width: none;
      max-height: min(80vh, 42rem);
      margin: auto 0 0;
      border-radius: var(--pom-radius-large, .75rem) var(--pom-radius-large, .75rem) 0 0;
      background: var(--pom-material-opaque, var(--pom-color-canvas));
    }
    ol { max-height: min(20rem, calc(80vh - 10rem)); }
    li { grid-template-columns: 44px minmax(0, 1fr) auto auto; }
    .tab-order-handle { grid-column: 1; grid-row: 1 / span 2; }
    .tab-order-name { grid-column: 2; grid-row: 1; }
    .tab-order-active { grid-column: 2; grid-row: 2; }
    li > button:nth-of-type(2) { grid-column: 3; grid-row: 1 / span 2; }
    li > button:nth-of-type(3) { grid-column: 4; grid-row: 1 / span 2; }
  }
</style>
