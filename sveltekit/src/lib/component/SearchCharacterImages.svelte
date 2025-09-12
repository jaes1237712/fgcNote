<svelte:options customElement="search-character-image" />

<script lang="ts">
	import type { CharacterDto, CharacterMoveImageDto } from '$lib/client/types.gen';
	import { characterControllerFindImages, characterControllerFindAll } from '$lib/client/sdk.gen';
	import { searchCharacterImages } from '$lib/utils/searchCharacterImages';
	import { PUBLIC_NESTJS_URL } from '$env/static/public';
	import '$lib/component/SelectCharacter.svelte';
	let {
		characterMe,
		characterOpponent
	}: {
		allCharacters: CharacterDto[];
		characterMe: CharacterDto;
		characterOpponent: CharacterDto;
	} = $props();
	function mergeImagesUniqueByFileName(
		arr1: CharacterMoveImageDto[],
		arr2: CharacterMoveImageDto[]
	): CharacterMoveImageDto[] {
		const map = new Map<string, CharacterMoveImageDto>();
		for (const img of arr1) {
			map.set(img.fileName, img);
		}
		for (const img of arr2) {
			if (!map.has(img.fileName)) {
				map.set(img.fileName, img);
			}
		}
		return Array.from(map.values());
	}

	let moveImagesMe = $state<CharacterMoveImageDto[]>([]);
	let moveImagesOpponent = $state<CharacterMoveImageDto[]>([]);
	$effect(() => {
		if (!characterMe) {
			moveImagesMe = [];
		} else {
			characterControllerFindImages({ path: { id: characterMe.id } }).then((resp) => {
				if (resp.data) {
					moveImagesMe = resp.data;
				}
			});
		}
		if (!characterOpponent) {
			moveImagesOpponent = [];
		} else {
			characterControllerFindImages({ path: { id: characterOpponent.id } }).then((resp) => {
				if (resp.data) {
					moveImagesOpponent = resp.data;
				}
			});
		}
	});
	let allImages = $derived.by<CharacterMoveImageDto[]>(() => {
		if (!moveImagesMe || !moveImagesOpponent) return [];
		return mergeImagesUniqueByFileName(moveImagesMe, moveImagesOpponent);
	});
	let searchValue = $state<string>('');
	let filterImages = $derived<CharacterMoveImageDto[]>(
		searchCharacterImages({ input: searchValue, images: allImages })
	);
	let visibleCount = $state<number>(5);
	let sentinel = $state<HTMLLIElement | null>(null);
	let observer: IntersectionObserver | null = null;
	$effect(() => {
		if (filterImages) {
			visibleCount = 5;
		}
	});
	function observeSentinel() {
		if (observer) observer.disconnect();
		observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				if (visibleCount < filterImages.length) {
					visibleCount = Math.min(visibleCount + 5, filterImages.length);
				}
			}
		});
		if (sentinel) observer.observe(sentinel);
	}
	$effect(() => {
		if (sentinel) {
			observeSentinel();
		}
	});
</script>

<div class="search-character-panel">
	<div class="character-versus">
		<select-character
			allCharacters={[characterMe, characterOpponent]}
			size="6vw"
			defaultCharacter={characterMe}
			onselectCharacter={(event) => {
				characterMe = event.detail.character;
			}}
		>
		</select-character>
		<p>vs.</p>
		<select-character
			allCharacters={[characterMe, characterOpponent]}
			defaultCharacter={characterOpponent}
			size="6vw"
			onselectCharacter={(event) => {
				characterOpponent = event.detail.character;
			}}
		>
		</select-character>
	</div>

	{#if moveImagesMe && moveImagesOpponent}
		<div class="search-character-image">
			<input type="text" bind:value={searchValue} />
			<ul>
				{#each filterImages.slice(0, visibleCount) as image}
					<li>
						<button
							onclick={() => {
								$host().dispatchEvent(
									new CustomEvent('selectImage', {
										detail: {
											image: image
										}
									})
								);
							}}
						>
							<span>{image.fileName}</span>
							<img src={PUBLIC_NESTJS_URL + image.filePath} alt={image.fileName} />
						</button>
					</li>
				{/each}
				{#if visibleCount < filterImages.length}
					<li bind:this={sentinel} style="height: 1px;">loading</li>
				{/if}
			</ul>
		</div>
	{:else}
		Loading
	{/if}
</div>

<style>
	.search-character-panel {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		.character-versus {
			display: flex;
			flex-direction: row;
			justify-content: space-evenly;
			align-items: end;
			font-size: xx-large;
			height: fit-content;
			color: white;
		}
		.search-character-image {
			width: 100%;
			flex: 1;
			display: flex;
			flex-direction: column;
			min-height: 0; /* 重要：讓 flex 子元素能夠縮小 */
			/* overflow-y: hidden;
			overflow-x: hidden; */
			color: white;
			input {
				font-size: x-large;
				height: 3rem;
				background-color: oklch(0.9 0.02 264.15);
				width: 100%;
			}
			ul {
				min-height: 0; /* 重要：讓 flex 子元素能夠縮小 */
				flex: 1;
				list-style: none;
				padding-left: 0;
				display: flex;
				flex-direction: column;
				overflow-y: scroll;
				overflow-x: hidden;
				li {
					button {
						color: white;
						width: 100%;
						height: 15vh;
						display: flex;
						background-color: oklch(0.45 0.02 267.56);
						flex-direction: row;
						justify-content: space-between;
						align-items: center;
						font-size: x-large;
						img {
							height: 100%;
						}
					}
				}
			}
		}
	}
</style>
