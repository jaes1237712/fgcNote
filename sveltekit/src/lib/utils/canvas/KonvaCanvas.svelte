<script lang="ts">
	import {onMount } from 'svelte';
	import { CanvasDataStore} from './canvas-data-manager.svelte';
	import { contextMenuState } from './context_menu/canvas-context-menu.svelte';
	import type { CanvasCharacterMoveImageDto, CanvasNumpadBlockDto, CanvasStageDto, CanvasTextDto, CanvasVideoDto, CharacterMoveImageDto } from '$lib/client';
	import { KonvaObjectManager } from './canvas-object-manager';
	import type { UserSettings } from '$lib/userInterface';
	import type { CONTROLLER_TYPE } from './numpad/numpadCompiler';
	let {stageData, userSettings}: {stageData: CanvasStageDto;userSettings: UserSettings;} = $props();
	let konvaContainer = $state<HTMLDivElement>();
	let numpadEditorDialog = $state<HTMLDialogElement>();
	let numpadEditorValue = $state<{
		input: string,
		type: CONTROLLER_TYPE
	}>();
	let videoFormDialog = $state<HTMLDialogElement>();
	let imageSearchDialog = $state<HTMLDialogElement>();
	let canvasDataStore = $state<CanvasDataStore>()
	let konvaObjectManger = $state<KonvaObjectManager>();
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
		const videoForm = document.getElementById("video-form") 
		const videoTypeSelect = document.getElementById('video-type-select') as HTMLSelectElement; // 獲取下拉選單
		const videoUrlInput = document.getElementById('video-url-input') as HTMLInputElement; // 獲取 URL 輸入框
		const videoTitleInput = document.getElementById('video-title-input') as HTMLInputElement; // 獲取 URL 輸入框

		videoForm.addEventListener('submit', function(event) {
			event.preventDefault();
			if(videoTypeSelect.value === 'YOUTUBE'){
				const enteredVideoUrl = videoUrlInput.value;   // 獲取輸入的影片 URL
				const videoTitle = videoTitleInput.value;
				const videoId = enteredVideoUrl.split('/watch?v=')[1]
				const newId = crypto.randomUUID()
				const videoData: CanvasVideoDto = {
					kind: 'VIDEO',
					id: newId,
					type: 'YOUTUBE',
					src: `https://www.youtube.com/embed/${videoId}`, //https://www.youtube.com/embed/l-d26xbK1T0
					title: videoTitle,
					x: contextMenuState.position.x/(userSettings.viewportWidthUnit),
					y: contextMenuState.position.y/(userSettings.viewportHeightUnit),
					rotation:0,
					scaleX:0.5,
					scaleY:0.5
				}
				canvasDataStore.addNodeData(videoData);
				videoFormDialog.close();
			}
			
		})
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
			case 'insert-text':
				const new_id = crypto.randomUUID()
				const rec_konva = konvaContainer.getBoundingClientRect();
				const new_text: CanvasTextDto = {
					kind: 'TEXT',
					id: new_id,
					text: 'EDIT ME',
					fontColor: 'white',
					backgroundColor:'oklch(0.67 0.11 247.16)',
					x: (contextMenuState.position.x - rec_konva.left) /
					userSettings.viewportWidthUnit,
					y:
					(contextMenuState.position.y - rec_konva.top) /
					userSettings.viewportHeightUnit,
					rotation: 0,
					scaleX: 1,
					scaleY: 1
				}
				canvasDataStore.addNodeData(new_text)
				break
			case 'insert-video':
				videoFormDialog.showModal()
				break
			case 'delete-block':
				canvasDataStore.deleteNodeData(contextMenuState.targetId);
				break;
			case 'delete-image':
				canvasDataStore.deleteNodeData(contextMenuState.targetId);
				break;
			case 'delete-text':
				canvasDataStore.deleteNodeData(contextMenuState.targetId);
				break
			case 'delete-video':
				console.log(contextMenuState.targetId)
				canvasDataStore.deleteNodeData(contextMenuState.targetId);
				break
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
				type: numpadEditorValue.type,
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
				<option.icon />
				{option.label}
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
				const image = event.detail.image as CharacterMoveImageDto;
				const rec_konva = konvaContainer.getBoundingClientRect();
				const new_id = crypto.randomUUID();
				const scale = (userSettings.viewportHeightUnit * userSettings.moveImageHeight)/image.height;
				const createImage: CanvasCharacterMoveImageDto = {
					kind:'CHARACTER_MOVE_IMAGE',
					x:
						(contextMenuState.position.x - rec_konva.left) /
						userSettings.viewportWidthUnit,
					y:
						(contextMenuState.position.y - rec_konva.top) /
						userSettings.viewportHeightUnit,
					id: new_id,
					characterMoveImage: image,
					scaleX: scale,
					scaleY: scale,
					rotation: 0
				};
				canvasDataStore.addNodeData(createImage)
				imageSearchDialog.close();
			}}
		>
		</search-character-image>
	{/key}
</dialog>

<dialog id="video-dialog" bind:this={videoFormDialog}>
	<form id="video-form" class="video-form">
		<label>
			Video Type
			<select id="video-type-select" name="video-type"required>
				<option value="YOUTUBE">
					YouTube
				</option>
			</select>
		</label>
		<label>
			Video URL
			<input id="video-url-input" name="video-url"  type='url' required/>
		</label>
		<label>
			Your Title
			<input id="video-title-input" name="video-url"  type='text' required/>
		</label>
		<input type='submit' value="Create"/>
	</form>
</dialog>

<style>
	#konva-container {
		width: 100vw;
		height: 100vh;
		position: relative;
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
	:global(textarea){
		field-sizing: content;
	}
	.video-form{
		color: white;
	}
</style>
