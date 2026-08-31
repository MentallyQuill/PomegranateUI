<script module lang="ts">
  export type IconActionKind =
    | 'open-catalog'
    | 'create-panel'
    | 'save-layout'
    | 'load-layout'
    | 'clear-layout'
    | 'undo-layout'
    | 'open-shelf'
    | 'focus-reading';
</script>

<script lang="ts">
  let {
    label,
    visualLabel,
    action,
    disabled = false,
    pressed,
    expanded,
    onclick,
    class: className = ''
  }: {
    label: string;
    visualLabel?: string | undefined;
    action: IconActionKind;
    disabled?: boolean;
    pressed?: boolean;
    expanded?: boolean;
    onclick?: (event: MouseEvent) => void;
    class?: string;
  } = $props();
</script>

<button
  class={className}
  type="button"
  data-pom-part="button.icon"
  data-pom-icon-action
  data-pom-action={action}
  aria-label={label}
  aria-pressed={pressed}
  aria-expanded={expanded}
  {disabled}
  {onclick}
  style="display:var(--pom-icon-action-display,inline-grid);min-width:var(--pom-icon-action-hit-size,44px);min-height:var(--pom-icon-action-hit-size,44px);align-items:center;justify-content:center"
>
  <span data-pom-action-icon aria-hidden="true">
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      {#if action === 'open-catalog'}
        <rect x="2" y="2" width="20" height="20" />
        <path d="M12 2v20M2 12h20" />
      {:else if action === 'create-panel'}
        <rect x="3.5" y="5" width="17" height="14" rx="2" />
        <path d="M12 8.5v7M8.5 12h7" />
      {:else if action === 'save-layout'}
        <path d="M12 3v11M7.5 9.5 12 14l4.5-4.5" />
        <path d="M5 14.5V20h14v-5.5" />
      {:else if action === 'load-layout'}
        <path d="M12 17V6M7.5 10.5 12 6l4.5 4.5" />
        <path d="M5 14.5V20h14v-5.5" />
      {:else if action === 'clear-layout'}
        <path d="M7 7.5h10l-.7 12H7.7L7 7.5Z" />
        <path d="M9 7.5V4.5h6v3M5 7.5h14M10 11v5M14 11v5" />
      {:else if action === 'undo-layout'}
        <path d="M8 8H3.5V3.5" />
        <path d="M4 8a8.5 8.5 0 1 1 1.8 9.5" />
      {:else if action === 'focus-reading'}
        <path d="M4 6.5h6.5c1.1 0 1.5.6 1.5 1.5v10c0-.9-.4-1.5-1.5-1.5H4z" />
        <path d="M20 6.5h-6.5c-1.1 0-1.5.6-1.5 1.5v10c0-.9.4-1.5 1.5-1.5H20z" />
      {:else}
        <path d="M4 7h16v12H4zM3 4h18v3H3z" />
        <path d="M9 11h6" />
      {/if}
    </svg>
  </span>
  <span data-pom-action-label>{visualLabel ?? label}</span>
</button>

<style>
  button[data-pom-icon-action] {
    display: inline-grid;
    box-sizing: border-box;
    min-width: 44px;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    grid-auto-flow: column;
    gap: 0.4em;
  }

  [data-pom-action-icon] {
    display: var(--pom-presentation-action-icon-display, none);
    place-items: center;
    width: 1.15em;
    height: 1.15em;
  }

  [data-pom-action-icon] svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  [data-pom-action-label] {
    display: var(--pom-presentation-action-label-display, inline);
  }
</style>
