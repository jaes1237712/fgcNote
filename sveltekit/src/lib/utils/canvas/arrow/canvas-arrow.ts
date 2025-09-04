import type { CanvasArrowDto } from "$lib/client";
import type {UserSettings}  from '$lib/userInterface';
import Konva from "konva";
import { PUBLIC_NESTJS_URL } from '$env/static/public';
import { v4 as uuidv4 } from 'uuid';

export interface DrawArrowConfig{
    canvasArrow: CanvasArrowDto;
    relativeStartPosition: {x:number, y: number};
    relativeEndPosition: {x:number, y: number};
}

export function drawArrow(config: DrawArrowConfig, layer: Konva.Layer){
    const {canvasArrow, relativeStartPosition, relativeEndPosition} = config;
    const startNode = layer.findOne('#' + canvasArrow.startNodeId);
    const endNode = layer.findOne('#' + canvasArrow.endNodeId);
    const points = [0,0, 
                    endNode.position().x+relativeEndPosition.x - startNode.position().x - relativeStartPosition.x, 
                    endNode.position().y+relativeEndPosition.y - (startNode.position().y + relativeStartPosition.y)]
    const arrow = new Konva.Arrow({
        x:startNode.position().x + relativeStartPosition.x,
        y:startNode.position().y + relativeStartPosition.y,
        points: points,
        stroke: 'black',
        id: canvasArrow.id,
        fill: 'black'
    });
    layer.add(arrow);
}

function getAnchorPositionArray(nodeId: string, layer: Konva.Layer){
    const targetNode = layer.findOne('#' + nodeId);
    const x = targetNode.position().x
    const y = targetNode.position().y
    const width = targetNode.width()
    const height = targetNode.height()
    const gap = 16
    return [
        {x: x+width+gap, y:y+height/2},
        {x: x-gap, y:y+height/2},
        {x: x+width/2 , y:y-gap},
        {x: x+width/2 , y:y+height+gap},
    ]
}

function dragArrow(startNodeId: string, layer: Konva.Layer, stage:Konva.Stage){
    const startNode = layer.findOne('#' + startNodeId)
    const x = startNode.position().x;
    const y = startNode.position().y;
    const mousePos = layer.getRelativePointerPosition();
    const arrow = new Konva.Arrow({
        x: x,
        y: y,
        points: [0,0, mousePos.x - x, mousePos.y-y],
        stroke: 'white',
        fill: 'white',
        id: 'temp-arrow'
    })
    layer.add(arrow)
    stage.on('mousemove', function(event){
        const mousePos = layer.getRelativePointerPosition();
        console.log(mousePos)
        arrow.points([0,0, mousePos.x - x, mousePos.y-y]);
    })
    arrow.on('click', function(event){
        console.log("off mousemove")
        stage.off('mousemove')
    })
}

export function drawAnchorPoint(nodeId: string, layer: Konva.Layer, stage:Konva.Stage){
    const targetNode = layer.findOne('#' + nodeId);
    const positionArray = getAnchorPositionArray(nodeId, layer)
    const rect = new Konva.Line({
        x: targetNode.position().x-16,
        y: targetNode.position().y-16,
        // width: targetNode.width() + 32,
        // height: targetNode.height() + 32,
        points: [
            0,0,
            targetNode.width() + 32, 0,
            targetNode.width() + 32, targetNode.height()+32,
            0, targetNode.height()+32,
            0,0
        ],
        stroke:'black',
        strokeWidth: 5
    })
    layer.add(rect)
    positionArray.forEach((pos)=>{
        const new_id = uuidv4()
        const anchorCircle = new Konva.Circle({
            x: pos.x,
            y: pos.y,
            radius: 4,
            fill: 'white',
            stroke: 'none',
            id: new_id
        })
        anchorCircle.on('click', function(event){
            dragArrow(new_id, layer, stage)
            console.log('click')
        })
        layer.add(anchorCircle)
    })

}

export function removeAnchorPoint(layer: Konva.Layer){
    const targetNodes = layer.find('.anchor-point')
    targetNodes.forEach((node) => {
        node.destroy()
    })
}