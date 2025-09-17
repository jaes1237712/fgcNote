<!-- <script lang="ts">
	import type { CanvasCharacterMoveImageDto, CanvasTextDto } from "$lib/client";
	import type { CanvasDataStore } from "$lib/utils/canvas/canvas-data-manager.svelte";
	import { AArrowDown, AArrowUp, Baseline, FoldHorizontal, FoldVertical, PaintBucket } from "@lucide/svelte";
	import { featureManager } from "../canvas-feature-manager";
    let{
        InitialImageData,
        canvasDataStore
    }:{
        InitialTextData: CanvasCharacterMoveImageDto,
        canvasDataStore: CanvasDataStore
    } = $props()
    const minFontSize = 4
    const maxFontSize = 128
    const fontSizeStep = 4
    const fontSizeArray:number[] = []
    for(let i = minFontSize; i<= maxFontSize; i+=fontSizeStep){
        fontSizeArray.push(i)
    }
    let fontSize = $state<number>(InitialTextData.fontSize)
    
    let textData = $state<CanvasTextDto>(InitialTextData)
    let fontColor = $state<string>(InitialTextData.fontColor)
    let backgroundColor = $state<string>(InitialTextData.backgroundColor)
    
</script>

<div class="tool-text">
    <button id="tool-fontSize-increase" onclick={()=>{
        fontSize += fontSizeStep
        if(fontSize>maxFontSize){
            fontSize=maxFontSize
        }
        textData.fontSize = fontSize
        canvasDataStore.updateNodeData(textData.id, textData)
        featureManager.deactivate('text-transformer')
    }}>
        <AArrowUp/>
    </button>
    <select id="tool-fontNumber" bind:value={fontSize} onchange={()=>{
        textData.fontSize = fontSize
        canvasDataStore.updateNodeData(textData.id, textData)
        featureManager.deactivate('text-transformer')
    }}>
        {#each fontSizeArray as size}
            <option value={size}>{size}</option>
        {/each}
    </select>
    <button id="tool-fontSize-decrease" onclick={()=>{
        fontSize -= fontSizeStep
        if(fontSize< minFontSize){
            fontSize = minFontSize
        }
        textData.fontSize = fontSize
        canvasDataStore.updateNodeData(textData.id, textData)
        featureManager.deactivate('text-transformer')
    }}>
        <AArrowDown/>
    </button>
    <div class="font-color-picker-container">
        <label>
            <Baseline id="font-color-icon"/>
            <input id="font-color-picker" type="color" bind:value={fontColor} oninput={()=>{
                textData.fontColor = fontColor
                canvasDataStore.updateNodeData(textData.id, textData)
            }}/>
        </label>
    </div>
    <div class="background-color-picker-container">
        <label>
            <PaintBucket/>
            <input id="background-color-picker" type="color"bind:value={backgroundColor} oninput={()=>{
                textData.backgroundColor = backgroundColor
                canvasDataStore.updateNodeData(textData.id, textData)
            }}/>
        </label>
    </div>
    <button>
        <FoldVertical onclick={()=>{
            textData.rotation = 0
            canvasDataStore.updateNodeData(textData.id, textData)
        }}/>
    </button>
    <button>
        <FoldHorizontal onclick={()=>{
            textData.rotation = 90
            canvasDataStore.updateNodeData(textData.id, textData)
        }}/>
    </button>
</div>




<style>
    .tool-text{
        display: flex;
        flex-direction: row;
        gap: 4px;
        align-items: center;
        padding: 4px;
        /* background-color: oklch(0.48 0.03 266.65); */
    }
    button{
        padding: 0;
        width: 3vw;
        height: 2vw;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    label{
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 4px;
    }
</style> -->