import type { CanvasNumpadBlockDto } from '$lib/client';
import { type UserSettings, LAYOUT_SETTING } from '$lib/userInterface';
import { numpadInputToCommandImages } from '$lib/utils/canvas/numpad/numpadCompiler';
import Konva from 'konva';
import { contextMenuState } from '$lib/utils/canvas/context_menu/canvas-context-menu.svelte';
import {
	drawInvisibleAnchorPoint,
	getAnchorPositionArray,
	removeAnchorPoint,
	showSpecificAnchorPoint
} from '../arrow/canvas-arrow';
import { featureManager, type IFeature } from '../canvas-feature-manager';
export type OnBlockDragEndCallback = (blockId: string, x: number, y: number) => void;

export interface DrawNumpadBlockConfig {
	canvasNumpadBlock: CanvasNumpadBlockDto;
	userSettings: UserSettings;
	dragEndHandler?: OnBlockDragEndCallback;
	stage: Konva.Stage;
	layer: Konva.Layer;
}

export function drawNumpadBlock(config: DrawNumpadBlockConfig) {
	const { canvasNumpadBlock, userSettings, dragEndHandler, stage, layer } = config;
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
	const blockBackground = new Konva.Rect({
		width: blockWidth * LENGTH_UNIT,
		height: blockHeight * LENGTH_UNIT,
		fill: 'oklch(0.45 0.02 264.15)',
		id: `${canvasNumpadBlock.id}-block-background`
	});
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
	block.on('dragstart', (event) => {
		featureManager.deactivate();
	});

	block.add(blockBackground);
	drawInvisibleAnchorPoint(blockBackground.id(), block, stage);
	layer.add(block);
	block.on('click tap', function (e) {
		e.cancelBubble = true;
		const context: NumpadSelectContext = {
			numpadNode: block,
			layer: layer,
			stage: stage
		};
		const feature = new NumpadSelectFeature();
		featureManager.activate<NumpadSelectContext>('anchor-points', block.id(), feature, context);
	});
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

interface NumpadSelectContext {
	numpadNode: Konva.Group;
	layer: Konva.Layer;
	stage: Konva.Stage;
}

class NumpadSelectFeature implements IFeature<NumpadSelectContext> {
	onActivated(context: NumpadSelectContext): () => void {
		showSpecificAnchorPoint(context.numpadNode.id(), context.layer, context.stage);
		const cleanup = () => {
			removeAnchorPoint(context.layer);
		};
		return cleanup;
	}
}
