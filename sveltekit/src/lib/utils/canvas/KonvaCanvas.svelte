<script lang="ts">
	import {onMount } from 'svelte';
	import { CanvasDataStore} from './canvas-data-manager.svelte';
	import { contextMenuState } from './context_menu/canvas-context-menu.svelte';
	import type { CanvasNumpadBlockDto, CanvasStageDto } from '$lib/client';
	import { KonvaObjectManager } from './canvas-object-manager';
	import type { UserSettings } from '$lib/userInterface';
	import type { CONTROLLER_TYPE } from './numpad/numpadCompiler';
	import NumpadEditor from '$lib/component/NumpadEditor.svelte';
	let {stageData, userSettings}: {stageData: CanvasStageDto;userSettings: UserSettings;} = $props();
	let konvaContainer = $state<HTMLDivElement>();
	let numpadEditorDialog = $state<HTMLDialogElement>();
	let numpadEditorValue = $state<{
		input: string,
		type: CONTROLLER_TYPE
	}>();
	let imageSearchDialog = $state<HTMLDialogElement>();
	let canvasDataStore = $state<CanvasDataStore>()
	let konvaObjectManger = $state<KonvaObjectManager>()
	onMount( async () => {
		canvasDataStore = new CanvasDataStore()
		konvaObjectManger = new KonvaObjectManager(
			konvaContainer,
			stageData.id,
			userSettings,
			canvasDataStore
		)
		canvasDataStore.setKonvaObjectManger(konvaObjectManger)
		await canvasDataStore.SetStageDataAndFetchBackendData(stageData)
		// await konvaObjectManger.InitializeObjectByDataStore()
	});

	// 處理右鍵選單選項點擊
	function handleContextMenuOption(optionId: string) {
		switch (optionId) {
			case 'insert-block':
				numpadEditorDialog.showModal();
				break;
			case 'edit-block':
				numpadEditorDialog.showModal();
				break;
			case 'insert-image':
				imageSearchDialog.showModal();
				break;
			case 'delete-block':
				canvasDataStore.deleteNodeData(contextMenuState.targetId);
				break;
			case 'delete-image':
				canvasDataStore.deleteNodeData(contextMenuState.targetId);
				break;
		}
		contextMenuState.hide();
	}
	function numpadDialogCreateBlock(){
		if(contextMenuState.targetType === 'stage'){
			const newId = crypto.randomUUID()
			const rec_konva = konvaContainer.getBoundingClientRect();
			const newNumpadBlockData: CanvasNumpadBlockDto ={
				kind:'NUMPAD_BLOCK',
				id: newId,
				input: numpadEditorValue.input,
				type: userSettings.defaultControllerType,
				x:
					(contextMenuState.position.x - rec_konva.left) /
					userSettings.viewportWidthUnit,
				y:
					(contextMenuState.position.y - rec_konva.top) /
					userSettings.viewportHeightUnit,
			}
			canvasDataStore.addNodeData(newNumpadBlockData)
			numpadEditorDialog.close()
		}
		else if(contextMenuState.targetType === 'numpadBlock'){
			const update = {
				input: numpadEditorValue.input,
				type: numpadEditorValue.type
			}
			canvasDataStore.putNodeData(contextMenuState.targetId, update)

			numpadEditorDialog.close()
		}
		
	}
</script>

<div id="konva-container" bind:this={konvaContainer}></div>

<!-- 自定義右鍵選單 -->
{#if contextMenuState.visible}
	<div
		class="context-menu"
		style="left: {contextMenuState.position.x}px; top: {contextMenuState.position.y}px;"
	>
		{#each contextMenuState.options as option}
			<button class="context-menu-item" onclick={() => handleContextMenuOption(option.id)}>
				{option.label}
				<option.icon />
			</button>
		{/each}
	</div>
{/if}

<dialog id="numpad-editor" bind:this={numpadEditorDialog}>
	<div class="dialog-wrapper">
		<numpad-editor
			userSettings={userSettings}
			onedit={(event) => {
				numpadEditorValue = event.detail as{
					input: string,
					type: CONTROLLER_TYPE
				};
			}}
		>
		</numpad-editor>
		<div class="btns">
			<button
				class="btn-create"
				onclick={() => {
					numpadDialogCreateBlock()
				}}
			>
				保存
			</button>
			<button
				onclick={() => {
					numpadEditorDialog.close();
				}}
			>
				關閉
			</button>
		</div>
	</div>
</dialog>

<dialog id="search-character-image" bind:this={imageSearchDialog}>
	{#key [stageData.characterMe, stageData.characterOpponent]}
		<search-character-image
			allCharacters={[stageData.characterMe, stageData.characterOpponent]}
			characterMe={stageData.characterMe}
			characterOpponent={stageData.characterOpponent}
			onselectImage={(event) => {
				// const image = event.detail.image as CharacterMoveImageDto;
				// const rec_konva = konvaContainer.getBoundingClientRect();
				// const new_id = uuidv4();
				// const createImage: CreateCanvasCharacterMoveImageDto = {
				// 	x:
				// 		(contextMenuState.position.x - rec_konva.left) /
				// 		currentUserSettings.viewportWidthUnit,
				// 	y:
				// 		(contextMenuState.position.y - rec_konva.top) /
				// 		currentUserSettings.viewportHeightUnit,
				// 	id: new_id,
				// 	stageId: currentStageDto.id,
				// 	characterMoveImage: image
				// };
				// createNewCharacterMoveImage(createImage);
				imageSearchDialog.close();
			}}
		>
		</search-character-image>
	{/key}
</dialog>

<style>
	#konva-container {
		width: 100vw;
		height: 100vh;
	}
	dialog {
		overflow: visible;
		background-color: oklch(0.25 0.02 264.15);
	}
	.dialog-wrapper {
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		overflow: hidden;
		width: 40vw;
		height: 40vh;
		padding: 1rem;
		numpad-editor {
			width: 100%;
			height: 60%;
			color: white;
		}
		.btns {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: space-evenly;
			z-index: 999;
			button {
				width: 4rem;
				height: 2rem;
			}
		}
	}
	search-character-image {
		display: block;
		width: 50vw;
		height: 80vh;
	}
</style>
