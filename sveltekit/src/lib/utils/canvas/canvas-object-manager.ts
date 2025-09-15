import Konva from 'konva';
import { CanvasDataStore, type CanvasNodeData } from './canvas-data-manager.svelte';
import { LAYOUT_SETTING, type UserSettings } from '$lib/userInterface';
import { numpadInputToCommandImages } from './numpad/numpadCompiler';
import { ArrowingFeature, drawInvisibleAnchorPoint, removeAnchorPoint, showSpecificAnchorPoint, type ArrowingContext } from './arrow/canvas-arrow';
import { featureManager, type IFeature } from './canvas-feature-manager';
import { contextMenuState } from './context_menu/canvas-context-menu.svelte';
import { PUBLIC_NESTJS_URL } from '$env/static/public';
import type { CanvasTextDto } from '$lib/client';

export class KonvaObjectManager{
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private userSettings: UserSettings = null
    private canvasDataStore: CanvasDataStore
    private konvaContainer: HTMLDivElement
    public youtubePlayers = new Map<string, YT.Player>();

    constructor(container: HTMLDivElement, stageId: string, userSettings: UserSettings, canvasDataStore: CanvasDataStore) {
        this.konvaContainer = container
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

    createNode(data:CanvasNodeData): void{
        const kind = data.kind
        const userSettings = this.userSettings
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
                anchorPoints.forEach((anchor) => {
                    anchor.on('click tap',  (event) => {
                        event.cancelBubble = true;
                        const context: ArrowingContext = {
                            startNodeId: anchor.id(),
                            layer: this.layer,
                            stage: this.stage,
                            canvasDataStore: this.canvasDataStore,
                            userSettings
                        }
                        const feature = new ArrowingFeature()
                        featureManager.activate<ArrowingContext>(
                            'arrowing',
                            anchor.id(),
                            feature,
                            context
                        )
                    });
                })
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
                block.on('dragstart', () => {
                    featureManager.deactivate()
                });
                block.on('contextmenu', (event) => {
                    event.evt.preventDefault();
                    event.cancelBubble = true; // 阻止事件向上冒泡到 Stage
                    contextMenuState.show(event.evt.clientX, event.evt.clientY, 'numpadBlock', block.id());
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
                Konva.Image.fromURL(PUBLIC_NESTJS_URL + data.characterMoveImage.filePath, (image)=>{
                    image.setAttrs({
                        x: data.x * userSettings.viewportWidthUnit,
                        y: data.y * userSettings.viewportHeightUnit,
                        draggable: true,
                        scaleX: data.scaleX,
                        scaleY: data.scaleY,
                        rotation:data.rotation,
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
                    image.on('dragmove', () => {
                        this.canvasDataStore.updateNodeData(image.id(), {
                            x: image.x() / userSettings.viewportWidthUnit,
                            y: image.y() / userSettings.viewportHeightUnit
                        });
                    });
                    image.on('dragstart', (event) => {
                        featureManager.deactivate()
                    });
                    this.layer.add(image);
                    image.on('transformend', (e) => {
                        this.canvasDataStore.updateNodeData(image.id(), {
                            rotation: image.rotation(),
                            scaleX: image.scaleX(),
                            scaleY: image.scaleY()
                        });
                    });
                });
                break
            case 'TEXT':
                const text = new Konva.Text({
                    id: `${data.id}-text`,
                    x: 12,
                    y: 12,
                    text:data.text,
                    fill: data.fontColor,
                    fontSize: 32,
                    fontFamily: 'sans-serif',
                    lineHeight: 1.2,
                })
                const background = new Konva.Rect({
                    id: `${data.id}-background`,
                    x: 0,
                    y: 0,
                    fill: data.backgroundColor,
                    height:text.height()+24,
                    width: text.width()+24,
                })
                const textBlock = new Konva.Group({
                    id: data.id,
                    x: data.x*this.userSettings.viewportWidthUnit,
                    y: data.y*this.userSettings.viewportHeightUnit,
                    scaleX: data.scaleX,
                    scaleY: data.scaleY,
                    name: 'text',
                    draggable: true
                })
                textBlock.add(background)
                textBlock.add(text)
                this.layer.add(textBlock)
                const textarea = document.createElement('textarea');
                textarea.id = `${data.id}-textarea`
                const textAreaStyle = {
                    position:'absolute',
                    visibility: 'hidden',
                    left: `${textBlock.x()}px`,
                    top: `${textBlock.y()}px`,
                    backgroundColor: `transparent`,
                    border: 'none',
                    outline: 'none',
                    filedSizing:'content',
                    fontSize:'32px',
                    lineHeight: `${text.lineHeight()}`,
                    margin:`0`,
                    fontFamily:`sans-serif`,
                    boxSizing: `border-box`,
                    transform: `scale(${data.scaleX}, ${data.scaleY})`,
                    padding: `${text.y()}px ${text.x()}px`,
                    transformOrigin: 'top left',
                    zIndex: 1000,
                    resize: 'none'
                }
                textarea.value = data.text
                textarea.focus();
                textarea.oninput = ()=>{
                    text.text(textarea.value)
                    background.height(text.height()+24)
                    background.width(text.width()+24)
                    console.log('oninput event')
                }
                Object.assign(textarea.style, textAreaStyle)
                this.konvaContainer.appendChild(textarea)
                textBlock.on('dblclick', (e) =>{
                    e.cancelBubble = true
                    const context: TextAreaEditContext ={
                        data: data,
                        text: text,
                        textarea: textarea,
                        canvasDataStore: this.canvasDataStore
                    }
                    const feature = new TextAreaEditFeature()
                    featureManager.activate<TextAreaEditContext>('text-editing', data.id, feature, context)
                })
                textBlock.on('dragend', ()=>{
                    this.canvasDataStore.updateNodeData(textBlock.id(),{
                        x: textBlock.x() / this.userSettings.viewportWidthUnit,
                        y: textBlock.y() / this.userSettings.viewportHeightUnit
                    });
                })
                textBlock.on('dragmove',()=>{
                    textarea.style.x = `${textBlock.x()}px`
                    textarea.style.y = `${textBlock.y()}px`
                })
                textBlock.on('click tap', (e) => {
                    e.cancelBubble = true;
                    const context: TextBlockTransformerContext = {
                        textBlock: textBlock,
                        layer: this.layer
                    };
                    const feature = new TextBlockTransformerFeature();
                    featureManager.activate<TextBlockTransformerContext>(
                        'text-transformer',
                        textBlock.id(),
                        feature,
                        context
                    );
                });
                textBlock.on('dragstart', () =>{
                    featureManager.deactivate()
                });
                textBlock.on('transformend', (e) => {
                    this.canvasDataStore.updateNodeData(textBlock.id(), {
                        rotation: textBlock.rotation(),
                        scaleX: textBlock.scaleX(),
                        scaleY: textBlock.scaleY()
                    });
                });
                textBlock.on('contextmenu', (event) => {
                    event.evt.preventDefault();
                    event.cancelBubble = true; // 阻止事件向上冒泡到 Stage
                    contextMenuState.show(event.evt.clientX, event.evt.clientY, 'text', textBlock.id());
                });
                break
            case 'VIDEO':
                const videoType = data.type
                switch(videoType){
                    case 'YOUTUBE':
                        const urlParts = data.src.split('/embed/');
                        let videoId:string;
                        if(urlParts.length >1){
                            // 取得 /embed/ 後面的部分
                            const idWithParams = urlParts[1];
                            // 如果有問號，表示後面還有參數，只取問號之前的部分
                            videoId = idWithParams.split('?')[0];
                        }
                        if(videoId){
                            const imageURL = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                            
                            Konva.Image.fromURL(imageURL, (image) =>{
                                image.setAttrs({
                                    x: data.x * userSettings.viewportWidthUnit,
                                    y: data.y * userSettings.viewportHeightUnit,
                                    draggable: true,
                                    scaleX: data.scaleX,
                                    scaleY: data.scaleY,
                                    rotation:data.rotation,
                                    id: `${data.id}`
                                });
                                image.on('dragend', ()=>{
                                    this.canvasDataStore.updateNodeData(data.id, {
                                        x: image.x() / userSettings.viewportWidthUnit,
                                        y: image.y() / userSettings.viewportHeightUnit
                                    });
                                })
                                image.on('contextmenu', (event)=>{
                                    event.evt.preventDefault();
                                    event.cancelBubble = true;
                                    contextMenuState.show(
                                        event.evt.clientX,
                                        event.evt.clientY,
                                        'video',
                                        data.id
                                    );
                                })
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
                                image.on('transformend', (e) => {
                                    this.canvasDataStore.updateNodeData(image.id(), {
                                        rotation: image.rotation(),
                                        scaleX: image.scaleX(),
                                        scaleY: image.scaleY()
                                    });
                                });
                                this.layer.add(image);
                                const playerContainer = document.createElement('div')
                                playerContainer.id = `${data.id}-player`
                                const YTiframeStyle = {                    
                                    position:'absolute',
                                    visibility: 'hidden',
                                    left: `${data.x* userSettings.viewportWidthUnit}px`,
                                    top: `${data.y* userSettings.viewportHeightUnit}px`,
                                    width: `${image.width()}px`,
                                    height: `${image.height()}px`,
                                    transform: `scale(${data.scaleX}, ${data.scaleY})`,
                                    border: `none`,
                                    zIndex: 1000,
                                    transformOrigin: `top left`,
                                }
                                Object.assign(playerContainer.style, YTiframeStyle)
                                this.konvaContainer.appendChild(playerContainer)
                                const playerInstance = new YT.Player(playerContainer.id, {
                                    videoId: videoId,
                                    playerVars: {
                                        'playsinline': 1,
                                        'autoplay': 0, // 不要自動播放，讓使用者控制
                                        'controls': 1,
                                        'rel': 0,
                                        'showinfo': 0,
                                        'modestbranding': 1,
                                    },
                                })
                                this.youtubePlayers.set(`${data.id}`, playerInstance)
                                const iframeElement = document.getElementById(`${data.id}-player`) as HTMLIFrameElement
                                image.on('dblclick', () =>{
                                    const context: ShowYouTubeVideoContext = {
                                        iframeElement: iframeElement,
                                        image: image,
                                        playerInstance: playerInstance
                                    }
                                    
                                    const feature: ShowYouTubeVideoFeature = new ShowYouTubeVideoFeature()
                                    featureManager.activate('showYouTube', data.id, feature, context)
                                })
                            })
                            
                        }
                        
      
                        break
                }
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
            case 'TEXT':
                const text = this.layer.findOne('#'+`${data.id}-text`) as Konva.Text;
                text.text(data.text)
                text.fill(data.fontColor)
                const background = this.layer.findOne('#'+`${data.id}-background`) as Konva.Rect;
                background.fill(data.backgroundColor)
                const textBlock = this.layer.findOne('#'+`${data.id}`) as Konva.Group;
                textBlock.scaleX(data.scaleX)
                textBlock.scaleY(data.scaleY)
                textBlock.rotation(data.rotation)
                const textarea = document.getElementById(`${data.id}-textarea`) as HTMLTextAreaElement
                const textAreaStyle = {
                    position:'absolute',
                    visibility: 'hidden',
                    left: `${textBlock.x()}px`,
                    top: `${textBlock.y()}px`,
                    backgroundColor: `transparent`,
                    border: 'none',
                    outline: 'none',
                    filedSizing:'content',
                    fontSize:'32px',
                    lineHeight: `${text.lineHeight()}`,
                    margin:`0`,
                    fontFamily:`sans-serif`,
                    boxSizing: `border-box`,
                    transform: `scale(${data.scaleX}, ${data.scaleY})`,
                    padding: `${text.y()}px ${text.x()}px`,
                    transformOrigin: 'top left',
                    zIndex: 1000,
                    resize: 'none'
                }
                Object.assign(textarea.style, textAreaStyle)
                this.layer.draw()
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
                case 'TEXT':
                    const textarea = document.getElementById(`${data.id}-textarea`) as HTMLTextAreaElement
                    if(textarea){
                        textarea.parentNode.removeChild(textarea)
                    }
                    break
                case 'VIDEO':
                    const iframeElement = document.getElementById(`${data.id}-iframe`) as HTMLIFrameElement
                    if(iframeElement){
                        iframeElement.parentNode.removeChild(iframeElement)
                    }
                    break
            }
            targetNode.destroy()
            return true
        }
        return false
    }
}

interface TextAreaEditContext{
    data: CanvasTextDto,
    text: Konva.Text,
    textarea: HTMLTextAreaElement,
    canvasDataStore: CanvasDataStore
}



class TextAreaEditFeature implements IFeature<TextAreaEditContext>{
    onActivated(context: TextAreaEditContext): () => void {
        const { data, text, textarea, canvasDataStore} = context;
        const copyData = {...data}
        if(text.visible()){
            textarea.style.visibility = 'visible'
            text.visible(false)
            textarea.focus()
        }
        const focusOutHandler = () => {
            // 在處理之前先移除監聽器，避免在 cleanup 期間再次觸發
            textarea.removeEventListener('focusout', focusOutHandler);
            copyData.text = textarea.value;
            canvasDataStore.updateNodeData(data.id, copyData);
            textarea.style.visibility = 'hidden';
            text.visible(true);
            featureManager.deactivate();
        }
        textarea.addEventListener('focusout', focusOutHandler)
        const cleanup = () => {
            textarea.removeEventListener('focusout', focusOutHandler);
        }
        return cleanup
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

interface ShowYouTubeVideoContext{
    iframeElement: HTMLIFrameElement;
    image: Konva.Image;
    playerInstance: YT.Player
}

class ShowYouTubeVideoFeature implements IFeature<ShowYouTubeVideoContext>{
    onActivated(context: ShowYouTubeVideoContext): () => void {
        const {iframeElement, image, playerInstance} = context
        iframeElement.style.left = `${image.x()}px`
        iframeElement.style.top = `${image.y()}px`
        iframeElement.style.width = `${image.width()}px`
        iframeElement.style.height = `${image.height()}px`
        iframeElement.style.visibility = 'visible'
        iframeElement.style.transform = `scale(${image.scaleX()},${image.scaleY()})`;

        iframeElement.addEventListener('mouseleave', () =>{
            console.log('mouseleave')
            if(document.fullscreenElement !== iframeElement && playerInstance.getPlayerState() !==1){
                featureManager.deactivate('showYouTube')
            }
            
        })
        const cleanup = () =>{
            iframeElement.style.visibility = 'hidden'
        }
        return cleanup
    }
}

interface TextBlockTransformerContext {
    textBlock: Konva.Group;
    layer: Konva.Layer;
}

class TextBlockTransformerFeature implements IFeature<TextBlockTransformerContext> {
    onActivated(context: TextBlockTransformerContext): () => void {
        const tr = new Konva.Transformer();
        tr.nodes([context.textBlock]);
        context.layer.add(tr);
        context.layer.draw();
        const cleanup = () => {
            tr.destroy();
            context.layer.draw();
            console.log('text transformer clean up');
        };
        return cleanup;
    }
}
