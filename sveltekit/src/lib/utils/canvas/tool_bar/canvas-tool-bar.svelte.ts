import {ArrowRight, Baseline, Bold, Ellipsis, Italic, PaintBucket, Palette, Underline} from '@lucide/svelte'

export type ToolOption = {
    containerId: string
    hoverString: string;
    icon: typeof PaintBucket
}

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