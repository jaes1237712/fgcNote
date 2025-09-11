import type { CanvasCharacterMoveImageDto } from '$lib/client';
import { type UserSettings } from '$lib/userInterface';
import Konva from 'konva';
import { contextMenuState } from '$lib/utils/canvas/context_menu/canvas-context-menu.svelte';
export type OnImageDragEndCallback = (characterMoveImageId: string, x: number, y: number) => void;
import { PUBLIC_NESTJS_URL } from '$env/static/public';
import { featureManager, type IFeature } from '../canvas-feature-manager';

export interface DrawCharacterMoveImageConfig {
	canvasCharacterMoveImage: CanvasCharacterMoveImageDto;
	userSettings: UserSettings;
	dragEndHandler: OnImageDragEndCallback;
	transformer: Konva.Transformer;
}

export function drawCharacterMoveImage(config: DrawCharacterMoveImageConfig, layer: Konva.Layer) {
	const { canvasCharacterMoveImage, userSettings, dragEndHandler, transformer } = config;
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
			image.on('click tap', function (e) {
				e.cancelBubble = true;
				const context: ImageTransformerContext = {
					imageNode: this,
					layer: layer
				};
				const feature = new ImageTransformerFeature();
				featureManager.activate<ImageTransformerContext>(
					'transformer',
					image.id(),
					feature,
					context
				);
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
			image.on('dragstart', () => {
				featureManager.deactivate();
			});
			image.on('dragend', () => {
				dragEndHandler(
					image.id(),
					image.x() / userSettings.viewportWidthUnit,
					image.y() / userSettings.viewportHeightUnit
				);
			});
			image.on('transformend', function (e) {
				console.log(this.attrs);
			});
			layer.add(image);
		}
	);
}

export function eraseCharacterMoveImage(imageId: string, layer: Konva.Layer | Konva.Group) {
	// 在當前 layer 或其子節點中尋找指定 ID 的節點
	const nodeToDelete = layer.findOne(`#${imageId}`); // 使用 `#` 前綴表示 ID 選擇器

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
		console.log(`Node with ID ${imageId} deleted.`);
		return true;
	} else {
		console.warn(`Node with ID ${imageId} not found for deletion.`);
		return false;
	}
}

interface ImageTransformerContext {
	imageNode: Konva.Image;
	layer: Konva.Layer;
}

class ImageTransformerFeature implements IFeature<ImageTransformerContext> {
	onActivated(context: ImageTransformerContext): () => void {
		const tr = new Konva.Transformer();
		tr.nodes([context.imageNode]);
		context.layer.add(tr);
		context.layer.draw();
		const cleanup = () => {
			tr.destroy();
			context.layer.draw();
			console.log('clean up');
		};
		return cleanup;
	}
}
