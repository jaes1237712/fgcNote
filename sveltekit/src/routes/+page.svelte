<script lang="ts">
	import logo from '$lib/images/common/logo_mark.png';
	import { onMount } from 'svelte';
	import Konva from 'konva';
	import {createNumpadBlock} from '$lib/utils/canvas';
	import type {
		CanvasCharacterMoveImage
	} from '$lib/utils/canvas-old';
	import type { CONTROLLER_TYPE, UserSettings } from '$lib/userInterface';
	import { v4 as uuidv4 } from 'uuid';
	import {
		authControllerGoogleLogin,
		userControllerGetMe,
		authControllerLogout,
		canvasControllerCreateStage,
		canvasControllerUpdateStage,
		canvasControllerDeleteStage,
		canvasControllerFindAllBlocks,

		canvasControllerCreateNumpadBlock

	} from '$lib/client';
	import type { PageProps } from './$types';
	import { Plus, ImageIcon } from '@lucide/svelte';
	import type {
		CanvasNumpadBlockDto,
		CanvasStageDto,
		CharacterDto,
		CharacterMoveImageDto,
		UserDto
	} from '$lib/client';
	import '$lib/css/context_menu.css';
	import '$lib/component/SelectCharacter.svelte';
	import '$lib/component/SearchCharacterImages.svelte';
	import '$lib/component/NumpadEditor.svelte';
	import { createStage} from '$lib/utils/canvas/index';
	let { data }: PageProps = $props();
	const SCREEN_WIDTH = screen.width;
	const SCREEN_HEIGHT = screen.height;
	const LENGTH_UNIT = SCREEN_WIDTH / 100;
	let allStageDtos = $state<CanvasStageDto[]>(data.allStageDtos);
	let userSettings = $state<UserSettings>({
		viewportHeightUnit: SCREEN_HEIGHT / 100,
		viewportWidthUnit: SCREEN_WIDTH / 100,
		lengthUnit: LENGTH_UNIT,
		moveImageHeight: 5,
		commandSize: 3,
		defaultControllerType: 'CLASSIC'
	});
	let numpadEditorValue: {
		input: string;
		type: CONTROLLER_TYPE;
	} = $state({
		input: '',
		type: 'CLASSIC' //之後從data中拿取
	});
	let currentStage = $state<Konva.Stage>();
	let currentLayer = $state<Konva.Layer>();
	let currentStageDto = $state<CanvasStageDto>();
	let characterMe = $state<CharacterDto>(data.allCharacters[0]);
	let characterOpponent = $state<CharacterDto>(data.allCharacters[1]);
	let numpadBlocksDtos = $state<Map<string, CanvasNumpadBlockDto>>(new Map());
	let characterMoveImages = $state<CanvasCharacterMoveImage[]>([]);
	let currentStageDtos = $derived.by<CanvasStageDto[]>(()=>{
		if(characterMe.id && characterOpponent.id){
			return allStageDtos.filter((stageDto)=>
						stageDto.characterMe.id === characterMe.id &&
						stageDto.characterOpponent.id === characterOpponent.id
					);
		}
		return [];
	});
	// 用戶狀態管理 - 使用響應式變量
	let currentUser = $state<UserDto>(data?.user);

	// 右鍵選單狀態
	let contextMenuVisible = $state(false);
	let contextMenuPosition = $state({ x: 0, y: 0 });

	function onContextMenu(position: { x: number; y: number }) {
		contextMenuPosition = position;
		contextMenuVisible = true;
	}
	// 右鍵選單選項
	const contextMenuOptions = [
		{ id: 'insert-block', label: '插入區塊', icon: Plus },
		{ id: 'insert-image', label: '插入圖片', icon: ImageIcon }
	];

	// 處理右鍵選單選項點擊
	function handleContextMenuOption(optionId: string) {
		switch (optionId) {
			case 'insert-block':
				numpadEditorDialog.showModal();
				break;
			case 'insert-image':
				imageSearchDialog.showModal();
				break;
		}
		hideContextMenu();
	}

	// 隱藏右鍵選單
	function hideContextMenu() {
		contextMenuVisible = false;
	}

	// 處理點擊外部關閉選單
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.context-menu')) {
			hideContextMenu();
		}
	}

	async function createNewStage() {
		const userInput = prompt('輸入canvas的名稱', 'temporary');
		if (userInput !== null && userInput.trim() !== '') {
			const stageId = uuidv4();
			const canvasStage = await canvasControllerCreateStage({
				body: {
					id: stageId,
					characterMe: characterMe,
					characterOpponent: characterOpponent,
					name: userInput
				},
				credentials: 'include'
			});
			if (canvasStage.data) {
				allStageDtos.push(canvasStage.data);
				const { stage, layer } = createStage({
					stageDto: canvasStage.data,
					container: konvaContainer,
					onContextMenu: onContextMenu,
					onClick: hideContextMenu
				});
				currentStage = stage;
				currentLayer = layer;
				currentStageDto = canvasStage.data;
				console.log("stageDto",currentStageDtos)
			} else {
				alert('something in server side create stage went wrong');
			}
		} else if (userInput === null) {
			alert('null');
		}
	}

	async function createExistedStage(stageDto: CanvasStageDto) {
		const { stage, layer } = createStage({
			stageDto: stageDto,
			container: konvaContainer,
			onContextMenu: onContextMenu,
			onClick: hideContextMenu
		});
		currentStage = stage;
		currentLayer = layer;
		currentStageDto = stageDto
		const simpleText = new Konva.Text({
			x: 0,
			y: 0,
			text: `Stage:${stageDto.name}`,
			fontSize: 48,
			fill: 'white'
		});
		currentLayer.add(simpleText);
		const resp = await canvasControllerFindAllBlocks({
			path:{
				stageId: stageDto.id
			}
		})
		if(resp.data){
			resp.data.forEach((block)=>{
				createNumpadBlock({
					canvasNumpadBlock:{
						id:block.id,
						input:block.input,
						type:block.type,
						x:block.x,
						y:block.y
					},
					userSettings:userSettings
				}, currentLayer)
			})
		}
	}

	async function renameExistedStage(stageDto: CanvasStageDto) {
		const userInput = prompt('Enter new name of stage');
		canvasControllerUpdateStage({
			body: {
				id: stageDto.id,
				name: userInput
			},
			credentials: 'include'
		}).then((resp) => {
			if (resp.data) {
				const newStages = allStageDtos.map((iterStage) => {
					if (iterStage.id === stageDto.id) {
						return resp.data;
					}
					return iterStage;
				});
				allStageDtos = newStages;
			} else {
				alert('something went wrong');
			}
		});
	}

	async function deleteExistedStage(stageDto: CanvasStageDto) {
		await canvasControllerDeleteStage({
			path: { stageId: stageDto.id },
			credentials: 'include'
		}).then((resp) => {
			if (!resp.data) {
				alert('Something went wrong');
			} else {
				const newStages = allStageDtos.filter((stage) => stage.id !== stageDto.id);
				allStageDtos = newStages;
			}
		});
	}

	async function createNewNumpadBlock(numpadBlockDto:CanvasNumpadBlockDto) {
		const createResp = await canvasControllerCreateNumpadBlock({
			body: {
				...numpadBlockDto,
				stageId:currentStageDto.id
			},
			credentials:'include'
		})
		if(createResp.data){
			createNumpadBlock({
				canvasNumpadBlock: numpadBlockDto,
				userSettings: userSettings
			}, currentLayer)
			numpadBlocksDtos.set(numpadBlockDto.id, numpadBlockDto);
			numpadBlocksDtos = new Map(numpadBlocksDtos);
		}
		else{
			alert("Server side: Something went wrong at create numpad block")
		}
	}
	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
	let numpadEditorDialog = $state<HTMLDialogElement>();
	let imageSearchDialog = $state<HTMLDialogElement>();
	let konvaContainer = $state<HTMLDivElement>();

	// 登錄狀態
	let currentCredential: any;

	async function handleLogIn() {
		try {
			currentCredential = await (navigator as any).credentials.get({
				identity: {
					context: 'signup',
					providers: [
						{
							configURL: 'https://accounts.google.com/gsi/fedcm.json',
							clientId: '956483892949-sqmhfot3o94ai96snr8i8tc9gl0vs6m0.apps.googleusercontent.com'
						}
					]
				}
			});

			// 1) call backend to exchange id_token for session cookie
			const loginResponse = await authControllerGoogleLogin({
				body: {
					id_token: currentCredential.token
				},
				credentials: 'include'
			});

			if (loginResponse.response) {
				console.log('登錄成功，正在獲取用戶信息...');

				// 2) call protected endpoint; cookie will be sent automatically
				const userResponse = await userControllerGetMe({
					credentials: 'include'
				});

				if (userResponse.data) {
					currentUser = userResponse.data;
					console.log('用戶信息獲取成功:', currentUser);
				} else {
					console.error('獲取用戶信息失敗:', userResponse);
				}
			} else {
				console.error('登錄失敗:', loginResponse);
			}
		} catch (error) {
			console.error('登錄過程中發生錯誤:', error);
			alert(`登錄失敗: ${error}`);
		}
	}
