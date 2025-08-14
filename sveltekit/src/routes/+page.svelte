<script lang="ts">
    import logo from '$lib/images/common/logo_mark.png';
    import {Notebook} from '@lucide/svelte';
    import {onMount} from 'svelte';
    import Konva from 'konva'
    import {create_image, LAYOUT_SETTING} from '$lib/utils/canvas'
    import {numpadCompiler} from '$lib/utils/numpadCompiler'
    import { Stage } from 'konva/lib/Stage';
    import {authControllerGoogleLogin, userControllerGetMe} from '$lib/client/sdk.gen'
    import type {PageProps} from './$types';
    import { Plus, Image } from '@lucide/svelte';
	import type { Layer } from 'konva/lib/Layer';
    import { Group } from 'konva/lib/Group';
    import type {CreateImageConfig} from '$lib/utils/canvas'
    import {HandleNumpadEditorDialog} from '$lib/utils/numpadEditorDialog'
    import type {UserSettings} from '$lib/utils/numpadEditorDialog'
    import '$lib/css/context_menu.css'
    import '$lib/component/SelectCharacter.svelte'
    let {data} : PageProps = $props();
    let stage: Stage;
    let layer: Layer;
    let preview_stage: Stage;
    let preview_layer: Layer;
    let preview_group: Group;
    let preview_image_configs: CreateImageConfig[];
    let handleNumpadEditorDialog = $state<HandleNumpadEditorDialog>();
    let userSettings = $state<UserSettings>();
    
    // 用戶狀態管理 - 使用響應式變量
    let currentUser = $state(data.user || null);
    
    // 右鍵選單狀態
    let contextMenuVisible = $state(false);
    let contextMenuPosition = $state({ x: 0, y: 0 });
    
    // 右鍵選單選項
    const contextMenuOptions = [
        { id: 'insert-block', label: '插入區塊', icon: Plus },
        { id: 'insert-image', label: '插入圖片', icon: Image }
    ];
    
    // 處理右鍵選單選項點擊
    function handleContextMenuOption(optionId: string) {
        switch(optionId){
            case "insert-block":
                numpadEditorDialog.showModal();
                if(!preview_stage){
                    const rec_konva_preview = konvaPreview.getBoundingClientRect();
                    preview_stage = new Konva.Stage({
                        container: konvaPreview,
                        width:rec_konva_preview.width,
                        height:rec_konva_preview.height,
                    })
                    preview_layer = new Konva.Layer();
                    preview_stage.add(preview_layer);
                    handleNumpadEditorDialog = new HandleNumpadEditorDialog({
                        previewLayer: preview_layer,
                        previewStage: preview_stage,
                        numpadEditorDialog: numpadEditorDialog,
                        numpadEditorInput: numpadEditorInput,
                        LENGTH_UNIT: LENGTH_UNIT
                    })
                    userSettings = {
                        controllerType: 'CLASSIC',
                        mainStage: stage,
                        mainLayer: layer,
                        mainStageContainer: konvaContainer,
                        contextMenuPosition: contextMenuPosition
                    }
                }
                else{
                    numpadEditorInput.value = "";
                    preview_layer.destroyChildren();
                }
            case "insert-image":
                
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

    const SCREEN_WIDTH = screen.width;
    const SCREEN_HEIGHT = screen.height;
    const LENGTH_UNIT = SCREEN_WIDTH / 100;

    onMount(()=>{
        stage = new Konva.Stage({
            container: 'konva-container',
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT
        })
        
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
        })
        
        // 點擊舞台時隱藏選單
        stage.on('click', () => {
            hideContextMenu();
        });
        
        layer = new Konva.Layer();
        stage.add(layer);
        const group1 = new Konva.Group({
            x:LENGTH_UNIT*10,
            y:LENGTH_UNIT*10,
            draggable: true,
        });
        const input = "5hp+236p+throw";
        const imageConfigArray = numpadCompiler({
            input: input,
            type: 'CLASSIC',
            length_unit: LENGTH_UNIT,
            block_height: LAYOUT_SETTING.block_height
        })
        const block_width = 3*imageConfigArray.length+ LAYOUT_SETTING.horizontal_margin*2;
        const block = new Konva.Rect({
            width: block_width*LENGTH_UNIT,
            height: LAYOUT_SETTING.block_height*LENGTH_UNIT,
            fill: 'oklch(0.45 0.02 264.15)',
            stroke: 'black',
            strokeWidth: 0
        })
        group1.add(block)
        for(let config of imageConfigArray){
            config.x = config.x + LAYOUT_SETTING.horizontal_margin;
            create_image(config,group1)
        }
        const background_height = 24;
        const tag_empty_space = 8;
        const punish_tag = new Konva.Text({
            x: tag_empty_space,
            y: -1*background_height,
            text: "#PUNISH",
            fontSize: 24,
            fill: 'oklch(1 0 0)'
        });
        const punish_background = new Konva.Rect({
            x: 0,
            y: -2*LENGTH_UNIT,
            width: 16*12,
            height: 2*LENGTH_UNIT,
            fillLinearGradientStartPoint: { x: 0, y: -2*LENGTH_UNIT },
            fillLinearGradientEndPoint: { x: 16*12, y: -2*LENGTH_UNIT },
            fillLinearGradientColorStops: [0,'oklch(0.61 0.13 45.88)' , 0.5, 'oklch(0.54 0.13 47.28)', 1, 'oklch(0.5 0.05 41.48/0)'],
        });
        group1.add(punish_background);
        group1.add(punish_tag);
        layer.add(group1);
        
        // 添加全域點擊事件監聽器
        document.addEventListener('click', handleClickOutside);
        // 清理函數
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    })
    let inputEditorDialog = $state<HTMLDialogElement>();
    let numpadEditorDialog = $state<HTMLDialogElement>();
    let numpadEditorInput = $state<HTMLInputElement>();
    let konvaContainer = $state<HTMLDivElement>();
    let konvaPreview = $state<HTMLDivElement>();

    // 登錄狀態
    let currentCredential: any;
    
    async function handleLogIn(){
        try {
            currentCredential = await (navigator as any).credentials.get({
                identity:{
                        context: "signup",
                        providers:[{
                        configURL: 'https://accounts.google.com/gsi/fedcm.json',
                        clientId: '956483892949-sqmhfot3o94ai96snr8i8tc9gl0vs6m0.apps.googleusercontent.com'
                    }]
                }
            })
            
            // 1) call backend to exchange id_token for session cookie
            const loginResponse = await authControllerGoogleLogin({
                body:{
                    id_token: currentCredential.token
                },
                credentials:'include'
            })
            
            if (loginResponse.response) {
                console.log('登錄成功，正在獲取用戶信息...')
                
                // 2) call protected endpoint; cookie will be sent automatically
                const userResponse = await userControllerGetMe({
                    credentials: 'include'
                })
                
                if (userResponse.data) {
                    currentUser = userResponse.data
                    console.log('用戶信息獲取成功:', currentUser)
                } else {
                    console.error('獲取用戶信息失敗:', userResponse)
                }
            } else {
                console.error('登錄失敗:', loginResponse)
            }
        } catch (error) {
            console.error('登錄過程中發生錯誤:', error)
            alert(`登錄失敗: ${error}`)
        }
    }
