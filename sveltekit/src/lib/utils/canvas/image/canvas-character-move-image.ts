import type { CanvasCharacterMoveImageDto } from '$lib/client';
import { type UserSettings } from '$lib/userInterface';
import Konva from 'konva';
import { contextMenuState } from '$lib/utils/canvas/context_menu/canvas-context-menu.svelte';
export type OnBlockDragEndCallback = (characterMoveImageId: string, x: number, y: number) => void;
import { PUBLIC_NESTJS_URL } from '$env/static/public';

export interface DrawCharacterMoveImageConfig {
	canvasCharacterMoveImage: CanvasCharacterMoveImageDto;
	userSettings: UserSettings;
	dragEndHandler: OnBlockDragEndCallback;
}

export function drawCharacterMoveImage(
	config: DrawCharacterMoveImageConfig,
	layer: Konva.Layer | Konva.Group
) {
	const { canvasCharacterMoveImage, userSettings, dragEndHandler } = config;
	const scale =
		(userSettings.viewportHeightUnit * userSettings.moveImageHeight) /
		canvasCharacterMoveImage.characterMoveImage.height;
	Konva.Image.fromURL(
		PUBLIC_NESTJS_URL + canvasCharacterMoveImage.characterMoveImage.filePath,
		function (image) {
			image.setAttrs({
				x: canvasCharacterMoveImage.x * userSettings.viewportWidthUnit,
				y: canvasCharacterMoveImage.y * userSettings.viewportHeightUnit,
				draggable: true,
				scaleX: scale,
				scaleY: scale,
				id: canvasCharacterMoveImage.id
			});
			image.on('contextmenu', (event) => {
				event.evt.preventDefault();
				event.cancelBubble = true;
				contextMenuState.show(
					event.evt.clientX,
					event.evt.clientY,
					'characterMoveImage',
					image.id()
				);
			});
			image.on('dragend', () => {
				dragEndHandler(
					image.id(),
					image.x() / userSettings.viewportWidthUnit,
					image.y() / userSettings.viewportHeightUnit
				);
			});
			layer.add(image);
		}
	);
}