</script>

<svelte:head>
	<link rel="icon" href="./notebook-pen.svg" />
</svelte:head>

<div id="root">
	<header>
		<div class="header-wrapper">
			<img alt="sf6_logo" src={logo} />
			<div>
				{#if currentUser}
					<p class="user-name">{currentUser.nickname}</p>
					<button
						class="btn-logout"
						onclick={async () => {
							authControllerLogout({
								credentials: 'include'
							});
							currentUser = null;
						}}
					>
						Log out
					</button>
				{:else}
					<button
						class="btn-login"
						onclick={async () => {
							if (!navigator.credentials || !navigator.credentials.get) {
								alert('錯誤：你的瀏覽器不支援 FedCM API。');
								return;
							}
							try {
								handleLogIn();
							} catch (error) {
								alert(`登錄失敗${error}`);
							}
						}}
					>
						Log in
					</button>
				{/if}
			</div>
		</div>
	</header>

	<main>
		<div class="left-panel">
			<div class="canvas-character">
				<select-character
					allCharacters={data.allCharacters}
					defaultCharacter={data.allCharacters[0]}
					onselectCharacter={(event) => {
						characterMe = event.detail.character;
					}}
					size="6vw"
				>
				</select-character>
				<span>vs.</span>
				<select-character
					allCharacters={data.allCharacters}
					defaultCharacter={data.allCharacters[1]}
					onselectCharacter={(event) => {
						characterOpponent = event.detail.character;
					}}
					size="6vw"
				>
				</select-character>
			</div>
			<hr class="primary-hr" />
			<div class="canvas-panel">
				<div class="canvas-panel-header">
					<span>Canvas</span>
					<button onclick={createNewStage}>create</button>
				</div>
			</div>
			<hr class="second-hr" />
			<div class="canvas-stages">
				{#key currentStageDtos}
					{#each currentStageDtos as stageDto}
						<div class="stage-item">
							<button onclick={() => createExistedStage(stageDto)} class="btn-stage">
								{stageDto.name}
							</button>
							<button onclick={() => renameExistedStage(stageDto)} class="btn-rename">
								修改
							</button>
							<button onclick={() => deleteExistedStage(stageDto)} class="btn-delete">
								刪除
							</button>
						</div>
					{/each}
				{/key}
			</div>
		</div>
		<div id="konva-container" bind:this={konvaContainer}></div>
	</main>

	<!-- 自定義右鍵選單 -->
	{#if contextMenuVisible}
		<div
			class="context-menu"
			style="left: {contextMenuPosition.x}px; top: {contextMenuPosition.y}px;"
		>
			{#each contextMenuOptions as option}
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
				{userSettings}
				onedit={(event) => {
					numpadEditorValue = event.detail;
					console.log($state.snapshot(numpadEditorValue));
				}}
			>
			</numpad-editor>

			<div class="btns">
				<button
					onclick={() => {
						const rec_konva = konvaContainer.getBoundingClientRect();
						const new_id = uuidv4();
						const newNumpadBlockDto = {
							input: numpadEditorValue.input,
							type: numpadEditorValue.type,
							x: (contextMenuPosition.x - rec_konva.left) / (SCREEN_WIDTH / 100),
							y: (contextMenuPosition.y - rec_konva.top) / (SCREEN_HEIGHT / 100),
							id: new_id
						}
						createNewNumpadBlock(newNumpadBlockDto)
						numpadEditorDialog.close();
					}}
				>
					送出
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
		{#key [characterMe, characterOpponent]}
			<search-character-image
				allCharacters={data.allCharacters}
				{characterMe}
				{characterOpponent}
				onselectImage={(event) => {
					const image = event.detail.image as CharacterMoveImageDto;
					const rec_konva = konvaContainer.getBoundingClientRect();
					characterMoveImages.push({
						image: image,
						x: (contextMenuPosition.x - rec_konva.left) / (SCREEN_WIDTH / 100),
						y: (contextMenuPosition.y - rec_konva.top) / (SCREEN_HEIGHT / 100)
					});
					imageSearchDialog.close();
				}}
			>
			</search-character-image>
		{/key}
	</dialog>
</div>

<style>
	#root {
		width: 100vw;
		height: 100vh;
		padding: 0;
		margin: 0;
		overflow: hidden;
	}
	header {
		height: 15%;
		width: 100%;
		background-color: oklch(0.27 0.02 264.26);
		display: flex;
		justify-content: center;
		.header-wrapper {
			width: 70%;
			height: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;
			img {
				height: 100%;
			}
		}
	}
	main {
		background-color: oklch(0.23 0.01 264.4);
		height: 85%;
		width: 100%;
		display: grid;
		grid-template-columns: 20% 1fr;
		grid-template-rows: 1fr;
		.left-panel {
			background-color: oklch(0.21 0.01 258.37);
			padding: 1rem;
			hr.primary-hr {
				border: none;
				height: 0.25vh;
				background-color: oklch(0.8 0.02 262.99);
			}
			.canvas-character {
				display: flex;
				flex-direction: row;
				justify-content: space-evenly;
				align-items: end;
				span {
					font-size: x-large;
				}
			}
			.canvas-panel {
				.canvas-panel-header {
					display: flex;
					flex-direction: row;
					justify-content: space-between;
					font-size: x-large;
				}
			}
			hr.second-hr {
				border: none;
				height: 0.25vh;
				background-color: oklch(0.4 0.02 262.99);
			}
			.canvas-stages {
				display: flex;
				flex-direction: column;
				gap: 0.5rem;
				.stage-item {
					display: flex;
					flex-direction: row;
					.btn-stage {
						width: 70%;
					}
					.btn-rename {
						width: 15%;
					}
					.btn-delete {
						width: 15%;
					}
				}
			}
		}
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
