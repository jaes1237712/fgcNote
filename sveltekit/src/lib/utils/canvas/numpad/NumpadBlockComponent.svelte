<script lang="ts">
	import type { CanvasNumpadBlockDto } from "$lib/client";
	import { LAYOUT_SETTING, type UserSettings } from "$lib/userInterface";
    import Konva from 'konva';
	import { onDestroy, onMount } from "svelte";
	import { numpadInputToCommandImages } from "./numpadCompiler";
	import { canvasDataStore } from '$lib/utils/canvas/canvas-data-manager.svelte';
	import { featureManager, type IFeature } from "../canvas-feature-manager";
	import { drawInvisibleAnchorPoint, removeAnchorPoint, showSpecificAnchorPoint } from "../arrow/canvas-arrow";
    let { layer, data, userSettings, stage }: {
        layer: Konva.Layer, 
        data: CanvasNumpadBlockDto, 
        userSettings: UserSettings, 
        stage: Konva.Stage 
    } = $props();
    const commandImagesSrc = numpadInputToCommandImages({
        input: data.input,
        type: data.type,
        userSettings: userSettings
    });
    const LENGTH_UNIT = userSettings.lengthUnit;
    const commandLength = commandImagesSrc.length;
    const blockWidth =
        (commandLength + LAYOUT_SETTING.horizontalMarginScale * 2) * userSettings.commandSize;
    const blockHeight = userSettings.commandSize * LAYOUT_SETTING.blockHeightScale;
    let block = $state<Konva.Group>()
    let blockBackground = $state<Konva.Rect>()
    onMount(()=>{
        block = new Konva.Group({ 
            x: data.x * userSettings.viewportWidthUnit,
            y: data.y * userSettings.viewportHeightUnit,
            draggable: true,
            width: blockWidth * LENGTH_UNIT,
            height: blockHeight * LENGTH_UNIT,
            id: data.id,
            name: 'numpad-block'
        });
        commandImagesSrc.forEach((imageSrc, index) => {
            const imageObj = new Image();
            imageObj.onload = function () {
                const konvaCommandImage = new Konva.Image({
                    x: (index + LAYOUT_SETTING.horizontalMarginScale) * userSettings.commandSize * LENGTH_UNIT,
                    y: (blockHeight - userSettings.commandSize) * (LENGTH_UNIT / 2),
                    image: imageObj,
                    width: userSettings.commandSize * LENGTH_UNIT,
                    height: userSettings.commandSize * LENGTH_UNIT
                });
                block.add(konvaCommandImage);
            };
            imageObj.src = imageSrc;
	    });
        blockBackground = new Konva.Rect({
            width: blockWidth * LENGTH_UNIT,
            height: blockHeight * LENGTH_UNIT,
            fill: 'oklch(0.45 0.02 264.15)',
            id: `${data.id}-block-background`
	    });
        block.on('dragend', () =>{
            canvasDataStore.updateNodeData(block.id(),{
                x: block.x() /userSettings.viewportWidthUnit,
                y: block.y() /userSettings.viewportHeightUnit,
            })
        })
        block.on('dragstart', (event) => {
            featureManager.deactivate()
        })
        block.add(blockBackground);
        drawInvisibleAnchorPoint(blockBackground.id(), block, stage)
        layer.add(block);
        block.on('click tap', function(e){
            e.cancelBubble = true;
            const context: NumpadSelectContext = {
                numpadNode: block,
                layer: layer,
                stage: stage
            }
            const feature = new NumpadSelectFeature()
            featureManager.activate<NumpadSelectContext>(
                    'anchor-points',
                    block.id(),
                    feature,
                    context
                )
        })
    })

    interface NumpadSelectContext{
        numpadNode: Konva.Group
        layer: Konva.Layer
        stage: Konva.Stage
    }
    class NumpadSelectFeature implements IFeature<NumpadSelectContext> {
        onActivated(context: NumpadSelectContext): () => void {
            showSpecificAnchorPoint(context.numpadNode.id(), context.layer, context.stage)
            const cleanup = () => {
                removeAnchorPoint(context.layer)
            }
            return cleanup
        }
    }
    onDestroy(()=>{
        block.destroy();
    })
</script>