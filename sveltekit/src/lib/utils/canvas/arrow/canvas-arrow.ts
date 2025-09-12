import {
	type CanvasArrowDto,
} from '$lib/client';
import Konva from 'konva';
import { featureManager, type IFeature } from '../canvas-feature-manager';
import type { CanvasDataStore } from '../canvas-data-manager.svelte';
import type { UserSettings } from '$lib/userInterface';

export interface DrawArrowConfig {
	canvasArrow: CanvasArrowDto;
}

export function drawArrow(config: DrawArrowConfig, layer: Konva.Layer, userSettings: UserSettings) {
	const { canvasArrow } = config;
	const startNode = layer.findOne('#' + canvasArrow.startNodeId);
	const startAbsPos = startNode.getAbsolutePosition();
	const layerInverseTransform = layer.getAbsoluteTransform().copy().invert();
	const startLayerPos = layerInverseTransform.point(startAbsPos);
	let drawPoints = canvasArrow.points;
	if (canvasArrow.endNodeId) {
		const endNode = layer.findOne('#' + canvasArrow.endNodeId);
		const endNodeAbsPos = endNode.getAbsolutePosition();
		const dx = (endNodeAbsPos.x - startAbsPos.x)/userSettings.viewportWidthUnit;
		const dy = (endNodeAbsPos.y - startAbsPos.y)/userSettings.viewportHeightUnit;
		drawPoints.pop();
		drawPoints.pop();
		drawPoints.push(dx);
		drawPoints.push(dy);
	}
	let pointsToPx = drawPoints.map((point, index)=>{
		const modResult = index % 2
		if(modResult === 1){
			return point*userSettings.viewportWidthUnit
		}
		return point*userSettings.viewportHeightUnit
	})
	const arrow = new Konva.Arrow({
		x: startLayerPos.x,
		y: startLayerPos.y,
		points: pointsToPx,
		id: canvasArrow.id,
		startNodeId: canvasArrow.startNodeId,
		endNodeId: canvasArrow.endNodeId,
		fill: 'white',
		stroke: 'white'
	});
	layer.add(arrow);
	return arrow;
}

const orientations = {
	left: 'left',
	up: 'up',
	right: 'right',
	down: 'down'
};

export function getAnchorPositionArray(nodeId: string, layer: Konva.Layer | Konva.Group) {
	const targetNode = layer.findOne('#' + nodeId);
	const x = targetNode.position().x;
	const y = targetNode.position().y;
	const width = targetNode.width();
	const height = targetNode.height();
	const gap = 16;
	return [
		{ x: x + width + gap, y: y + height / 2, orientation: orientations.right },
		{ x: x - gap, y: y + height / 2, orientation: orientations.left },
		{ x: x + width / 2, y: y - gap, orientation: orientations.up },
		{ x: x + width / 2, y: y + height + gap, orientation: orientations.down }
	];
}

function dragArrow(startNodeId: string, layer: Konva.Layer, stage: Konva.Stage, canvasDataStore: CanvasDataStore, userSettings: UserSettings) {
	const startNode = layer.findOne('#' + startNodeId);
	const x = startNode.getAbsolutePosition().x;
	const y = startNode.getAbsolutePosition().y;
	const layerInverseTransform = layer.getAbsoluteTransform().copy().invert();

	const arrow = drawArrow(
		{
			canvasArrow: {
				kind: 'ARROW',
				id: 'temp-arrow',
				startNodeId: startNodeId,
				endNodeId: null,
				points: [0, 0, 0, 0]
			}
		},
		layer,
		userSettings
	);
	layer.add(arrow);
	const anchorNodes = layer.find('.anchor-point');
	const ANCHOR_SNAP_THRESHOLD = 20; // 吸附半徑 (像素)

	stage.on('mousemove', function (event) {
		const mouseAbsolutePos = stage.getRelativePointerPosition();
		// magnetic attraction
		let closestAnchorAbsolutePos: Konva.Vector2d | null = null;
		let closestAnchorId: string | null = null;
		let minDistance = ANCHOR_SNAP_THRESHOLD + 1;
		// 遍歷所有錨點，找到距離滑鼠最近的那個 (且在閾值內)
		for (const anchorNode of anchorNodes) {
			const dx = mouseAbsolutePos.x - anchorNode.getAbsolutePosition().x;
			const dy = mouseAbsolutePos.y - anchorNode.getAbsolutePosition().y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < ANCHOR_SNAP_THRESHOLD && distance < minDistance) {
				minDistance = distance;
				closestAnchorAbsolutePos = anchorNode.getAbsolutePosition();
				closestAnchorId = anchorNode.id();
			}
		}
		let arrowEndAbsolutePos = mouseAbsolutePos; // 預設箭頭終點是滑鼠絕對位置
		if (closestAnchorAbsolutePos) {
			arrowEndAbsolutePos = closestAnchorAbsolutePos; // 如果有吸附點，終點就是吸附點的絕對位置
			arrow.setAttr('endNodeId', closestAnchorId);
		} else {
			arrow.setAttr('endNodeId', null);
		}
		const arrowEndPos = {
			x: layerInverseTransform.point(arrowEndAbsolutePos).x,
			y: layerInverseTransform.point(arrowEndAbsolutePos).y
		};
		arrow.points([0, 0, arrowEndPos.x - x, arrowEndPos.y - y]);
	});
	stage.on('mouseup', function (event) {
		event.cancelBubble = true;
		const new_id = crypto.randomUUID()
		const new_data: CanvasArrowDto = {
			kind:'ARROW',
			id: new_id,
			startNodeId: startNodeId,
			endNodeId: arrow.getAttr('endNodeId'),		
			points: arrow.points()
		}
		arrow.destroy()
		canvasDataStore.addNodeData(new_data)
		featureManager.deactivate();
		stage.off('mousemove');
		stage.off('mouseup');
	});
}

