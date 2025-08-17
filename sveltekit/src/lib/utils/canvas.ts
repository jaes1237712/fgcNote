import Konva from 'konva';
import { Group } from 'konva/lib/Group';
import { Layer } from 'konva/lib/Layer';
import type {CharacterMoveImageDto} from '$lib/client/types.gen'
import { PUBLIC_NESTJS_URL } from '$env/static/public';
import {numpadInputToCommandImages} from '$lib/utils/numpadCompiler'
import type {CONTROLLER_TYPE} from '$lib/utils/numpadCompiler'
import {type UserSettings, LAYOUT_SETTING} from '$lib/userInterface'


export interface CanvasNumpadBlock{
	input: string,
	type: CONTROLLER_TYPE,
	x: number,			// unit:viewportWidthUnit
	y: number,			// unit:viewportHeightUnit
}

export interface CreateNumpadBlockConfig {
	canvasNumpadBlock: CanvasNumpadBlock
	userSettings: UserSettings
}

export function createNumpadBlock(config: CreateNumpadBlockConfig, layer: Layer | Group){
	const canvasNumpadBlock = config.canvasNumpadBlock
	const userSettings = config.userSettings
	const commandImagesSrc = numpadInputToCommandImages({
		input:canvasNumpadBlock.input,
		type:canvasNumpadBlock.type,
		userSettings:userSettings})
	const LENGTH_UNIT = userSettings.lengthUnit
	const commandLength = commandImagesSrc.length
	const blockWidth = (commandLength+LAYOUT_SETTING.horizontalMarginScale*2)*userSettings.commandSize
	const blockHeight = userSettings.commandSize*LAYOUT_SETTING.blockHeightScale
	const block = new Konva.Group({
		x: canvasNumpadBlock.x*userSettings.viewportWidthUnit,
		y: canvasNumpadBlock.y*userSettings.viewportHeightUnit,
		draggable: true,
		width: blockWidth*LENGTH_UNIT,
		height: blockHeight*LENGTH_UNIT
	});
	commandImagesSrc.forEach((imageSrc,index) => {
		const imageObj = new Image();
		imageObj.onload = function (){
			const konvaCommandImage = new Konva.Image({
				x: (index+LAYOUT_SETTING.horizontalMarginScale)*userSettings.commandSize*LENGTH_UNIT,
				y: (blockHeight-userSettings.commandSize)*(LENGTH_UNIT/2),
				image: imageObj,
				width: userSettings.commandSize*LENGTH_UNIT,
				height: userSettings.commandSize*LENGTH_UNIT
			});
			block.add(konvaCommandImage)
		};
		imageObj.src = imageSrc
	});
	const blockBackground = new Konva.Rect({
		width: blockWidth*LENGTH_UNIT,
		height: blockHeight*LENGTH_UNIT,
		fill: 'oklch(0.45 0.02 264.15)',
	});
	block.add(blockBackground);
	layer.add(block);
}

export interface CanvasCharacterMoveImage{
	image: CharacterMoveImageDto,
	x: number, 
	y: number,
}

export interface CreateCharacterMoveImageConfig{
	canvasImage: CanvasCharacterMoveImage,
	userSettings: UserSettings
}

export function createCharacterMoveImage(config: CreateCharacterMoveImageConfig, layer: Layer | Group){
	const canvasImage = config.canvasImage
	const userSettings = config.userSettings
	const scale = (userSettings.viewportHeightUnit*userSettings.moveImageHeight)/canvasImage.image.height
	Konva.Image.fromURL(PUBLIC_NESTJS_URL+canvasImage.image.filePath, function(image){
		image.setAttrs({
			x:canvasImage.x*userSettings.viewportWidthUnit,
			y:canvasImage.y*userSettings.viewportHeightUnit,
			draggable: true,
			scaleX: scale, 
			scaleY: scale
		})
		layer.add(image)
	})
}