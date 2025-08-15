<script lang="ts">
	import type { CharacterDto, CharacterMoveImageDto } from '$lib/client/types.gen';
	import { characterControllerFindAll } from '$lib/client/sdk.gen';
	import '$lib/component/SearchCharacterImages.svelte';
	import '$lib/component/SelectCharacter.svelte';
	let allCharacters = $state<CharacterDto[]>();
	characterControllerFindAll().then((resp) => {
		if (resp.data) {
			allCharacters = resp.data;
		} else {
			allCharacters = [];
		}
	});
</script>

<div class="test-container">
	{#if allCharacters}
		<search-character-image {allCharacters} 
		characterMe={allCharacters[0]} characterOpponent={allCharacters[2]}> </search-character-image>
	{/if}
</div>

<style>
	.test-container {
		margin: 10vw;
		width: 50vw;
		height: 50vh;
	}
</style>