export function drawInvisibleAnchorPoint(nodeId: string, group: Konva.Group, stage: Konva.Stage):Konva.Circle[] {
	const targetNode = group.findOne('#' + nodeId);
	const positionArray = getAnchorPositionArray(nodeId, group);
	const groupId = group.id();
	const rect = new Konva.Line({
		x: targetNode.position().x - 16,
		y: targetNode.position().y - 16,
		points: [
			0,
			0,
			targetNode.width() + 32,
			0,
			targetNode.width() + 32,
			targetNode.height() + 32,
			0,
			targetNode.height() + 32,
			0,
			0
		],
		stroke: 'black',
		strokeWidth: 5,
		name: 'anchor-point-rec',
		id: `${groupId}-anchor-point-rec`,
		visible: false
	});
	group.add(rect);
	const anchorsObject: Konva.Circle[] = [];
	positionArray.forEach((pos) => {
		const new_id = `${groupId}-anchor-point-${pos.orientation}`;
		const anchorCircle = new Konva.Circle({
			x: pos.x,
			y: pos.y,
			radius: 4,
			fill: 'white',
			stroke: 'none',
			id: new_id,
			name: 'anchor-point',
			visible: false
		});
		group.add(anchorCircle);
		anchorsObject.push(anchorCircle)
	});
	return anchorsObject
}

export function showSpecificAnchorPoint(nodeId: string, layer: Konva.Layer, stage: Konva.Stage) {
	const targetNode = layer.findOne('#' + nodeId);
	if (!targetNode) {
		console.log(`can't showSpecificAnchorPoint not found the node ${nodeId}`);
	}
	const targetAnchorRec = layer.findOne(`#${nodeId}-anchor-point-rec`);
	targetAnchorRec.visible(true);
	Object.values(orientations).forEach((ori) => {
		const targetAnchorId = `${nodeId}-anchor-point-${ori}`;
		const targetAnchor = layer.findOne('#' + targetAnchorId);
		targetAnchor.visible(true);
	});
}

function showAllAnchorPoint(layer: Konva.Layer) {
	const targetNodes = layer.find('.anchor-point');
	targetNodes.forEach((node) => {
		node.visible(true);
	});
}

export function removeAnchorPoint(layer: Konva.Layer) {
	const targetNodes = layer.find('.anchor-point');
	targetNodes.forEach((node) => {
		node.visible(false);
	});
	const targetRecs = layer.find('.anchor-point-rec');
	targetRecs.forEach((node) => {
		node.visible(false);
	});
}


export interface ArrowingContext {
	startNodeId: string;
	layer: Konva.Layer;
	stage: Konva.Stage;
	canvasDataStore: CanvasDataStore;
	userSettings: UserSettings
}

export class ArrowingFeature implements IFeature<ArrowingContext> {
	onActivated(context: ArrowingContext): () => void {
		dragArrow(context.startNodeId, context.layer, context.stage, context.canvasDataStore, context.userSettings);
		showAllAnchorPoint(context.layer);
		const cleanup = () => {
			removeAnchorPoint(context.layer);
		};
		return cleanup;
	}
}