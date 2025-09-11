<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { canvasDataStore } from "./canvas-data-manager.svelte";
	import ImageComponent from "./image/CharacterMoveImageComponent.svelte";
	import NumpadBlockComponent from "./numpad/NumpadBlockComponent.svelte";
	import ArrowComponent from "./arrow/ArrowComponent.svelte";
	import Konva from "konva";
	import { contextMenuState } from "./context_menu/canvas-context-menu.svelte";
	import { featureManager } from "./canvas-feature-manager";
    let konvaContainer = $state<HTMLDivElement>();
	let layer = $state<Konva.Layer>();
    let stage = $state<Konva.Stage>();
    onMount(()=>{
        stage = new Konva.Stage({
            container: konvaContainer,
            id: canvasDataStore.stageData.id,
            width: konvaContainer.clientWidth,
            height: konvaContainer.clientHeight,
        })
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
        stage.add(layer)
        const test_rec = new Konva.Rect({
            x: 20,
            y: 20,
            width: 100,
            height: 50,
            fill: 'green',
            stroke: 'black',
            strokeWidth: 4
        })
        layer.add(test_rec)
    })
</script>

<div id="konva-container" bind:this={konvaContainer}></div>
{#if layer}
    {#each canvasDataStore.nodesDataInDesiredOrder as data}
        {#if data.kind == 'NUMPAD_BLOCK'}
            <NumpadBlockComponent layer={layer} data={data} userSettings={canvasDataStore.userSettings} stage={stage}/>
        {:else if data.kind == 'CHARACTER_MOVE_IMAGE'}
            <ImageComponent layer={layer} data={data} userSettings={canvasDataStore.userSettings} stage={stage}/>
        {:else if data.kind == 'ARROW'}
            <!-- <ArrowComponent layer={layer} data={data}/> -->
        {/if}
    {/each}
{/if}



<style>
    #konva-container{
        width: 100vw;
        height: 100vh;
    }
</style>
