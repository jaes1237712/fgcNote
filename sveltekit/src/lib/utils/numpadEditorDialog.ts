import Konva from 'konva'
import type {CreateImageConfig} from '$lib/utils/canvas'
import { numpadCompiler } from '$lib/utils/numpadCompiler';
import {create_image} from '$lib/utils/canvas'
import type { CONTROLLER_TYPE } from '$lib/utils/numpadCompiler';
import {LAYOUT_SETTING} from '$lib/utils/canvas'

interface NumpadEditorDialogDependencies {
    previewStage: Konva.Stage;
    previewLayer: Konva.Layer;
    numpadEditorInput: HTMLInputElement;
    numpadEditorDialog: HTMLDialogElement;
    LENGTH_UNIT: number
}

export interface UserSettings{
    controllerType: CONTROLLER_TYPE,
    mainStage: Konva.Stage,
    mainLayer: Konva.Layer,
    mainStageContainer: HTMLDivElement,
    contextMenuPosition: {x: number, y:number};
}

export class HandleNumpadEditorDialog {
    private previewStage: Konva.Stage;
    private previewLayer: Konva.Layer;
    private numpadEditorInput: HTMLInputElement;
    private numpadEditorDialog: HTMLDialogElement;
    private LENGTH_UNIT: number;
    // initial
    private preview_image_configs: CreateImageConfig[] = [];
    
    constructor(deps: NumpadEditorDialogDependencies){
        this.previewStage = deps.previewStage;
        this.previewLayer = deps.previewLayer;
        this.numpadEditorInput = deps.numpadEditorInput;
        this.numpadEditorDialog = deps.numpadEditorDialog;
        this.LENGTH_UNIT = deps.LENGTH_UNIT;
    }

    handleInputOninput(settings: UserSettings){
        this.previewLayer.destroyChildren();
        this.preview_image_configs = numpadCompiler({
            input:this.numpadEditorInput.value,
            type: settings.controllerType,
            length_unit: this.LENGTH_UNIT,
            block_height: this.previewLayer.getHeight()/this.LENGTH_UNIT,
        })
        for(let config of this.preview_image_configs){
            create_image(config, this.previewLayer)
        }
    }
    
    handleNumpadDialogPostButton(settings: UserSettings){
        if(this.numpadEditorInput.value != ""){
            const rec_konva = settings.mainStageContainer.getBoundingClientRect();
            const group = new Konva.Group({
                x: settings.contextMenuPosition.x - rec_konva.left,
                y: settings.contextMenuPosition.y - rec_konva.top,
                draggable:true
            })
            let block_width = LAYOUT_SETTING.horizontal_margin*2;
            for(let config of this.preview_image_configs){
                block_width += config.width;
                config.x += LAYOUT_SETTING.horizontal_margin;
                config.y = (LAYOUT_SETTING.block_height-config.height)/2
                create_image(config,group);
            }
            const block_height = 6;
            const block = new Konva.Rect({
                width: block_width*this.LENGTH_UNIT,
                height: block_height*this.LENGTH_UNIT,
                fill: 'oklch(0.45 0.02 264.15)',
                stroke: 'black',
                strokeWidth: 0
            })
            group.add(block);
            settings.mainLayer.add(group);
            this.numpadEditorDialog.close();
        }
        else{
            alert("Empty input!")
        }
    }
    
    handleNumpadDialogCloseButton(){
        this.previewLayer.destroyChildren();
        this.numpadEditorInput.value="";
        this.numpadEditorDialog.close()
    }
}