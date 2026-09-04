<script lang="ts">
  import type { WidgetInstanceId } from '@pomegranate-ui/contracts';

  export interface ToolbarColumnWidgetSummary {
    readonly id: WidgetInstanceId;
    readonly title: string;
  }

  let { edge, widgets, onconfirm, oncancel }: {
    edge: 'left' | 'right';
    widgets: readonly ToolbarColumnWidgetSummary[];
    onconfirm: (widgetIds: readonly WidgetInstanceId[]) => boolean;
    oncancel: () => void;
  } = $props();

  let dialog: HTMLDialogElement;
  let cancelButton: HTMLButtonElement;
  let listedIds = $state<readonly WidgetInstanceId[]>([]);
  const titleId = $derived(`remove-${edge}-toolbar-column-title`);

  export function open() {
    listedIds = widgets.map(({ id }) => id);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    queueMicrotask(() => cancelButton?.focus());
  }

  function close() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function cancel() {
    close();
    oncancel();
  }

  function confirm() {
    if (onconfirm(listedIds)) close();
    else listedIds = widgets.map(({ id }) => id);
  }

  function cancelEvent(event: Event) {
    event.preventDefault();
    cancel();
  }
</script>

<dialog
  bind:this={dialog}
  class="toolbar-column-removal-dialog"
  data-pom-part="dialog.surface"
  aria-labelledby={titleId}
  oncancel={cancelEvent}
>
  <section>
    <header>
      <h2 id={titleId}>Remove {edge} toolbar column?</h2>
      <p>Removing this column will also remove {widgets.length} {widgets.length === 1 ? 'Widget' : 'Widgets'} from this Panel.</p>
    </header>
    <ul aria-label="Widgets that will be removed">
      {#each widgets as widget (widget.id)}<li>{widget.title}</li>{/each}
    </ul>
    <footer>
      <button bind:this={cancelButton} type="button" data-pom-part="button.surface" onclick={cancel}>Cancel</button>
      <button class="toolbar-column-remove-confirm" type="button" data-pom-part="button.surface" onclick={confirm}>Remove column</button>
    </footer>
  </section>
</dialog>
