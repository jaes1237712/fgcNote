import type { CanvasNumpadBlockDto } from '$lib/client';
import { type UserSettings, LAYOUT_SETTING } from '$lib/userInterface';
import { numpadInputToCommandImages } from '$lib/utils/canvas/numpad/numpadCompiler';
import Konva from 'konva';
import { contextMenuState } from '$lib/utils/canvas/context_menu/canvas-context-menu.svelte';
export type OnBlockDragEndCallback = (blockId: string, x: number, y: number) => void;

export interface DrawNumpadBlockConfig {
	canvasNumpadBlock: CanvasNumpadBlockDto;
	userSettings: UserSettings;
	dragEndHandler?: OnBlockDragEndCallback;
	tr: Konva.Transformer
}

export function drawNumpadBlock(config: DrawNumpadBlockConfig, layer: Konva.Layer | Konva.Group) {
	const { canvasNumpadBlock, userSettings, dragEndHandler, tr} = config;
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
		id: canvasNumpadBlock.id,
		name: 'transformable'
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
	block.on('click tap', function (e){
		if (e.target !== this) { // 'this' 在 Konva 事件中指向監聽器附加的節點 (即 block)
            // 如果點擊的是 Group 內部的元素，且不是 Group 本身，
            // 則停止事件冒泡，因為我們已經處理了選中整個 Group
            e.cancelBubble = true;
        }
		const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
		const isSelected = tr.nodes().indexOf(this) >= 0; // 'this' 就是這個 block (Group)
	
		if (!metaPressed && !isSelected) {
			tr.nodes([this]);
		} else if (metaPressed && isSelected) {
			const nodes = tr.nodes().slice();
			nodes.splice(nodes.indexOf(this), 1);
			tr.nodes(nodes);
		} else if (metaPressed && !isSelected) {
			const nodes = tr.nodes().concat([this]);
			tr.nodes(nodes);
		}
		layer.draw();
	})

	block.on('contextmenu', (event) => {
		event.evt.preventDefault();
		event.cancelBubble = true; // 阻止事件向上冒泡到 Stage
		contextMenuState.show(event.evt.clientX, event.evt.clientY, 'numpadBlock', block.id());
		console.log(canvasNumpadBlock.x, block.x() / userSettings.viewportWidthUnit);
		console.log(contextMenuState);
	});
	if (dragEndHandler) {
		block.on('dragend', () => {
			dragEndHandler(
				block.id(),
				block.x() / userSettings.viewportWidthUnit,
				block.y() / userSettings.viewportHeightUnit
			);
		});
	}

	block.add(blockBackground);
	layer.add(block);
	return block;
}

export function eraseNumpadBlock(blockId: string, layer: Konva.Layer | Konva.Group) {
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
		return true;
	} else {
		console.warn(`Node with ID ${blockId} not found for deletion.`);
		return false;
	}
}
