import type { CanvasStageDto, CharacterDto } from '$lib/client';
import Konva from 'konva';

export interface createStageConfig {
	stageDto: CanvasStageDto;
	container: HTMLDivElement;
	onContextMenu: (position: { x: number; y: number }) => void;
	onClick: () => void;
}

export function createStage(config: createStageConfig): { stage: Konva.Stage; layer: Konva.Layer } {
	const { stageDto, container, onContextMenu, onClick } = config;
	const stage = new Konva.Stage({
		container: container,
		width: container.clientWidth,
		height: container.clientHeight,
		id: stageDto.id
	});

	stage.on('contextmenu', (event) => {
		event.evt.preventDefault();
		const mousePos = stage.getPointerPosition();
		if (mousePos) {
			const containerRect = container.getBoundingClientRect();
			const viewportX = mousePos.x + containerRect.left;
			const viewportY = mousePos.y + containerRect.top;
			onContextMenu({ x: viewportX, y: viewportY });
		}
	});

	stage.on('click', () => {
		onClick();
	});
	const layer = new Konva.Layer();
	stage.add(layer);
	return { stage: stage, layer: layer };
}
