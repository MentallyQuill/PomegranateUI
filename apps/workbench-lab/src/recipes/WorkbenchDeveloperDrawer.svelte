<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  let drawer: HTMLDetailsElement;
  let launcher: HTMLElement;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !drawer.open) return;
    if (document.querySelector('dialog[open]')) return;
    event.preventDefault();
    drawer.open = false;
    launcher.focus();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<details bind:this={drawer} class="workbench-developer-drawer" data-workbench-developer-drawer>
  <summary bind:this={launcher}>
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M9.6 3.7 10.2 2h3.6l.6 1.7 1.8.8 1.6-.8 2.5 2.5-.8 1.6.8 1.8 1.7.6v3.6l-1.7.6-.8 1.8.8 1.6-2.5 2.5-1.6-.8-1.8.8-.6 1.7h-3.6l-.6-1.7-1.8-.8-1.6.8-2.5-2.5.8-1.6-.8-1.8-1.7-.6V10l1.7-.6.8-1.8-.8-1.6 2.5-2.5 1.6.8 1.8-.8Z" />
      <circle cx="12" cy="12" r="3.1" />
    </svg>
    Developer tools
  </summary>
  <section class="developer-drawer-surface" data-pom-part="menu.surface" aria-label="Workbench developer tools">
    {@render children()}
  </section>
</details>
