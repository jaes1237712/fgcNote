import Konva from 'konva';
import { Group } from 'konva/lib/Group';
import { Layer } from 'konva/lib/Layer';
import type { CharacterMoveImageDto, CanvasNumpadBlockDto} from '$lib/client';
import { PUBLIC_NESTJS_URL } from '$env/static/public';
import { numpadInputToCommandImages } from '$lib/utils/canvas/numpad/numpadCompiler';
import { type UserSettings, LAYOUT_SETTING } from '$lib/userInterface';

export interface CanvasCharacterMoveImage {
	image: CharacterMoveImageDto;
	x: number;
	y: number;
}

export interface CreateCharacterMoveImageConfig {
	canvasImage: CanvasCharacterMoveImage;
	userSettings: UserSettings;
}

export function createCharacterMoveImage(
	config: CreateCharacterMoveImageConfig,
	layer: Layer | Group
) {
	const canvasImage = config.canvasImage;
	const userSettings = config.userSettings;
	const scale =
		(userSettings.viewportHeightUnit * userSettings.moveImageHeight) / canvasImage.image.height;
	Konva.Image.fromURL(PUBLIC_NESTJS_URL + canvasImage.image.filePath, function (image) {
		image.setAttrs({
			x: canvasImage.x * userSettings.viewportWidthUnit,
			y: canvasImage.y * userSettings.viewportHeightUnit,
			draggable: true,
			scaleX: scale,
			scaleY: scale
		});
		layer.add(image);
	});
}
