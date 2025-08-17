<script lang="ts">
	import logo from '$lib/images/common/logo_mark.png';
	import { onMount } from 'svelte';
	import Konva from 'konva';
	import { createCharacterMoveImage, createNumpadBlock } from '$lib/utils/canvas';
	import type { CanvasNumpadBlock, CreateNumpadBlockConfig,
				CanvasCharacterMoveImage} from '$lib/utils/canvas';
	import type {CONTROLLER_TYPE, UserSettings} from '$lib/userInterface'
	import { PUBLIC_NESTJS_URL } from '$env/static/public';
	import { Stage } from 'konva/lib/Stage';
	import { authControllerGoogleLogin, userControllerGetMe, authControllerGoogleLogout } from '$lib/client/sdk.gen';
	import type { PageProps } from './$types';
	import { Plus, ImageIcon } from '@lucide/svelte';
	import type { Layer } from 'konva/lib/Layer';
	import type { CharacterDto, CharacterMoveImageDto, UserDto } from '$lib/client/types.gen';
	import '$lib/css/context_menu.css';
	import '$lib/component/SelectCharacter.svelte';
	import '$lib/component/SearchCharacterImages.svelte';
	import '$lib/component/NumpadEditor.svelte'
	let { data }: PageProps = $props();
	const SCREEN_WIDTH = screen.width;
	const SCREEN_HEIGHT = screen.height;
	const LENGTH_UNIT = SCREEN_WIDTH / 100;
	let stage: Stage;
	let layer: Layer;
	let userSettings = $state<UserSettings>({
			viewportHeightUnit: SCREEN_HEIGHT/100,
			viewportWidthUnit: SCREEN_WIDTH/100,
			lengthUnit: LENGTH_UNIT,
			moveImageHeight:5,
			commandSize:3,
			defaultControllerType:'CLASSIC'
		});
	let numpadEditorValue: {
		input:string,
		type:CONTROLLER_TYPE
	} = $state({
		input:"",
		type:'CLASSIC' //之後從data中拿取
	})
	let canvasNumpadBlocks = $state<CanvasNumpadBlock[]>([]);
	let canvasCharacterMoveImages = $state<CanvasCharacterMoveImage[]>([]);
	$effect(() =>{
		canvasNumpadBlocks.forEach((block) => {
			layer.destroyChildren() //需要優化
			createNumpadBlock({
				canvasNumpadBlock: block,
				userSettings: userSettings
			}, layer)
		})
	})
	$effect(() =>{
		canvasCharacterMoveImages.forEach((image) => {
			layer.destroyChildren() //需要優化
			createCharacterMoveImage({
				canvasImage: image,
				userSettings: userSettings
			}, layer)
		})
	})

	// 用戶狀態管理 - 使用響應式變量
	let currentUser = $state<UserDto>(data?.user);

	// 右鍵選單狀態
	let contextMenuVisible = $state(false);
	let contextMenuPosition = $state({ x: 0, y: 0 });

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
				break
			case 'insert-image':
				imageSearchDialog.showModal()
				break
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

	onMount(() => {
		stage = new Konva.Stage({
			container: 'konva-container',
			width: SCREEN_WIDTH,
			height: SCREEN_HEIGHT
		});

		// 處理右鍵選單
		stage.on('contextmenu', (event) => {
			event.evt.preventDefault(); // 阻止瀏覽器預設右鍵選單
			const mousePos = stage.getPointerPosition();
			if (mousePos && konvaContainer) {
				const rec_konva = konvaContainer.getBoundingClientRect();
				contextMenuPosition = {
					x: mousePos.x + rec_konva.left,
					y: mousePos.y + rec_konva.top
				};
				contextMenuVisible = true;
			}
		});

		// 點擊舞台時隱藏選單
		stage.on('click', () => {
			hideContextMenu();
		});

		layer = new Konva.Layer();
		stage.add(layer);
		// 添加全域點擊事件監聽器
		document.addEventListener('click', handleClickOutside);
		// 清理函數
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

	let characterMe = $state<CharacterDto>(data.allCharacters[0]);
	let characterOpponent = $state<CharacterDto>(data.allCharacters[1]);
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
							authControllerGoogleLogout({
								credentials: 'include'
							})
							currentUser = null
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
			<div class="user-character">
				<select-character
					allCharacters={data.allCharacters}
					defaultCharacter={data.allCharacters[0]}
					onselectCharacter={(event) => {
						characterMe = event.detail.character;
					}}
				>
				</select-character>
				<select-character
					allCharacters={data.allCharacters}
					defaultCharacter={data.allCharacters[1]}
					onselectCharacter={(event) => {
						characterOpponent = event.detail.character;
					}}
				>
				</select-character>
			</div>
			<div></div>
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
				userSettings={userSettings}
				onedit={(event)=>{
					numpadEditorValue = event.detail
					console.log($state.snapshot(numpadEditorValue))
				}}
			>
			</numpad-editor>

			<div class="btns">
				<button onclick={()=>{
					const rec_konva = konvaContainer.getBoundingClientRect();
					canvasNumpadBlocks.push({
						input:numpadEditorValue.input,
						type: numpadEditorValue.type,
						x: (contextMenuPosition.x - rec_konva.left)/(SCREEN_WIDTH/100),
						y: (contextMenuPosition.y - rec_konva.top)/(SCREEN_HEIGHT/100)
					})
					numpadEditorDialog.close();
				}}>
					送出
				</button>
				<button onclick={()=>{
					numpadEditorDialog.close();
				}}>
					關閉
				</button>
			</div>
		</div>
	</dialog>

	<dialog id="search-character-image" bind:this={imageSearchDialog}>
		{#key [characterMe, characterOpponent]}
		<search-character-image 
			allCharacters={data.allCharacters}
			characterMe={characterMe}
			characterOpponent={characterOpponent}
			onselectImage={(event)=>{
				const image = event.detail.image as CharacterMoveImageDto;
				const rec_konva = konvaContainer.getBoundingClientRect();
				canvasCharacterMoveImages.push({
					image: image,
					x: (contextMenuPosition.x - rec_konva.left)/(SCREEN_WIDTH/100),
					y: (contextMenuPosition.y - rec_konva.top)/(SCREEN_HEIGHT/100),
				})
				imageSearchDialog.close()
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
		.header-wrapper{
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
		numpad-editor{
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
	search-character-image{
		display: block;
		width: 50vw;
		height: 80vh;
	}
</style>
