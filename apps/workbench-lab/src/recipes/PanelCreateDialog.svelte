<script lang="ts">
  let { oncreate }: { oncreate: (request: { name: string; templateId: string; columns?: number }) => void } = $props();
  let dialog: HTMLDialogElement;
  let name = $state('New Panel');
  let templateId = $state('columns.v1');
  let columns = $state(3);

  export function showModal() {
    dialog.showModal();
  }

  export function close() {
    dialog.close();
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    oncreate({ name: name.trim() || 'Untitled Panel', templateId, ...(templateId === 'columns.v1' ? { columns } : {}) });
  }
</script>

<dialog bind:this={dialog} data-pom-part="dialog.surface" aria-labelledby="panel-dialog-title">
  <form onsubmit={submit}>
    <h2 id="panel-dialog-title">Create a Panel</h2>
    <label>Panel name<input data-pom-part="field.surface" bind:value={name} /></label>
    <fieldset class="panel-template-choices">
      <legend>Layout template</legend>
      {#each [
        ['story-stage.v1', 'Story Stage', 'Left and right instruments around a central stage and composer.'],
        ['focus-support.v1', 'Focus + Support', 'A large focus region with a supporting region.'],
        ['columns.v1', 'Columns', 'Two through six equal working columns.']
      ] as option (option[0])}
        <label>
          <input type="radio" name="panel-template" value={option[0]} bind:group={templateId} />
          <span><strong>{option[1]}</strong><small>{option[2]}</small></span>
        </label>
      {/each}
    </fieldset>
    {#if templateId === 'columns.v1'}
      <label>Columns
        <select data-pom-part="field.surface" bind:value={columns}>
          {#each [2, 3, 4, 5, 6] as count}<option value={count}>{count}</option>{/each}
        </select>
      </label>
    {/if}
    <div>
      <button type="button" data-pom-part="button.surface" onclick={() => dialog.close()}>Cancel</button>
      <button type="submit" data-pom-part="button.surface">Create Panel</button>
    </div>
  </form>
</dialog>
