import {ArrowRight, Baseline, Bold, Ellipsis, Image, Italic, Joystick, PaintBucket, Palette, Text, Underline, Video} from '@lucide/svelte'

export type ToolBarTargetType = 'arrow'|'text' | 'stage' | 'image' | 'video' |'numpadBlock'

export type ToolOption = {
    containerId: string
    hoverString: string;
    icon: typeof PaintBucket
}

const STAGE_OPTIONS: ToolOption[] =[
    {containerId:'tool-create-numpadBlock', hoverString:'Crate Combo', icon:Joystick},
    {containerId:'tool-create-image', hoverString:'Crate Image', icon:Image},
    {containerId:'tool-create-text', hoverString:'Crate Text', icon:Text},
    {containerId:'tool-create-video', hoverString:'Crate Video', icon:Video}
]

const TEXT_TOOLS: ToolOption[] =[
    {containerId:'tool-background-color', hoverString:'Fill Color', icon: PaintBucket},
    {containerId:'tool-font-color', hoverString:'Font Color', icon: Baseline},
    {containerId:'tool-font-bold', hoverString:'Text Bold', icon:Bold},
    {containerId:'tool-font-italic', hoverString:'Text Italic', icon:Italic},
    {containerId:'tool-font-underline', hoverString:'Text Underline', icon:Underline},
]

//TODO 需要讓使用者可以儲存固定樣式

const ARROW_TOOLS: ToolOption[] =[
    {containerId:'tool-arrow-solid', hoverString:'Solid Arrow', icon:ArrowRight},
    {containerId:'tool-arrow-dotted', hoverString:'Dotted Arrow', icon:Ellipsis},
    {containerId:'tool-arrow-fill', hoverString:'Fill Color', icon:Palette},
]

class ToolBarStore{
    public visible = $state(false)
    position = $state({x:0, y:0})
    targetType = $state<ToolBarTargetType>();
    targetId = $state<string>();
    options = $derived(getToolBarOptions(this.targetType))
    show(type: ToolBarTargetType, id?: string, x?: number, y?: number) {
        if(x!==undefined&&y!==undefined){
            this.position = { x, y }; // 觸發響應式更新
        }
		this.targetType = type; // 觸發響應式更新
		this.targetId = id || ''; // 觸發響應式更新
		this.visible = true; // 觸發響應式更新
	}

	hide() {
		this.visible = false;
	}
}

function getToolBarOptions(targetType: ToolBarTargetType | undefined){
    if(!targetType){
        return []
    }
    switch(targetType){
        case 'arrow':
            return ARROW_TOOLS
        case 'stage':
            return STAGE_OPTIONS
        case 'text':
            return TEXT_TOOLS
        case 'image':
        case 'video':
        case 'numpadBlock':
            return []

    }
}

export const toolBarState = new ToolBarStore()