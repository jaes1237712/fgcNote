import Konva from 'konva';
import { CanvasDataStore, type CanvasNodeData } from './canvas-data-manager.svelte';
import { LAYOUT_SETTING, type UserSettings } from '$lib/userInterface';
import { numpadInputToCommandImages } from './numpad/numpadCompiler';
import { ArrowingFeature, drawArrow, drawInvisibleAnchorPoint, removeAnchorPoint, showSpecificAnchorPoint, type ArrowingContext } from './arrow/canvas-arrow';
import { featureManager, type IFeature } from './canvas-feature-manager';
import { contextMenuState } from './context_menu/canvas-context-menu.svelte';
import { PUBLIC_NESTJS_URL } from '$env/static/public';
import type { CanvasStageDto, CanvasTextDto } from '$lib/client';
import type { ToolBarState } from './tool_bar/canvas-tool-bar.svelte';

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
                    { canvasArrow: data },
                    this.layer,
                    userSettings
                );
                if (arrow) {
                    arrow.on('click tap', ()=>{
                        // TODO 調整樣式那些功能
                        this.toolBarState.show('arrow', data)
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
                const text = new Konva.Text({
                    id: `${data.id}-text`,
                    x: 12,
                    y: 12,
                    text:data.text,
                    fill: data.fontColor,
                    fontSize: data.fontSize,
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
                    newArrow.on('click tap', ()=>{
                        this.toolBarState.show('arrow', data)
                    })
                }
                break
            case 'TEXT':
                const text = this.layer.findOne('#'+`${data.id}-text`) as Konva.Text;
                text.text(data.text)
                text.fill(data.fontColor)
                text.scale({x:1,y:1})
                text.fontSize(data.fontSize)
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

interface TextBlockTransformerContext {
    textBlock: Konva.Group;
    layer: Konva.Layer;
}

class TextBlockTransformerFeature implements IFeature<TextBlockTransformerContext> {
    onActivated(context: TextBlockTransformerContext): () => void {
        const tr = new Konva.Transformer();
        tr.resizeEnabled(false)
        tr.nodes([context.textBlock]);
        // context.textBlock.draggable(false)
        context.layer.add(tr);
        context.layer.draw();
        // const SNAP_DEGREES = 2; // 吸附閾值，例如：在目標角度的 ±5 度內吸附
        // const SNAP_ANGLES = [0, 90, 180, 270]; // 目標吸附角度
        // tr.on('transform', (e) =>{
        //     const node = tr.nodes()[0]; // 獲取當前 Transformer 附著的節點
        //     if (!node) return;
        //     const currentRotation = node.rotation();
        //     console.log(currentRotation)
        //     let snapped = false;
        //     for (const snapAngle of SNAP_ANGLES) {
        //         // 計算當前角度與目標吸附角度的差值
        //         const diff = Math.abs(currentRotation % 360 - snapAngle);
        
        //         // 如果差值在吸附閾值內，則進行吸附
        //         // 考慮到 0/360 度的邊界情況，以及負角度
        //         if (diff < SNAP_DEGREES || Math.abs(diff - 360) < SNAP_DEGREES) {
        //             node.rotation(snapAngle); // 將節點旋轉設置為吸附角度
        //             snapped = true;
        //             break; // 找到一個吸附點就停止
        //         }
        //     }
        // })
        const cleanup = () => {
            // context.textBlock.draggable(true)
            tr.destroy();
            context.layer.draw();
            console.log('text transformer clean up');
        };
        return cleanup;
    }
}
