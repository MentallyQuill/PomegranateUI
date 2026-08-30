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
  <summary bind:this={launcher}>Developer tools</summary>
  <section class="developer-drawer-surface" data-pom-part="menu.surface" aria-label="Workbench developer tools">
    {@render children()}
  </section>
</details>
