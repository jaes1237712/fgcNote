<script lang="ts">
	import type { CanvasTextDto } from "$lib/client";
	import type { CanvasDataStore } from "$lib/utils/canvas/canvas-data-manager.svelte";
	import { AArrowDown, AArrowUp, Baseline, Bold, FoldHorizontal, FoldVertical, Italic, PaintBucket, Underline } from "@lucide/svelte";
	import { featureManager } from "../canvas-feature-manager";
    let{
        InitialTextData,
        canvasDataStore
    }:{
        InitialTextData: CanvasTextDto,
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
        textData = canvasDataStore.updateNodeData(textData.id, textData) as CanvasTextDto
        featureManager.deactivate('text-transformer')
    }}>
        <AArrowUp/>
    </button>
    <select id="tool-fontNumber" bind:value={fontSize} onchange={()=>{
        textData.fontSize = fontSize
        textData = canvasDataStore.updateNodeData(textData.id, textData) as CanvasTextDto
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
        textData = canvasDataStore.updateNodeData(textData.id, textData) as CanvasTextDto
        featureManager.deactivate('text-transformer')
    }}>
        <AArrowDown/>
    </button>
    <div class="font-color-picker-container">
        <label>
            <Baseline id="font-color-icon"/>
            <input id="font-color-picker" type="color" bind:value={fontColor} oninput={()=>{
                textData.fontColor = fontColor
                textData = canvasDataStore.updateNodeData(textData.id, textData) as CanvasTextDto
            }}/>
        </label>
    </div>
    <div class="background-color-picker-container">
        <label>
            <PaintBucket/>
            <input id="background-color-picker" type="color"bind:value={backgroundColor} oninput={()=>{
                textData.backgroundColor = backgroundColor
                textData = canvasDataStore.updateNodeData(textData.id, textData) as CanvasTextDto
            }}/>
        </label>
    </div>
    <button onclick={()=>{
        textData.isBold = !(textData.isBold)
        textData = canvasDataStore.updateNodeData(textData.id, textData) as CanvasTextDto        
    }}>
        <Bold />
    </button>
    <button onclick={()=>{
        textData.isItalic = !(textData.isItalic)
        textData = canvasDataStore.updateNodeData(textData.id, textData) as CanvasTextDto        
    }}>
        <Italic />
    </button>
    <button onclick={()=>{
        textData.isUnderline = !(textData.isUnderline)
        textData = canvasDataStore.updateNodeData(textData.id, textData) as CanvasTextDto        
    }}>
        <Underline />
    </button>
    <button onclick={()=>{
        textData.rotation = 0
        canvasDataStore.updateNodeData(textData.id, textData)
    }}>
        <FoldVertical />
    </button>
    <button onclick={()=>{
        textData.rotation = 90
        canvasDataStore.updateNodeData(textData.id, textData)
    }}>
        <FoldHorizontal />
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
</style>