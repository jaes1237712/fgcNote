import Konva from 'konva';
import { CanvasDataStore, type CanvasNodeData } from './canvas-data-manager.svelte';
import { LAYOUT_SETTING, type UserSettings } from '$lib/userInterface';
import { numpadInputToCommandImages } from './numpad/numpadCompiler';
import { ArrowingFeature, drawArrow, drawInvisibleAnchorPoint, removeAnchorPoint, showSpecificAnchorPoint, type ArrowingContext } from './arrow/canvas-arrow';
import { featureManager, type IFeature } from './canvas-feature-manager';
import { contextMenuState } from './context_menu/canvas-context-menu.svelte';
import { PUBLIC_NESTJS_URL } from '$env/static/public';
import type { CanvasArrowAnchorDto, CanvasArrowDto, CanvasStageDto, CanvasTextDto } from '$lib/client';
import type { ToolBarState } from './tool_bar/canvas-tool-bar.svelte';
import type { Vector2d } from 'konva/lib/types';
import type { Node } from 'konva/lib/Node';

export class KonvaObjectManager{
    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private userSettings: UserSettings = null
    private canvasDataStore: CanvasDataStore
    private konvaContainer: HTMLDivElement
    public youtubePlayers = new Map<string, YT.Player>();
    public toolBarState: ToolBarState

