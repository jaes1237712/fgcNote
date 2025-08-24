import type { CanvasStageDto, CharacterDto } from '$lib/client';
import Konva from 'konva';
import { contextMenuState } from '$lib/utils/canvas/context_menu/canvas-context-menu.svelte';

export interface createStageConfig {
	stageDto: CanvasStageDto;
	container: HTMLDivElement;
}

export function createStage(config: createStageConfig): { stage: Konva.Stage; layer: Konva.Layer } {
	const { stageDto, container } = config;
	const stage = new Konva.Stage({
		container: container,
		width: container.clientWidth,
		height: container.clientHeight,
		id: stageDto.id
	});

	stage.on('contextmenu', (event) => {
		event.evt.preventDefault();
		console.log('stage on contextmenu');
		contextMenuState.show(event.evt.clientX, event.evt.clientY, 'stage', stage.id());
	});

	stage.on('click', () => {
		contextMenuState.visible = false;
	});
	const layer = new Konva.Layer();
	stage.add(layer);
	return { stage: stage, layer: layer };
}