</script>

<svelte:head>
    <link rel="icon" href="./notebook-pen.svg" />
</svelte:head>

<div id="root">
    <header>
        <img alt="sf6_logo"src={logo}/>
        <Notebook size=40 color="oklch(0.91 0.15 194.77)"/>
        {#if currentUser}
            <span class="user-name">{currentUser.nickname}</span>
        {:else}
        <button class="btn-login" onclick={
            async () => {
                if (!navigator.credentials || !navigator.credentials.get) {
                    alert('錯誤：你的瀏覽器不支援 FedCM API。')
                    return;
                }
                try{
                    handleLogIn()
                }catch(error){
                    alert(`登錄失敗${error}`)
                }
            }
        }>
        Log in
        </button>
        {/if}
    </header>
    
    <main>
        <div class="left-panel">
            <div class="user-character">
                <select-character characters={data.characters} onselectCharacter={(event) =>{
                    console.log(event.detail.name);
                }}>
                    
                </select-character>
            </div>
            <div>

            </div>
        </div>
        <div id="konva-container" bind:this={konvaContainer}>

        </div>
    </main>

    <!-- 自定義右鍵選單 -->
    {#if contextMenuVisible}
        <div 
            class="context-menu"
            style="left: {contextMenuPosition.x}px; top: {contextMenuPosition.y}px;"
        >
            {#each contextMenuOptions as option}
                <button 
                    class="context-menu-item"
                    onclick={() => handleContextMenuOption(option.id)}
                >
                    {option.label}
                    <option.icon/>
                </button>
            {/each}
        </div>
    {/if}

    <dialog id="numpad-editor" bind:this={numpadEditorDialog}>
        <div class="dialog-wrapper">
            <label>
                <p>NUMPAD 指令</p>
                <input 
                    type="text" bind:this={numpadEditorInput} 
                    oninput={() => handleNumpadEditorDialog.handleInputOninput(userSettings)}
                />
            </label>
            <div class="preview-block">
                <p>預覽</p>
                <div class="konva-preview" bind:this={konvaPreview}>
                </div>
            </div>
            
            <div class="btns">
                <button onclick={() => handleNumpadEditorDialog.handleNumpadDialogPostButton(userSettings)}>
                    送出
                </button>
                <button onclick={() => handleNumpadEditorDialog.handleNumpadDialogCloseButton()}>
                    關閉
                </button>
            </div>
        </div>
        
    </dialog>
</div>


<style>
    #root{
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 15% 1fr;
    }
    header{
        display: flex;
        justify-content: flex-start;
        align-items: center;
        background-color: oklch(0.27 0.02 264.26);
        img{
            height: 100%;
        }
    }  
    main{
        background-color: oklch(0.23 0.01 264.4);
        display:grid;
        grid-template-columns: 20% 1fr;
        grid-template-rows: 1fr;
        .left-panel{
            background-color: oklch(0.21 0.01 258.37);
            padding: 1rem;
        }
    }
    dialog{
        background-color: oklch(0.25 0.02 264.15);
    }
    .dialog-wrapper{
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        width: 40rem;
        height: 20rem;
        padding: 1rem;
        label {
            height: 6rem;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            p{
                font-size: large;
                margin: 0;
            }
            input{
                font-size: x-large;
                height: 3rem;
                background-color: oklch(0.9 0.02 264.15);
                width: 100%;
            }
        }
        .preview-block{
            height: 6rem;
            color:white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            p{
                font-size: large;
                margin: 0;
            }
            .konva-preview{
                height: 3rem;
                background-color: oklch(0.45 0.02 267.56);
            }
        }
        
        .btns{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-evenly;
            button{
                width: 4rem;
                height: 2rem;
            }
        }
    }

</style>