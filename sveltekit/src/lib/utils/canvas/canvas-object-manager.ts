import Konva from 'konva';
import { CanvasDataStore, type CanvasNodeData } from './canvas-data-manager.svelte';
import { LAYOUT_SETTING, type UserSettings } from '$lib/userInterface';
import { numpadInputToCommandImages } from './numpad/numpadCompiler';
import { drawInvisibleAnchorPoint, removeAnchorPoint, showSpecificAnchorPoint } from './arrow/canvas-arrow';
import { featureManager, type IFeature } from './canvas-feature-manager';
import { contextMenuState } from './context_menu/canvas-context-menu.svelte';
import { PUBLIC_NESTJS_URL } from '$env/static/public';

export class KonvaObjectManager{
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private userSettings: UserSettings = null
    private canvasDataStore: CanvasDataStore

    constructor(container: HTMLDivElement, stageId: string, userSettings: UserSettings, canvasDataStore: CanvasDataStore) {
        this.stage = new Konva.Stage({
            container,
            id: stageId,
            width: container.clientWidth,
            height: container.clientHeight
        });
        this.stage.on('contextmenu', (event) => {
			event.evt.preventDefault();
			contextMenuState.show(event.evt.clientX, event.evt.clientY, 'stage', stageId);
		});
		this.stage.on('click tap', () => {
			contextMenuState.visible = false;
			featureManager.deactivate();
		});
        this.userSettings = userSettings
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        this.canvasDataStore = canvasDataStore
    }

    InitializeObjectByDataStore(){
        // 根據canvasDataStore的內容，生成Konva Object，一般只有初始化需要用
        const canvasNodeData: CanvasNodeData[] = this.canvasDataStore.nodesDataInDesiredOrder
        canvasNodeData.forEach((data)=>{
            this.createNode(data)
        })
    }

    // 建立或更新節點
    upsertNode(data: CanvasNodeData): void {
        const existingNode = this.layer.findOne('#' + data.id)
        if (existingNode) {
            // // 更新現有節點
            // this.updateNode(nodeData);
        } else {
            // 建立新節點
            this.createNode(data);
        }
    }

