<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { canvasDataStore } from './canvas-data-manager.svelte';
	import ImageComponent from './image/CharacterMoveImageComponent.svelte';
	import NumpadBlockComponent from './numpad/NumpadBlockComponent.svelte';
	import ArrowComponent from './arrow/ArrowComponent.svelte';
	import Konva from 'konva';
	import { contextMenuState } from './context_menu/canvas-context-menu.svelte';
	import { featureManager } from './canvas-feature-manager';
	let konvaContainer = $state<HTMLDivElement>();
	let layer = $state<Konva.Layer>();
	let stage = $state<Konva.Stage>();
	onMount(() => {
		stage = new Konva.Stage({
			container: konvaContainer,
			id: canvasDataStore.stageData.id,
			width: konvaContainer.clientWidth,
			height: konvaContainer.clientHeight
		});
		stage.on('contextmenu', (event) => {
			event.evt.preventDefault();
			console.log('stage on contextmenu');
			contextMenuState.show(event.evt.clientX, event.evt.clientY, 'stage', stage.id());
		});
		stage.on('click tap', () => {
			contextMenuState.visible = false;
			featureManager.deactivate();
		});
		layer = new Konva.Layer();
		stage.add(layer);
		console.log('data:', canvasDataStore.nodesDataInDesiredOrder);
	});
</script>

<div id="konva-container" bind:this={konvaContainer}></div>
{#if layer}
	{#each canvasDataStore.nodesDataInDesiredOrder as data}
		{#if data.kind == 'NUMPAD_BLOCK'}
			<NumpadBlockComponent {layer} {data} userSettings={canvasDataStore.userSettings} {stage} />
		{:else if data.kind == 'CHARACTER_MOVE_IMAGE'}
			<ImageComponent {layer} {data} userSettings={canvasDataStore.userSettings} {stage} />
		{:else if data.kind == 'ARROW'}
			<ArrowComponent {layer} {data} />
		{/if}
	{/each}
{/if}

<style>
	#konva-container {
		width: 100vw;
		height: 100vh;
	}
</style>
