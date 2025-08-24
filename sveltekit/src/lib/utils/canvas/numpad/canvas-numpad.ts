import type {CanvasNumpadBlockDto} from '$lib/client';
import { type UserSettings, LAYOUT_SETTING } from '$lib/userInterface';
import { numpadInputToCommandImages } from '$lib/utils/canvas/numpad/numpadCompiler';
import Konva from 'konva';
import {contextMenuState} from '$lib/utils/canvas/context_menu/canvas-context-menu.svelte'
export type OnBlockDragEndCallback = (blockId: string, x: number, y: number) => void;


export interface CreateNumpadBlockConfig {
	canvasNumpadBlock: CanvasNumpadBlockDto;
	userSettings: UserSettings;
	dragEndHandler: OnBlockDragEndCallback;
}

export function createNumpadBlock(config: CreateNumpadBlockConfig, layer: Konva.Layer | Konva.Group) {
	const {canvasNumpadBlock, userSettings, dragEndHandler} = config
	const commandImagesSrc = numpadInputToCommandImages({
		input: canvasNumpadBlock.input,
		type: canvasNumpadBlock.type,
		userSettings: userSettings
	});
	const LENGTH_UNIT = userSettings.lengthUnit;
	const commandLength = commandImagesSrc.length;
	const blockWidth =
		(commandLength + LAYOUT_SETTING.horizontalMarginScale * 2) * userSettings.commandSize;
	const blockHeight = userSettings.commandSize * LAYOUT_SETTING.blockHeightScale;
	const block = new Konva.Group({
		x: canvasNumpadBlock.x * userSettings.viewportWidthUnit,
		y: canvasNumpadBlock.y * userSettings.viewportHeightUnit,
		draggable: true,
		width: blockWidth * LENGTH_UNIT,
		height: blockHeight * LENGTH_UNIT,
		id: canvasNumpadBlock.id
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
	const blockBackground = new Konva.Rect({
		width: blockWidth * LENGTH_UNIT,
		height: blockHeight * LENGTH_UNIT,
		fill: 'oklch(0.45 0.02 264.15)'
	});
	block.on('contextmenu', (event) => {
		event.evt.preventDefault();
		event.cancelBubble = true; // 阻止事件向上冒泡到 Stage
		contextMenuState.show(
			event.evt.clientX,
			event.evt.clientY,
			'block',
			block.id()
		)
		console.log(canvasNumpadBlock.x, block.x()/userSettings.viewportWidthUnit);
		console.log(contextMenuState)
	})
	block.on('dragend', ()=>{
		dragEndHandler(block.id(),block.x()/userSettings.viewportWidthUnit, block.y()/userSettings.viewportHeightUnit)
	})
	block.add(blockBackground);
	layer.add(block);
	return block;
}

export function deleteNumpadBlock(blockId:string, layer: Konva.Layer | Konva.Group){
	// 在當前 layer 或其子節點中尋找指定 ID 的節點
    const nodeToDelete = layer.findOne(`#${blockId}`); // 使用 `#` 前綴表示 ID 選擇器

    if (nodeToDelete) {
        nodeToDelete.destroy(); // 刪除節點

        if (layer instanceof Konva.Layer) {
            layer.draw();
        } else {
            const parentLayer = nodeToDelete.getLayer();
            if (parentLayer) {
                parentLayer.draw();
            }
        }
        console.log(`Node with ID ${blockId} deleted.`);
		return true
    } else {
        console.warn(`Node with ID ${blockId} not found for deletion.`);
		return false
    }
	
}