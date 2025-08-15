import type { CreateImageConfig } from '$lib/utils/canvas';

const COMMON_ACTION = {
	'1': '/src/lib/images/controller/down_left.png',
	'2': '/src/lib/images/controller/down.png',
	'3': '/src/lib/images/controller/down_right.png',
	'4': '/src/lib/images/controller/left.png',
	'5': '/src/lib/images/controller/nutral.png',
	'6': '/src/lib/images/controller/right.png',
	'7': '/src/lib/images/controller/up_left.png',
	'8': '/src/lib/images/controller/up.png',
	'9': '/src/lib/images/controller/up_right.png',
	throw: '/src/lib/images/controller/throw.png',
	'+': '/src/lib/images/controller/plus.png',
	or: '/src/lib/images/controller/or.png'
} as const;

export const NUMPAD_TO_SRC = {
	CLASSIC: {
		...COMMON_ACTION,
		k: '/src/lib/images/controller/kick.png',
		lk: '/src/lib/images/controller/light_kick.png',
		mk: '/src/lib/images/controller/medium_kick.png',
		hk: '/src/lib/images/controller/heavy_kick.png',
		p: '/src/lib/images/controller/punch.png',
		lp: '/src/lib/images/controller/light_punch.png',
		mp: '/src/lib/images/controller/medium_punch.png',
		hp: '/src/lib/images/controller/heavy_punch.png'
	},
	MODERN: {
		...COMMON_ACTION,
		l: '/src/lib/images/controller/modern_l.png',
		m: '/src/lib/images/controller/modern_m.png',
		h: '/src/lib/images/controller/modern_h.png',
		sp: '/src/lib/images/controller/sp.png',
		a_: '/src/lib/images/controller/modern_auto.png'
	}
} as const;

export const NUMPAD_KEYS_SET = {
	CLASSIC: new Set(Object.keys(NUMPAD_TO_SRC.CLASSIC)),
	MODERN: new Set(Object.keys(NUMPAD_TO_SRC.MODERN))
};

export type CONTROLLER_TYPE = keyof typeof NUMPAD_TO_SRC;

export type NUMPAD_ACTION_SET_TYPE = {
	[K in CONTROLLER_TYPE]: keyof (typeof NUMPAD_TO_SRC)[K];
};

export interface NumpadCompilerConfig {
	input: string;
	type: CONTROLLER_TYPE;
	length_unit: number;
	block_height: number;
}

// Helper function to parse input string into valid actions
function parseInputToActions(input: string, actionSet: Set<string>): string[] {
	const actions: string[] = [];
	let i = 0;

	// Convert actionSet to lowercase for case-insensitive comparison
	const lowerActionSet = new Set(Array.from(actionSet).map((action) => action.toLowerCase()));

	while (i < input.length) {
		let found = false;
		// Try to match the longest possible action starting from position i
		for (let length = Math.min(5, input.length - i); length >= 1; length--) {
			const candidate = input.slice(i, i + length);
			if (lowerActionSet.has(candidate.toLowerCase())) {
				actions.push(candidate.toLowerCase());
				i += length;
				found = true;
				break;
			}
		}

		// If no valid action found, skip this character
		if (!found) {
			i++;
		}
	}

	return actions;
}

export function numpadCompiler(config: NumpadCompilerConfig): CreateImageConfig[] {
	let return_cofigs: CreateImageConfig[] = [];
	let action_set;
	let action_to_src;
	if (config.type == 'CLASSIC') {
		action_set = NUMPAD_KEYS_SET.CLASSIC;
		action_to_src = NUMPAD_TO_SRC.CLASSIC;
	} else {
		action_set = NUMPAD_KEYS_SET.MODERN;
		action_to_src = NUMPAD_TO_SRC.MODERN;
	}

	// Parse input into valid actions
	const actions = parseInputToActions(config.input, action_set);

	let count = 0;
	let step = 3;

	for (let action of actions) {
		return_cofigs.push({
			x: count,
			y: (config.block_height - step) / 2,
			width: step,
			height: step,
			length_unit: config.length_unit,
			src: action_to_src[action]
		});
		count += step;
	}
	return return_cofigs;
}
