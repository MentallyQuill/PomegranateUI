<script lang="ts">
  import { tick } from 'svelte';
  import type { WorkbenchCommand, WorkbenchState } from '@pomegranate-ui/contracts';
  import { selectPanelSurface, type WidgetFrameProjection, type WorkbenchStore } from '@pomegranate-ui/core';
  let { store, onexpanddock }: { store: WorkbenchStore; onexpanddock?: ((edge: 'left' | 'right') => void) | undefined } = $props();
  let snapshot = $state<WorkbenchState>();
  let trigger = $state<HTMLButtonElement>();
  let panel = $state<HTMLDivElement>();
  let open = $state(false);
  let placing = $state<string>();
  let destination = $state('');
  let error = $state('');
  let openedOwner = '';
  $effect(() => {
    snapshot = store.getState();
    return store.subscribe((next) => { snapshot = next; });
  });
  const surface = $derived(snapshot ? selectPanelSurface(snapshot, store.registry, store.templates) : null);
  const owner = $derived(`${surface?.panelId}/${surface?.activeSubPanelId ?? ''}`);
  const ownerPanel = $derived(snapshot?.panels.find(panel => panel.id === surface?.panelId));
  const ownerName = $derived(ownerPanel?.subPanels?.find(sub => sub.id === surface?.activeSubPanelId)?.name ?? ownerPanel?.name ?? 'this workspace');
  const current = $derived(surface?.widgetShelf.find(frame => frame.instanceId === placing));
  const destinations = $derived(current ? placementOptions(current) : []);
  $effect(() => { if (open && owner !== openedOwner) close(false); });

  function location(frame: WidgetFrameProjection) {
    if (frame.placement.kind !== 'shelved' || !snapshot) return '';
    const last = frame.placement.lastVisible;
    const ownerPanel = snapshot.panels.find(panel => panel.id === last.panelId);
    const subPanel = ownerPanel?.subPanels?.find(sub => sub.id === last.subPanelId);
    const region = last.kind === 'docked' ? surface?.regions.find(item => item.region.id === last.regionId) : undefined;
    const shelves = last.kind === 'docked' ? snapshot.shelves.filter(shelf => shelf.panelId === last.panelId && shelf.regionId === last.regionId).sort((a, b) => a.order - b.order) : [];
    const index = last.kind === 'docked' ? shelves.findIndex(shelf => shelf.id === last.shelfId) : -1;
    return [ownerPanel?.name, subPanel?.name, last.kind === 'floating' ? 'Floating' : region?.region.label ?? 'Previous dock', index >= 0 ? `Shelf ${index + 1}` : ''].filter(Boolean).join(' · ');
  }

  function placementOptions(frame: WidgetFrameProjection) {
    if (!surface || !snapshot) return [];
    const choices: { key: string; label: string; command: WorkbenchCommand }[] = [];
    for (const { region, lane, shelves } of surface.regions) {
      const shelf = shelves[0]?.shelf ?? snapshot.shelves.find(shelf => shelf.panelId === surface!.panelId && shelf.regionId === region.id);
      const placement = { kind: 'docked' as const, panelId: surface.panelId, regionId: region.id, shelfId: shelf?.id ?? 'primary', order: Number.MAX_SAFE_INTEGER,
        ...(surface.activeSubPanelId ? { subPanelId: surface.activeSubPanelId, lane } : {}) };
      choices.push({ key: `region:${region.id}`, label: `Dock in ${region.label}`, command: shelf
        ? { type: 'widget.place', instanceId: frame.instanceId, placement }
        : { type: 'shelf.create-and-place', instanceId: frame.instanceId, placement, shelf: { id: placement.shelfId, panelId: placement.panelId, regionId: region.id, order: 0, weight: 1 } } });
    }
    for (const target of [...surface.docks.left, ...surface.docks.main, ...surface.docks.right]) {
      for (const [relation, label] of [['before', 'Before'], ['after', 'After'], ['tab', 'Group with']] as const) choices.push({
        key: `${relation}:${target.instanceId}`, label: `${label} ${target.title}`,
        command: { type: 'widget.place-relative', instanceId: frame.instanceId, targetInstanceId: target.instanceId, relation }
      });
    }
    choices.push({ key: 'float', label: 'Float on this Panel', command: {
      type: 'widget.place', instanceId: frame.instanceId, placement: { kind: 'floating', panelId: surface.panelId,
        ...(surface.activeSubPanelId ? { subPanelId: surface.activeSubPanelId } : {}),
        x: 24, y: 24, width: 360, height: frame.manifest?.catalog?.geometry.idealHeight ?? 240,
        z: Math.max(0, ...Object.values(snapshot.placements).map(placement => placement.kind === 'floating' ? placement.z : 0)) + 1 }
    } });
    return choices;
  }

  function position() {
    if (!open || !panel || !trigger) return;
    const anchor = trigger.getBoundingClientRect();
    panel.style.left = `${Math.max(8, Math.min(innerWidth - panel.offsetWidth - 8, anchor.right - panel.offsetWidth))}px`;
    panel.style.top = `${Math.max(8, Math.min(innerHeight - panel.offsetHeight - 8, anchor.bottom + 6))}px`;
  }
  async function toggle() {
    if (open) { close(); return; }
    if (!panel) return;
    openedOwner = owner;
    open = true;
    panel.showPopover?.();
    await tick();
    position();
    panel.querySelector<HTMLButtonElement>('[data-shelf-close]')?.focus({ preventScroll: true });
  }
  function close(restore = true) {
    panel?.hidePopover?.();
    open = false;
    placing = undefined;
    destination = '';
    error = '';
    if (restore) trigger?.focus({ preventScroll: true });
  }
  function onToggle(event: ToggleEvent) {
    if (event.newState === 'closed') { open = false; placing = undefined; destination = ''; error = ''; }
  }
  async function choose(frame: WidgetFrameProjection) {
    placing = frame.instanceId;
    destination = '';
    error = '';
    await tick();
    position();
    panel?.querySelector<HTMLSelectElement>('select')?.focus();
  }
  async function cancelChoice() {
    const id = placing;
    placing = undefined;
    destination = '';
    error = '';
    await tick();
    panel?.querySelector<HTMLButtonElement>(`[data-shelf-place="${CSS.escape(id ?? '')}"]`)?.focus();
    position();
  }
  async function run(command: WorkbenchCommand) {
    const result = store.dispatch(command);
    if (!result.ok) { error = result.error.message; return; }
    close();
    if (!('instanceId' in command)) return;
    const placement = store.getState().placements[command.instanceId];
    if (!placement || placement.kind === 'shelved') return;
    if (placement.kind === 'docked' && (placement.regionId === 'left' || placement.regionId === 'right')) onexpanddock?.(placement.regionId);
    await tick();
    const target = document.querySelector<HTMLElement>(`[data-focus-widget-for="${CSS.escape(command.instanceId)}"]`);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
</script>

<svelte:window onresize={position} onkeydown={(event) => { if (open && event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); close(); } }} />
<div class="widget-shelf" data-widget-shelf data-empty={(surface?.widgetShelf.length ?? 0) === 0}>
  <button bind:this={trigger} type="button" aria-label="Open Widget Shelf" aria-haspopup="dialog" aria-expanded={open} data-pom-part="button.icon" data-pom-icon-action data-pom-action="open-shelf" onclick={toggle}>
    <span data-pom-action-icon aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M4 7h16v12H4zM3 4h18v3H3zM9 11h6" /></svg>
    </span>
    <span data-pom-action-label>Widget Shelf</span>
    <span class="widget-shelf-count">{surface?.widgetShelf.length ?? 0}</span>
  </button>
  <div bind:this={panel} class="widget-shelf-panel" popover="auto" role="dialog" aria-label="Widget Shelf" data-open={open} ontoggle={onToggle}>
    <header><h2>Widget Shelf</h2><button type="button" data-shelf-close onclick={() => close()} aria-label="Close Widget Shelf">Close</button></header>
    <p>Saved widgets for {ownerName}. Put back in their previous position or choose a new one.</p>
    {#if surface?.widgetShelf.length}
      {#each surface.widgetShelf as frame (frame.instanceId)}
        <article aria-label={frame.title}>
          <div class="widget-shelf-location"><strong>{frame.title}</strong><small>{location(frame)}</small></div>
          <div class="widget-shelf-row-actions">
            <button type="button" onclick={() => run({ type: 'widget.restore', instanceId: frame.instanceId })}>Put back</button>
            <button type="button" data-shelf-place={frame.instanceId} onclick={() => choose(frame)}>Place…</button>
            <button type="button" onclick={() => window.confirm(`Delete ${frame.title} from this layout?`) && run({ type: 'widget.delete', instanceId: frame.instanceId })}>Delete…</button>
          </div>
          {#if placing === frame.instanceId}
            <fieldset><legend>Place {frame.title}</legend>
              <label>Destination<select bind:value={destination}><option value="" disabled>Choose a destination</option>{#each destinations as target (target.key)}<option value={target.key}>{target.label}</option>{/each}</select></label>
              <div class="widget-shelf-row-actions"><button type="button" disabled={!destination} onclick={() => { const target = destinations.find(target => target.key === destination); if (target) run(target.command); }}>Place widget</button><button type="button" onclick={cancelChoice}>Cancel placement</button></div>
            </fieldset>
          {/if}
        </article>
      {/each}
    {:else}
      <p>No saved widgets in {ownerName}.</p>
    {/if}
    {#if error}<p role="alert">{error}</p>{/if}
  </div>
</div>
