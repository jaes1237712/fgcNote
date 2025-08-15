import Konva from 'konva';
import { Group } from 'konva/lib/Group';
import { Layer } from 'konva/lib/Layer';
import { NUMPAD_TO_SRC } from '$lib/utils/numpadCompiler';
import type { NUMPAD_ACTION_SET_TYPE, CONTROLLER_TYPE } from '$lib/utils/numpadCompiler';

export interface CreateImageConfig {
	x: number;
	y: number;
	width: number;
	height: number;
	length_unit: number;
	key: NUMPAD_ACTION_SET_TYPE['CLASSIC'] | NUMPAD_ACTION_SET_TYPE['MODERN'];
	type: CONTROLLER_TYPE;
}

export function create_image(config: CreateImageConfig, layer: Layer | Group) {
	const imageObj = new Image();
	imageObj.onload = function () {
		const konva_img = new Konva.Image({
			x: config.x * config.length_unit,
			y: config.y * config.length_unit,
			image: imageObj,
			width: config.width * config.length_unit,
			height: config.height * config.length_unit
		});
		layer.add(konva_img);
	};
	if (config.type == 'CLASSIC') {
		imageObj.src = NUMPAD_TO_SRC.CLASSIC[config.key];
	} else {
		imageObj.src = NUMPAD_TO_SRC.MODERN[config.key];
	}
}

export const LAYOUT_SETTING = {
	block_height: 6,
	horizontal_margin: 0.5
} as const;