    createNode(data:CanvasNodeData): void{
        const kind = data.kind
        const userSettings = this.userSettings
        console.log('createNode', data)
        switch (kind){
            case 'NUMPAD_BLOCK':
                const commandImagesSrc = numpadInputToCommandImages({
                    input: data.input,
                    type: data.type,
                    userSettings: userSettings
                });
                const LENGTH_UNIT = userSettings.lengthUnit;
                const commandLength = commandImagesSrc.length;
                const blockWidth =
                    (commandLength + LAYOUT_SETTING.horizontalMarginScale * 2) * userSettings.commandSize;
                const blockHeight = userSettings.commandSize * LAYOUT_SETTING.blockHeightScale;
                const block = new Konva.Group({
                    x: data.x * userSettings.viewportWidthUnit,
                    y: data.y * userSettings.viewportHeightUnit,
                    draggable: true,
                    width: blockWidth * LENGTH_UNIT,
                    height: blockHeight * LENGTH_UNIT,
                    id: data.id,
                    name: 'numpad-block'
                });
                commandImagesSrc.forEach((imageSrc, index) => {
                    const imageObj = new Image();
                    imageObj.onload = function () {
                        const konvaCommandImage = new Konva.Image({
                            x:
                                (index + LAYOUT_SETTING.horizontalMarginScale) * userSettings.commandSize * LENGTH_UNIT,
                            y: (blockHeight - userSettings.commandSize) * (LENGTH_UNIT / 2),
                            image: imageObj,
                            width: userSettings.commandSize * LENGTH_UNIT,
                            height: userSettings.commandSize * LENGTH_UNIT
                        });
                        block.add(konvaCommandImage);
                    };
                    imageObj.src = imageSrc;
                });
                const blockBackground = new Konva.Rect({
                    width: blockWidth * LENGTH_UNIT,
                    height: blockHeight * LENGTH_UNIT,
                    fill: 'oklch(0.45 0.02 264.15)',
                    id: `${data.id}-block-background`
                });
                block.add(blockBackground);
                const anchorPoints = drawInvisibleAnchorPoint(blockBackground.id(), block, this.stage);
                this.layer.add(block);
                block.on('click tap', (e) =>{
                    e.cancelBubble = true;
                    const context: NumpadBlockSelectContext = {
                        numpadNode: block,
                        layer: this.layer,
                        stage: this.stage
                    };
                    const feature = new NumpadBlockSelectFeature();
                    featureManager.activate<NumpadBlockSelectContext>('anchor-points', block.id(), feature, context);
                });
                block.on('dragmove', () => {
                    this.canvasDataStore.updateNodeData(block.id(), {
                        x: block.x() / userSettings.viewportWidthUnit,
                        y: block.y() / userSettings.viewportHeightUnit
                    });
                    anchorPoints.forEach((anchor) =>{
                        const foundNodes = this.layer.find(node =>{
                            const nodeStartNodeId = node.getAttr('startNodeId');
                            const nodeEndNodeId = node.getAttr('endNodeId');
                            return nodeStartNodeId === anchor.id() || nodeEndNodeId === anchor.id()
                        }) 
                        foundNodes.forEach((node)=>{
                            this.updateKonvaNode(this.canvasDataStore.getNodeData(node.id()))
                        })
                    })
                });
                block.on('dragstart', (event) => {
                    const context: NumpadBlockDraggingContext ={
                        anchorPoints: anchorPoints,
                        layer: this.layer,
                        stage: this.stage
                    }
                    const feature = new NumpadBlockDraggingFeature();
                    featureManager.activate('dragging', block.id(),feature, context)
                });
                block.on('contextmenu', (event) => {
                    event.evt.preventDefault();
                    event.cancelBubble = true; // 阻止事件向上冒泡到 Stage
                    contextMenuState.show(event.evt.clientX, event.evt.clientY, 'numpadBlock', block.id());
                    console.log(block.id())
                });
                break
            case 'ARROW':
                const startNode = this.layer.findOne('#' + data.startNodeId);
                if(startNode){
                    const startAbsPos = startNode.getAbsolutePosition();
                    const layerInverseTransform = this.layer.getAbsoluteTransform().copy().invert();
                    const startLayerPos = layerInverseTransform.point(startAbsPos);
                    let drawPoints = data.points;
                    if (data.endNodeId) {
                        const endNode = this.layer.findOne('#' + data.endNodeId);
                        if(endNode){
                            const endNodeAbsPos = endNode.getAbsolutePosition();
                            const dx = endNodeAbsPos.x - startAbsPos.x;
                            const dy = endNodeAbsPos.y - startAbsPos.y;
                            drawPoints.pop();
                            drawPoints.pop();
                            drawPoints.push(dx);
                            drawPoints.push(dy);
                        }
                    }
                    const arrow = new Konva.Arrow({
                        x: startLayerPos.x,
                        y: startLayerPos.y,
                        points: drawPoints,
                        id: data.id,
                        startNodeId: data.startNodeId,
                        endNodeId: data.endNodeId,
                        fill: 'white',
                        stroke: 'white'
                    });
                    this.layer.add(arrow)
                }
                break
            case 'CHARACTER_MOVE_IMAGE':
                const scale =
                (userSettings.viewportHeightUnit * userSettings.moveImageHeight) /
                data.characterMoveImage.height;
                Konva.Image.fromURL(PUBLIC_NESTJS_URL + data.characterMoveImage.filePath, (image)=>{
                    image.setAttrs({
                        x: data.x * userSettings.viewportWidthUnit,
                        y: data.y * userSettings.viewportHeightUnit,
                        draggable: true,
                        scaleX: scale,
                        scaleY: scale,
                        id: data.id
                    });
                    image.on('click tap', (e) => {
                        e.cancelBubble = true;
                        const context: ImageTransformerContext = {
                            imageNode: image,
                            layer: this.layer
                        };
                        const feature = new ImageTransformerFeature();
                        featureManager.activate<ImageTransformerContext>(
                            'transformer',
                            image.id(),
                            feature,
                            context
                        );
                    });
                    image.on('contextmenu', (event) => {
                        event.evt.preventDefault();
                        event.cancelBubble = true;
                        contextMenuState.show(
                            event.evt.clientX,
                            event.evt.clientY,
                            'characterMoveImage',
                            image.id()
                        );
                    });
                    image.on('destroy', ()=>{
                        console.log('image destroy')
                    })
                    this.layer.add(image);
                });
                break
        }
    }

