import Konva from 'konva';
import { Group } from 'konva/lib/Group';
import { Layer } from 'konva/lib/Layer';

export interface CreateImageConfig {
	x: number;
	y: number;
	width: number;
	height: number;
	length_unit: number;
	src: string;
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
	imageObj.src = config.src;
}

export const LAYOUT_SETTING = {
	block_height: 6,
	horizontal_margin: 0.5
} as const;
