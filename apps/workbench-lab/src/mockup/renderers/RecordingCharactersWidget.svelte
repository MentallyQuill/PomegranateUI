<script lang="ts">
  let portraitScale = $state(2);

  const characters = [
    { initials: 'AR', name: 'Aven Rook', note: 'near the western rail', presence: 'SEEN' },
    { initials: 'MV', name: 'Mara Venn', note: 'voice behind the glass', presence: 'NEAR' },
    { initials: 'IL', name: 'Ilex', note: 'signal room, lower deck', presence: 'AWAY' },
    { initials: 'QD', name: 'The Quiet Diver', note: 'identity unresolved', presence: '?' }
  ] as const;

  function changePortraitScale(delta: number) {
    portraitScale = Math.max(1, Math.min(3, portraitScale + delta));
  }
</script>

<section class="recording-characters" aria-label="Characters">
  <header>
    <span>Story cast</span>
    <div role="group" aria-label="Character portrait size">
      <button
        type="button"
        data-pom-part="button.icon"
        aria-label="Decrease character portrait size"
        disabled={portraitScale === 1}
        onclick={() => changePortraitScale(-1)}
      >−</button>
      <button
        type="button"
        data-pom-part="button.icon"
        aria-label="Increase character portrait size"
        disabled={portraitScale === 3}
        onclick={() => changePortraitScale(1)}
      >+</button>
    </div>
  </header>

  <ul aria-label="Characters roster" data-portrait-scale={portraitScale}>
    {#each characters as character (character.name)}
      <li data-pom-part="row.surface">
        <span class="recording-character-portrait" role="img" aria-label={`Portrait of ${character.name}`}>
          {character.initials}
        </span>
        <span class="recording-character-copy">
          <strong>{character.name}</strong>
          <small>{character.note}</small>
        </span>
        <span data-testid="character-presence">{character.presence}</span>
      </li>
    {/each}
  </ul>
</section>
