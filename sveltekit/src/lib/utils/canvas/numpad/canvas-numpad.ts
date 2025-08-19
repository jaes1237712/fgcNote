import type {CanvasNumpadBlockDto} from '$lib/client';
import { type UserSettings, LAYOUT_SETTING } from '$lib/userInterface';
import { numpadInputToCommandImages } from '$lib/utils/canvas/numpad/numpadCompiler';
import Konva from 'konva';

export interface CreateNumpadBlockConfig {
	canvasNumpadBlock: CanvasNumpadBlockDto;
	userSettings: UserSettings;
}

export function createNumpadBlock(config: CreateNumpadBlockConfig, layer: Konva.Layer | Konva.Group) {
	const canvasNumpadBlock = config.canvasNumpadBlock;
	const userSettings = config.userSettings;
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
	block.add(blockBackground);
	layer.add(block);
	return block;
}