    constructor(container: HTMLDivElement, stageDto: CanvasStageDto, 
        userSettings: UserSettings, canvasDataStore: CanvasDataStore, 
        toolBarState: ToolBarState) {
        this.toolBarState = toolBarState
        this.konvaContainer = container
        this.stage = new Konva.Stage({
            container,
            id: stageDto.id,
            width: container.clientWidth,
            height: container.clientHeight
        });
        this.stage.on('contextmenu', (event) => {
			event.evt.preventDefault();
			contextMenuState.show(event.evt.clientX, event.evt.clientY, 'stage', stageDto.id);
		});
		this.stage.on('click tap', () => {
			contextMenuState.visible = false;
            this.toolBarState.show('stage',stageDto)
			featureManager.deactivate();
		});
        this.userSettings = userSettings
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        this.canvasDataStore = canvasDataStore
        const rec = this.konvaContainer.getBoundingClientRect()
        this.toolBarState.show('stage',stageDto,rec.left,rec.top)
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
                    this.toolBarState.show('numpadBlock', data)
                });
                block.on('dragmove', () => {
                    this.canvasDataStore.updateNodeData(block.id(), {
                        x: block.x() / userSettings.viewportWidthUnit,
                        y: block.y() / userSettings.viewportHeightUnit
                    });
                    anchorPoints.forEach((anchor) =>{
                        const foundNodes = this.layer.find(node =>{
                            const nodeAnchorNodesId = node.getAttr('anchorNodesId');
                            return nodeAnchorNodesId && nodeAnchorNodesId.includes(anchor.id())
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
                // Use the new drawArrow function from canvas-arrow.ts
                const arrow = drawArrow(
                    { canvasArrow: data},
                    this.layer,
                    userSettings
                );
                if (arrow) {
                    arrow.on('click tap', (event)=>{
                        // TODO 調整樣式那些功能
                        event.cancelBubble = true
                        this.toolBarState.show('arrow', data)
                        const context:ArrowSelectContext ={
                            arrowData: this.canvasDataStore.getNodeData(data.id) as CanvasArrowDto,
                            layer: this.layer,
                            canvasDataStore: this.canvasDataStore,
                            userSettings:this.userSettings
                        }
                        const feature = new ArrowSelectFeature()
                        featureManager.activate('arrow-select', data.id, feature, context)
                    })
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
                        this.toolBarState.show('image',data)
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
                let fontStyle:string
                if(data.isBold || data.isItalic || data.isUnderline){
                    fontStyle = ""
                    if(data.isBold){
                        fontStyle += "bold "
                    }
                    if(data.isItalic){
                        fontStyle += "italic"
                    }
                }else{
                    fontStyle = "normal"
                }
                const text = new Konva.Text({
                    id: `${data.id}-text`,
                    x: 12,
                    y: 12,
                    text:data.text,
                    fill: data.fontColor,
                    fontSize: data.fontSize,
                    fontFamily: 'sans-serif',
                    lineHeight: 1.2,
                    fontStyle: fontStyle
                })
                if(data.isUnderline){
                    text.textDecoration('underline')   
                }
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
                    rotation:data.rotation,
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
                    fontSize:`${text.fontSize()}px`,
                    lineHeight: `${text.lineHeight()}`,
                    margin:`0`,
                    fontFamily:`sans-serif`,
                    boxSizing: `border-box`,
                    padding: `${text.y()}px ${text.x()}px`,
                    zIndex: 1000,
                    resize: 'none',
                    transform: `rotate(${textBlock.rotation()}deg)`,
                    transformOrigin: `top left`
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
                    this.toolBarState.show('text',data)
                });
                textBlock.on('dragstart', () =>{
                    featureManager.deactivate()
                });
                textBlock.on('transformend', (e) => {
                    this.canvasDataStore.updateNodeData(textBlock.id(), {
                        rotation: textBlock.rotation(),
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
                                    this.toolBarState.show('video',{...data})
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
            case 'ARROW_ANCHOR':{
                const anchor = new Konva.Circle({
                    x: data.x*this.userSettings.viewportWidthUnit,
                    y: data.y*this.userSettings.viewportHeightUnit,
                    radius: 8,
                    fill: 'white',
                    stroke: 'none',
                    id: data.id,
                    arrowId: data.arrowId,
                    name: 'arrow-anchor',
                    visible: false,
                    draggable: true,
                });
                anchor.on('dragend',()=>{
                    featureManager.deactivate()
                })
                anchor.on('dragmove', () => {
                    const arrowData = this.canvasDataStore.getNodeData(data.arrowId) as CanvasArrowDto
                    const otherVisibleAnchors:Node[] = []
                    arrowData.anchorNodesId.forEach((id)=>{
                        if(id!==data.id){
                            const node = this.layer.findOne('#'+id)
                            otherVisibleAnchors.push(node)
                        }
                    })
                    const mousePos = this.stage.getPointerPosition()
                    let minX = 10
                    let minY = 10
                    let nodeMinX:Node|null = null
                    let nodeMinY:Node|null = null
                    otherVisibleAnchors.forEach((node)=>{
                        const nodeX = node.getAbsolutePosition(this.stage).x
                        const nodeY = node.getAbsolutePosition(this.stage).y
                        if(Math.abs(nodeX-mousePos.x)<minX){
                            minX = Math.abs(nodeX-mousePos.x)
                            nodeMinX = node
                        }
                        if(Math.abs(nodeY-mousePos.y)<minY){
                            minY = Math.abs(nodeY-mousePos.y)
                            nodeMinY = node
                        }
                    })
                    if(nodeMinX==null && nodeMinY==null){
                        this.canvasDataStore.updateNodeData(anchor.id(), {
                            x: anchor.x() / userSettings.viewportWidthUnit,
                            y: anchor.y() / userSettings.viewportHeightUnit
                        });
                    }else{
                        const alignLineX = this.layer.findOne('.align-line-x') as Konva.Line
                        let anchorX = anchor.x()
                        if(nodeMinX){
                            anchorX = nodeMinX.getAbsolutePosition(this.stage).x
                            if(alignLineX){
                                alignLineX.points([anchorX,this.userSettings.viewportHeightUnit*-200,anchorX,this.userSettings.viewportHeightUnit*200])
                                alignLineX.visible(true)
                            }
                        }
                        else{
                            if(alignLineX){
                                alignLineX.visible(false)
                            }
                        }
                        let anchorY = anchor.y()
                        const alignLineY = this.layer.findOne('.align-line-y') as Konva.Line
                        if(nodeMinY){
                            anchorY = nodeMinY.getAbsolutePosition(this.stage).y
                            if(alignLineY){
                                alignLineY.points([this.userSettings.viewportWidthUnit*-200,anchorY,this.userSettings.viewportWidthUnit*200,anchorY])
                                alignLineY.visible(true)
                            }
                        }
                        else{
                            if(alignLineY){
                                alignLineY.visible(false)
                            }
                        }
                        anchor.x(anchorX)
                        anchor.y(anchorY)
                        this.canvasDataStore.updateNodeData(anchor.id(),{
                            x: anchor.x()/this.userSettings.viewportWidthUnit,
                            y: anchor.y()/this.userSettings.viewportHeightUnit
                        })
                    }
                    this.canvasDataStore.updateNodeData(arrowData.id, arrowData)
                });
                this.layer.add(anchor)
                break
            }
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
                // Remove the old arrow and redraw with new anchorNodesId
                targetNode.destroy();
                const newArrow = drawArrow(
                    { canvasArrow: data },
                    this.layer,
                    this.userSettings
                );
                if (newArrow) {
                    newArrow.on('click tap', (event)=>{
                        // TODO 調整樣式那些功能
                        event.cancelBubble = true
                        this.toolBarState.show('arrow', data)
                        const context:ArrowSelectContext ={
                            arrowData: this.canvasDataStore.getNodeData(data.id) as CanvasArrowDto,
                            layer: this.layer,
                            canvasDataStore: this.canvasDataStore,
                            userSettings:this.userSettings
                        }
                        const feature = new ArrowSelectFeature()
                        featureManager.activate('arrow-select', data.id, feature, context)
                    })
                }
                break
            case 'TEXT':
                const text = this.layer.findOne('#'+`${data.id}-text`) as Konva.Text;
                text.text(data.text)
                text.fill(data.fontColor)
                text.scale({x:1,y:1})
                text.fontSize(data.fontSize)
                let fontStyle: string
                if(data.isBold || data.isItalic || data.isUnderline){
                    fontStyle = ""
                    if(data.isBold){
                        fontStyle += "bold "
                    }
                    if(data.isItalic){
                        fontStyle += "italic"
                    }
                }else{
                    fontStyle = "normal"
                }
                if(data.isUnderline){
                    text.textDecoration('underline')
                }
                else{
                    text.textDecoration('')
                }
                text.fontStyle(fontStyle)
                const background = this.layer.findOne('#'+`${data.id}-background`) as Konva.Rect;
                background.width(text.width()+24)
                background.height(text.height()+24)
                background.fill(data.backgroundColor)
                const textBlock = this.layer.findOne('#'+`${data.id}`) as Konva.Group;
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
                    fontSize:`${text.fontSize()}px`,
                    lineHeight: `${text.lineHeight()}`,
                    margin:`0`,
                    fontFamily:`sans-serif`,
                    boxSizing: `border-box`,
                    padding: `${text.y()}px ${text.x()}px`,
                    zIndex: 1000,
                    resize: 'none',
                    transform: `rotate(${textBlock.rotation()}deg)`,
                    transformOrigin: `top left`
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
                        const nodeAnchorNodesId = node.getAttr('anchorNodesId');
                        return nodeAnchorNodesId && nodeAnchorNodesId.includes(data.id)
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


/**
 * 計算兩個點之間的歐幾里得距離。
 * @param {{x: number, y: number}} p1 - 第一個點。
 * @param {{x: number, y: number}} p2 - 第二個點。
 * @returns {number} 兩個點之間的距離。
 */
function getDistance(p1:Vector2d, p2:Vector2d) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 在一條線段上找到距離給定點最近的點。
 * @param {{x: number, y: number}} P - 給定的點 (例如滑鼠位置)。
 * @param {{x: number, y: number}} A - 線段的起點。
 * @param {{x: number, y: number}} B - 線段的終點。
 * @returns {{pointOnSegment: {x: number, y: number}, distance: number}} 包含最近點和其到P的距離。
 */
function getClosestPointOnSegment(P:Vector2d, A:Vector2d, B:Vector2d) {
    // 向量 AP 和 AB
    const AP = { x: P.x - A.x, y: P.y - A.y };
    const AB = { x: B.x - A.x, y: B.y - A.y };

    // 計算 AP 在 AB 上的投影長度比例 t
    // t = (AP . AB) / |AB|^2
    const ab2 = AB.x * AB.x + AB.y * AB.y; // |AB|^2
    let t = 0; // 默認設置為 A 點，處理 A 和 B 是同一個點的情況

    if (ab2 > 0) { // 避免除以零
        t = (AP.x * AB.x + AP.y * AB.y) / ab2;
    }

    let closestPoint;
    if (t < 0) {
        // 最近點在 A 之前，所以是 A 點本身
        closestPoint = A;
    } else if (t > 1) {
        // 最近點在 B 之後，所以是 B 點本身
        closestPoint = B;
    } else {
        // 最近點在線段 AB 上
        closestPoint = {
            x: A.x + t * AB.x,
            y: A.y + t * AB.y
        };
    }

    return {
        pointOnSegment: closestPoint,
        distance: getDistance(P, closestPoint)
    };
}

/**
 * 找到 Konva.Arrow 路徑上離給定點最近的點。
 * @param {Konva.Arrow} konvaArrow - Konva箭頭實例。
 * @param {{x: number, y: number}} mousePos - 滑鼠在圖層上的絕對位置。
 * @returns {closestPos:{x: number, y: number}, startNodeIndex:number, | null} 路徑上最近的點的絕對座標，如果箭頭沒有足夠的點則返回null。
 */
function findClosestPointOnArrowPath(konvaArrow: Konva.Arrow, mousePos: Vector2d):{
    closestPos:{x:number, y:number},
    startNodeIndex:number
}|null {
    const arrowPoints = konvaArrow.points(); // 獲取箭頭的局部點位數組
    const arrowGlobalX = konvaArrow.x(); // 箭頭的全局X位置
    const arrowGlobalY = konvaArrow.y(); // 箭頭的全局Y位置

    // 如果箭頭點位少於2個，無法形成線段
    if (arrowPoints.length < 4) { // 需要至少 (x0, y0, x1, y1)
        return null;
    }

    let closestPointOverall = null;
    let minDistanceOverall = Infinity;
    let startNodeIndex = null
    // 將局部點位轉換為全局點位，並遍歷所有線段
    for (let i = 0; i < arrowPoints.length - 2; i += 2) {
        const A = {
            x: arrowPoints[i] + arrowGlobalX,
            y: arrowPoints[i + 1] + arrowGlobalY
        };
        const B = {
            x: arrowPoints[i + 2] + arrowGlobalX,
            y: arrowPoints[i + 3] + arrowGlobalY
        };

        const { pointOnSegment, distance } = getClosestPointOnSegment(mousePos, A, B);

        if (distance < minDistanceOverall) {
            minDistanceOverall = distance;
            closestPointOverall = pointOnSegment;
            startNodeIndex = i/2
        }
    }

    return {
        closestPos: closestPointOverall,
        startNodeIndex: startNodeIndex
    };
}

interface ArrowSelectContext{
    arrowData: CanvasArrowDto;
    layer: Konva.Layer;
    canvasDataStore: CanvasDataStore;
    userSettings: UserSettings
}

class ArrowSelectFeature implements IFeature<ArrowSelectContext> {
    onActivated(context: ArrowSelectContext): () => void {
        const {arrowData, layer, canvasDataStore, userSettings} = context
        const konvaArrow = layer.findOne('#'+arrowData.id) as Konva.Arrow
        const initialPos = layer.getRelativePointerPosition()
        const tempCircle = new Konva.Circle({
            x: initialPos.x,
            y: initialPos.y,
            radius: 6,
            fill: 'gray',
            stroke: 'none',
            id:'temp-anchor',
            visible: false
        })
        const alignLineX = new Konva.Line({
            points: [10,0,10,4000],
            stroke: 'rgb(0, 161, 255)',
            strokeWidth: 2,
            dash: [4,6],
            name: 'align-line-x',
            visible:false
        })
        const alignLineY = new Konva.Line({
            points: [0,10,4000,10],
            stroke: 'rgb(0, 161, 255)',
            strokeWidth: 2,
            dash: [4,6],
            name:'align-line-y',
            visible: false
        })
        layer.add(alignLineX)
        layer.add(alignLineY)
        let insertIndex:number = arrowData.anchorNodesId.length-1
        layer.add(tempCircle)
        konvaArrow.on('pointermove', ()=>{
            const pos = layer.getRelativePointerPosition()
            const closestPoint = findClosestPointOnArrowPath(konvaArrow, pos);
            if (closestPoint) {
                tempCircle.visible(true);
                tempCircle.x(closestPoint.closestPos.x);
                tempCircle.y(closestPoint.closestPos.y);
                insertIndex = closestPoint.startNodeIndex
            } else {
                tempCircle.visible(false); // 如果箭頭沒有有效路徑，則隱藏tempCircle
            }
        })
        tempCircle.on('click', (event)=>{
            event.cancelBubble = true
            const newId = crypto.randomUUID()
            const newArrowAnchorData: CanvasArrowAnchorDto = {
                kind:'ARROW_ANCHOR',
                id:newId,
                arrowId: arrowData.id,
                x: tempCircle.x()/userSettings.viewportWidthUnit,
                y: tempCircle.y()/userSettings.viewportHeightUnit
            }
            
            canvasDataStore.addNodeData(newArrowAnchorData)
            const newAnchorNodes = []
            arrowData.anchorNodesId.forEach((anchorId, index)=>{
                newAnchorNodes.push(anchorId)
                if(index === insertIndex){
                    newAnchorNodes.push(newId)
                }
            })
            arrowData.anchorNodesId = newAnchorNodes
            canvasDataStore.updateNodeData(arrowData.id, arrowData)
            featureManager.deactivate('arrow-select')
            const context:ArrowSelectContext={
                arrowData:arrowData,
                layer:layer,
                userSettings:userSettings,
                canvasDataStore:canvasDataStore
            }
            const feature = new ArrowSelectFeature()
            featureManager.activate('arrow-select',arrowData.id, feature, context)
        })
        arrowData.anchorNodesId.forEach((anchorId)=>{
            const anchorNode = layer.findOne('#'+anchorId)
            anchorNode.visible(true)
            anchorNode.draggable(true)
            anchorNode.moveToTop()
            // Prevent bubbling to Stage while interacting with anchors
            anchorNode.on('mouseover', ()=>{
                tempCircle.visible(false)
            })
        })
        // konvaArrow.on('pointerout', ()=>{
        //     console.log('pointerout')
        //     tempCircle.visible(false)
        // })
        const cleanup = () => {
            arrowData.anchorNodesId.forEach((anchorId)=>{
                const anchorNode = layer.findOne('#'+anchorId) as Konva.Circle
                anchorNode.visible(false)
                // Reset draggable to avoid accidental drags when hidden
                anchorNode.draggable(false)
            })
            konvaArrow.removeEventListener('pointermove')
            alignLineX.destroy()
            alignLineY.destroy()
            tempCircle.destroy()
        };
        return cleanup;
    }
}




interface TextBlockTransformerContext {
    textBlock: Konva.Group;
    layer: Konva.Layer;
}

class TextBlockTransformerFeature implements IFeature<TextBlockTransformerContext> {
    onActivated(context: TextBlockTransformerContext): () => void {
        const tr = new Konva.Transformer();
        tr.resizeEnabled(false)
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
