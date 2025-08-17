export type CONTROLLER_TYPE = "CLASSIC" | "MODERN"

export interface UserSettings{
	viewportWidthUnit: number,
	viewportHeightUnit:	number,
	lengthUnit: number,	// Default: (1/100)viewportWidth
	moveImageHeight: number,
	commandSize: number,
	defaultControllerType: CONTROLLER_TYPE
}

export const LAYOUT_SETTING = {
	blockHeightScale: 2, //
	horizontalMarginScale: 1/6
} as const;