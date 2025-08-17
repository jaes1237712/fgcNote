<script lang="ts">
	import type { CharacterDto, CharacterMoveImageDto } from '$lib/client/types.gen';
	import { characterControllerFindAll } from '$lib/client/sdk.gen';
	import '$lib/component/SearchCharacterImages.svelte';
	import '$lib/component/SelectCharacter.svelte';
	import '$lib/component/SwitchControllerType.svelte'
	import '$lib/component/NumpadEditor.svelte'
	import type {UserSettings} from '$lib/userInterface'
	import { onMount } from 'svelte';
	let allCharacters = $state<CharacterDto[]>();
	characterControllerFindAll().then((resp) => {
		if (resp.data) {
			allCharacters = resp.data;
		} else {
			allCharacters = [];
		}
	});
	
	const SCREEN_WIDTH = screen.width;
	const SCREEN_HEIGHT = screen.height;
	const LENGTH_UNIT = SCREEN_WIDTH / 100;
	const USER_SETTINGS: UserSettings ={
		viewportWidthUnit: SCREEN_WIDTH/100,
		viewportHeightUnit: SCREEN_HEIGHT/100,
		lengthUnit: LENGTH_UNIT,
		moveImageHeight:5,
		commandSize:3,
		defaultControllerType: 'CLASSIC'
	}
</script>

<div class="test-container">
	{#if allCharacters}
	<search-character-image 
			allCharacters={allCharacters}
			characterMe={allCharacters[0]}
			characterOpponent={allCharacters[1]}
			onselectImage={(event)=>{
				const image = event.detail.image as CharacterMoveImageDto;
			}}
			>
	</search-character-image>
	{/if}
</div>

<style>
	.test-container {
		margin: 10vw;
		width: 50vw;
		height: 50vh;
	}
	search-character-image {
		display: block;
		width: 50vw;
		height: 50vh;
	}
</style>
