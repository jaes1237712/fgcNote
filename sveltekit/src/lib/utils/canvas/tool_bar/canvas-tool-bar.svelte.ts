import {AArrowDown, AArrowUp, ArrowRight, Baseline, Bold, Ellipsis, Image, Italic, Joystick, PaintBucket, Palette, Text, Underline, Video} from '@lucide/svelte'
import type { CanvasDataStore, CanvasNodeData } from '../canvas-data-manager.svelte';
import type { CanvasStageDto, CanvasTextDto } from '$lib/client';
import { featureManager } from '../canvas-feature-manager';

// export type ToolOption = {
//     containerId: string
//     hoverString: string;
//     icon: typeof PaintBucket | null;
// }

// const STAGE_OPTIONS:ToolOption[] =[
//     {containerId:'tool-create-numpadBlock', hoverString:'Crate Combo', icon:Joystick},
//     {containerId:'tool-create-image', hoverString:'Crate Image', icon:Image},
//     {containerId:'tool-create-text', hoverString:'Crate Text', icon:Text},
//     {containerId:'tool-create-video', hoverString:'Crate Video', icon:Video}
// ] as const

// const TEXT_TOOLS:ToolOption[] =[
//     {containerId:'tool-fontSize-increase', hoverString:'Increase Font Size', icon:AArrowUp},
//     {containerId:'tool-fontSize-number', hoverString:'', icon:null},
//     {containerId:'tool-fontSize-decrease', hoverString:'Decrease Font Size', icon:AArrowDown},
//     {containerId:'tool-font-color', hoverString:'Font Color', icon: Baseline},
//     {containerId:'tool-background-color', hoverString:'Fill Color', icon: PaintBucket},
//     {containerId:'tool-font-bold', hoverString:'Text Bold', icon:Bold},
//     {containerId:'tool-font-italic', hoverString:'Text Italic', icon:Italic},
//     {containerId:'tool-font-underline', hoverString:'Text Underline', icon:Underline},
// ] as const

// const ARROW_TOOLS:ToolOption[] =[
//     {containerId:'tool-arrow-solid', hoverString:'Solid Arrow', icon:ArrowRight},
//     {containerId:'tool-arrow-dotted', hoverString:'Dotted Arrow', icon:Ellipsis},
//     {containerId:'tool-arrow-fill', hoverString:'Fill Color', icon:Palette},
// ] as const

//TODO 需要讓使用者可以儲存固定樣式
// type StageToolContainerId = (typeof STAGE_OPTIONS)[number]['containerId'];
// type TextToolContainerId = (typeof TEXT_TOOLS)[number]['containerId'];
// type ArrowToolContainerId = (typeof ARROW_TOOLS)[number]['containerId'];

// export type ToolContainerId = StageToolContainerId | TextToolContainerId | ArrowToolContainerId;


export type ToolBarTargetType = 'arrow'|'text' | 'stage' | 'image' | 'video' |'numpadBlock'


export class ToolBarState{
    public visible = $state(false)
    position = $state({x:0, y:0})
    targetType = $state<ToolBarTargetType>();
    targetData = $state<CanvasNodeData|CanvasStageDto>();
    // options = $derived(getToolBarOptions(this.targetType))
    // canvasDataStore = $state<CanvasDataStore>()
    constructor(type:ToolBarTargetType, data:CanvasNodeData|CanvasStageDto
    ){
        // this.canvasDataStore = canvasDataStore
        this.targetData=data
        this.targetType=type
    }
    show(type: ToolBarTargetType, data:CanvasNodeData|CanvasStageDto, x?: number, y?: number) {
        if(x!==undefined&&y!==undefined){
            this.position = { x, y }; // 觸發響應式更新
        }
		this.targetType = type; // 觸發響應式更新
		this.visible = true; // 觸發響應式更新
        this.targetData = data
	}
	hide() {
		this.visible = false;
	}
}

// function getToolBarOptions(targetType: ToolBarTargetType | undefined){
//     if(!targetType){
//         return []
//     }
//     switch(targetType){
//         case 'arrow':
//             return ARROW_TOOLS
//         case 'stage':
//             return STAGE_OPTIONS
//         case 'text':
//             return TEXT_TOOLS
//         case 'image':
//         case 'video':
//         case 'numpadBlock':
//             return []

//     }
// }