    updateKonvaNode(data:CanvasNodeData): void{
        const kind = data.kind
        const userSettings = this.userSettings
        const targetNode = this.layer.findOne('#' + data.id)
        if(!targetNode){
            return
        }
        switch(kind){
            case 'ARROW':
                const startNode = this.layer.findOne('#' + data.startNodeId);
                if(startNode){
                    const startAbsPos = startNode.getAbsolutePosition();
                    const layerInverseTransform = this.layer.getAbsoluteTransform().copy().invert();
                    const startLayerPos = layerInverseTransform.point(startAbsPos);
                    let drawPoints = data.points;
                    if (data.endNodeId) {
                        const endNode = this.layer.findOne('#' + data.endNodeId);
                        if(endNode){
                            const endNodeAbsPos = endNode.getAbsolutePosition();
                            const dx = endNodeAbsPos.x - startAbsPos.x;
                            const dy = endNodeAbsPos.y - startAbsPos.y;
                            drawPoints.pop();
                            drawPoints.pop();
                            drawPoints.push(dx);
                            drawPoints.push(dy);
                        }
                    }
                    targetNode.setAttrs({
                        x: startLayerPos.x,
                        y: startLayerPos.y,
                        points: drawPoints,
                        startNodeId: data.startNodeId,
                        endNodeId: data.endNodeId,
                    })
                }
                break
            default:
                break
        }
    }
    
    deleteNode(data:CanvasNodeData): boolean{
        const targetNode = this.layer.findOne('#' + data.id)
        const kind = data.kind
        if(targetNode){
            switch(kind){
                case 'NUMPAD_BLOCK':
                    const foundNodes = this.layer.find(node =>{
                        const nodeStartNodeId = node.getAttr('startNodeId');
                        const nodeEndNodeId = node.getAttr('endNodeId');
                        return nodeStartNodeId === data.id || nodeEndNodeId === data.id
                    }) 
                    foundNodes.forEach((node)=>{
                        this.canvasDataStore.deleteNodeData(node.id())
                    })
                    break
            }
            targetNode.destroy()
            return true
        }
        return false
    }
}

interface NumpadBlockSelectContext {
    numpadNode: Konva.Group;
    layer: Konva.Layer;
    stage: Konva.Stage;
}
class NumpadBlockSelectFeature implements IFeature<NumpadBlockSelectContext> {
    onActivated(context: NumpadBlockSelectContext): () => void {
        showSpecificAnchorPoint(context.numpadNode.id(), context.layer, context.stage);
        const cleanup = () => {
            removeAnchorPoint(context.layer);
        };
        return cleanup;
    }
}

interface NumpadBlockDraggingContext {
    anchorPoints: Konva.Circle[];
    layer: Konva.Layer;
    stage: Konva.Stage;
}
class NumpadBlockDraggingFeature implements IFeature<NumpadBlockDraggingContext> {
    onActivated(context: NumpadBlockDraggingContext): () => void {

        const cleanup = () => {
        };
        return cleanup;
    }
}

interface ImageTransformerContext {
    imageNode: Konva.Image;
    layer: Konva.Layer;
}
class ImageTransformerFeature implements IFeature<ImageTransformerContext> {
    onActivated(context: ImageTransformerContext): () => void {
        const tr = new Konva.Transformer();
        tr.nodes([context.imageNode]);
        context.layer.add(tr);
        context.layer.draw();
        const cleanup = () => {
            tr.destroy();
            context.layer.draw();
            console.log('clean up');
        };
        return cleanup;
    }
}