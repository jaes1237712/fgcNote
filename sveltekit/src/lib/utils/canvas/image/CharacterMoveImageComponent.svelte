<script lang="ts">
	import Konva from 'konva';
	import { onMount } from 'svelte';
	import { PUBLIC_NESTJS_URL } from '$env/static/public';
	// 引入你的 CanvasStore 和 FeatureManager
	import { featureManager, type IFeature } from '$lib/utils/canvas/canvas-feature-manager'; // 假設路徑
	import { contextMenuState } from '$lib/utils/canvas/context_menu/canvas-context-menu.svelte'; // 假設路徑
	import { LAYOUT_SETTING, type UserSettings } from '$lib/userInterface'; // 用戶設置
	import type { CanvasCharacterMoveImageDto } from '$lib/client';

	// Props: 從父組件接收 Konva Layer 和 NumpadBlock 的資料
	let {
		layer,
		data,
		userSettings,
		stage
	}: {
		layer: Konva.Layer;
		data: CanvasCharacterMoveImageDto;
		userSettings: UserSettings;
		stage: Konva.Stage;
	} = $props();
	const scale =
		(userSettings.viewportHeightUnit * userSettings.moveImageHeight) /
		data.characterMoveImage.height;
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
	onMount(() => {
		Konva.Image.fromURL(PUBLIC_NESTJS_URL + data.characterMoveImage.filePath, function (image) {
			image.setAttrs({
				x: data.x * userSettings.viewportWidthUnit,
				y: data.y * userSettings.viewportHeightUnit,
				draggable: true,
				scaleX: scale,
				scaleY: scale,
				id: data.id
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
			layer.add(image);
		});
	});
</script>
