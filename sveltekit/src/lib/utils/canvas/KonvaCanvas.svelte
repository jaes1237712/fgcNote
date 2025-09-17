<script lang="ts">
	import {onMount } from 'svelte';
	import { CanvasDataStore, type CanvasNodeData} from './canvas-data-manager.svelte';
	import { contextMenuState } from './context_menu/canvas-context-menu.svelte';
	import type { CanvasCharacterMoveImageDto, CanvasNumpadBlockDto, CanvasStageDto, CanvasTextDto, CanvasVideoDto, CharacterMoveImageDto } from '$lib/client';
	import { KonvaObjectManager } from './canvas-object-manager';
	import type { UserSettings } from '$lib/userInterface';
	import type { CONTROLLER_TYPE } from './numpad/numpadCompiler';
	import { ToolBarState } from './tool_bar/canvas-tool-bar.svelte';
	import TextToolBar from './tool_bar/TextToolBar.svelte';
	let {stageData, userSettings}: {stageData: CanvasStageDto;userSettings: UserSettings;} = $props();
	let konvaContainer = $state<HTMLDivElement>();
	let numpadEditorDialog = $state<HTMLDialogElement>();
	let numpadEditorValue = $state<{
		input: string,
		type: CONTROLLER_TYPE
	}>();
	let videoFormDialog = $state<HTMLDialogElement>();
	let videoForm = $state<HTMLFormElement>();
	let videoType = $state<string>();
	let videoTitle = $state<string>();
	let videoUrl = $state<string>("https://www.youtube.com/watch?v=nGwZ853dbJk");
	let imageSearchDialog = $state<HTMLDialogElement>();
	let canvasDataStore = $state<CanvasDataStore>()
	let konvaObjectManger = $state<KonvaObjectManager>();
	// let selectedNode = $state<CanvasNodeData>()
	let toolBarState = $state<ToolBarState>()
	let toolBarData = $derived<CanvasNodeData| CanvasStageDto>(toolBarState.targetData);
	onMount( async () => {
		canvasDataStore = new CanvasDataStore()
		toolBarState = new ToolBarState('stage',stageData)
		konvaObjectManger = new KonvaObjectManager(
			konvaContainer,
			stageData,
			userSettings,
			canvasDataStore,
			toolBarState
		)
		canvasDataStore.setKonvaObjectManger(konvaObjectManger)
		await canvasDataStore.SetStageDataAndFetchBackendData(stageData)
		videoForm.addEventListener('submit', function(event) {
			event.preventDefault();
			if(videoType === 'YOUTUBE'){
				const videoId = videoUrl.split('/watch?v=')[1]
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
					fontColor: '#ffffff',
					backgroundColor:'#589bd5',
					x: (contextMenuState.position.x - rec_konva.left) /
					userSettings.viewportWidthUnit,
					y:
					(contextMenuState.position.y - rec_konva.top) /
					userSettings.viewportHeightUnit,
					rotation: 0,
					fontSize:32,
					isBold: false,
					isItalic: false,
					isUnderline: false
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

<div id="konva-container" bind:this={konvaContainer}>

</div>


{#if toolBarState}
	{#if toolBarState.visible}
	<div class="konva-tool-container"
		style="
		position:fixed; left: {toolBarState.position.x}px; top: {toolBarState.position.y}px;
		"
	>
		{#if 'kind' in toolBarState.targetData}
			{#if toolBarState.targetType === 'text' && toolBarState.targetData.kind === 'TEXT' }
				<TextToolBar canvasDataStore={canvasDataStore} InitialTextData={toolBarState.targetData}/>
			{/if}
		{/if}
	</div>
	{/if}
{/if}
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
	<form id="video-form" class="video-form" bind:this={videoForm}>
		<div class="video-form-header">
			<label>
				Video Type
				<select id="video-type-select" name="video-type" required bind:value={videoType}>
					<option value="YOUTUBE">
						YouTube
					</option>
				</select>
			</label>
			<label>
				Your Title
				<input id="video-title-input" name="video-url"  type='text' required bind:value={videoTitle}/>
			</label>
		</div>	
		<div class="video-form-preview">
			<label>
				Video URL
				<input 
				id="video-url-input" name="video-url"  type='url' required bind:value={videoUrl}/>
				<div class="text-dim">
					Format: https://www.youtube.com/watch?v=nGwZ853dbJk
				</div>
			</label>
			
			{#if videoType}
				{#if videoType === 'YOUTUBE' && videoUrl}
					<!-- {#key videoUrl} -->
					<iframe
						src={"https://www.youtube.com/embed/"+videoUrl.split('/watch?v=')[1]}
						title={videoTitle}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
						referrerpolicy="strict-origin-when-cross-origin" 
						allowfullscreen
					>
					</iframe>
					<!-- {/key} -->
				{/if}
			{/if}
		</div>
		<div class="video-form-footer">
			<input type='submit' value="Create"/>
		</div>
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
		background-color: oklch(0.1 0.02 264.15);
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
		height: 50vh;
		width: 50vw;
		color: white;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
	
		.video-form-header{
			font-size: larger;
			height: 10%;
		}
		.video-form-preview{
			height: 80%;
			display: flex;
			flex-direction: column;
			box-sizing: border-box;
			label {
				margin-bottom: 10px; /* 在 URL 输入框下方留白 */
				display: block; /* 确保 label 独占一行 */
			}
			iframe {
				flex-grow: 1; /* 关键：让 iframe 占据所有剩余的垂直空间 */
				/* width: 100%; 让 iframe 填充所有可用的水平空间 */
				border: none; /* 移除 iframe 默认边框 */
				min-height: 0; /* 允许 iframe 在必要时缩小到 0 高度，但 flex-grow 会使其伸展 */
			}
		}
		.video-form-footer{
			display: flex;
			flex-direction: row-reverse;
		}
	}
	.text-dim{
		font-size: small;
		color: gray;
	}

	:global(.tool-bar-hover-text){
		visibility: hidden;
	}
	:global {
		.tool-bar-item{
			position: relative;
			display: inline-block;
		}
		.tool-bar-hover-text{
			position: absolute;
			left: 0;
			top: 2rem;
			visibility: hidden;
			z-index: 999;
		}
		.tool-bar-item:hover .tool-bar-hover-text{
			visibility: visible;
			background-color: white;
		}
	}
</style>
