import {
	type CanvasArrowAnchorDto,
	type CanvasArrowDto,
} from '$lib/client';
import Konva from 'konva';
import { featureManager, type IFeature } from '../canvas-feature-manager';
import type { CanvasDataStore } from '../canvas-data-manager.svelte';
import type { UserSettings } from '$lib/userInterface';

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

export interface DrawArrowConfig {
	canvasArrow: CanvasArrowDto;
}

export function drawArrow(config: DrawArrowConfig, layer: Konva.Layer, userSettings: UserSettings) {
	const { canvasArrow } = config;
	
	// Calculate points from anchorNodesId
	const points: number[] = [];
	const layerInverseTransform = layer.getAbsoluteTransform().copy().invert();
	// const startAnchorNode = layer.findOne('#' + canvasArrow.anchorNodesId[0]);
	// const startPos = startAnchorNode.getAbsolutePosition()
	// Get positions of all anchor nodes
	for (const anchorNodeId of canvasArrow.anchorNodesId) {
		const anchorNode = layer.findOne('#' + anchorNodeId);
		// console.log(anchorNode)
		if (anchorNode) {
			const anchorAbsPos = anchorNode.getAbsolutePosition();
			const anchorLayerPos = layerInverseTransform.point(anchorAbsPos);
			points.push(anchorLayerPos.x, anchorLayerPos.y);
		}
	}
	
	// If we have at least 2 anchor points, create the arrow
	if (points.length >= 4) {
		// Set the arrow position to the first anchor point
		const startX = points[0];
		const startY = points[1];
		
		// Convert relative points (relative to start position)
		const relativePoints = [0,0];
		for (let i = 2; i < points.length; i += 2) {
			relativePoints.push(points[i] - startX, points[i + 1] - startY);
		}
		
		const arrow = new Konva.Arrow({
			x: startX,
			y: startY,
			points: relativePoints,
			id: canvasArrow.id,
			anchorNodesId: canvasArrow.anchorNodesId,
			fill: 'white',
			stroke: 'white',
			strokeWidth: 5,
			// hitStrokeWidth: 20
		});
		layer.add(arrow);
		return arrow;
	}
	
	return null;
}

function dragArrow(startNodeId: string, tempNodeId:string, layer: Konva.Layer, stage: Konva.Stage, canvasDataStore: CanvasDataStore, userSettings: UserSettings) {
	// Initialize with start node and temp anchor
	let currentAnchorNodesId = [startNodeId, tempNodeId];

	// Create a temp anchor node that follows the mouse
	const tempAnchor = new Konva.Circle({
		radius: 4,
		fill: 'white',
		stroke: 'none',
		id: tempNodeId,
		name: 'temp-anchor-point',
		visible: true
	});
	layer.add(tempAnchor);

	// Initialize temp anchor at current mouse position
	const initialPointer = stage.getRelativePointerPosition();
	if (initialPointer) {
		tempAnchor.setAbsolutePosition({ x: initialPointer.x, y: initialPointer.y });
	}

	let currentArrow = drawArrow(
		{
			canvasArrow: {
				kind: 'ARROW',
				id: 'temp-arrow',
				anchorNodesId: currentAnchorNodesId
			}
		},
		layer,
		userSettings
	);

	if (!currentArrow) return;

	layer.add(currentArrow);
	const anchorNodes = layer.find('.anchor-point');
	const ANCHOR_SNAP_THRESHOLD = 20; // 吸附半徑 (像素)

	stage.on('mousemove', function () {
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

		if (closestAnchorId) {
			// Snap to real anchor: hide temp anchor
			tempAnchor.visible(false);
			currentAnchorNodesId = [startNodeId, closestAnchorId];
		} else {
			// No snap: show and move temp anchor to mouse
			tempAnchor.visible(true);
			tempAnchor.setAbsolutePosition({ x: mouseAbsolutePos.x, y: mouseAbsolutePos.y });
			currentAnchorNodesId = [startNodeId, tempNodeId];
		}

		// Redraw arrow with updated anchor nodes
		currentArrow.destroy();
		currentArrow = drawArrow(
			{
				canvasArrow: {
					kind: 'ARROW',
					id: 'temp-arrow',
					anchorNodesId: currentAnchorNodesId
				}
			},
			layer,
			userSettings
		);
		if (currentArrow) {
			layer.add(currentArrow);
		}
	});

	stage.on('mouseup', function (event) {
		event.cancelBubble = true;
		const snapped = !currentAnchorNodesId.includes(tempNodeId);
		if (snapped) {
			const new_id = crypto.randomUUID()
			const new_data: CanvasArrowDto = {
				kind:'ARROW',
				id: new_id,
				anchorNodesId: currentAnchorNodesId
			}
			canvasDataStore.addNodeData(new_data)
		}
		else{
			const newAnchorId = crypto.randomUUID()
			const newArrowId = crypto.randomUUID()
			const mouseAbsolutePos = stage.getRelativePointerPosition();
			const newArrowAnchor: CanvasArrowAnchorDto = {
				kind:'ARROW_ANCHOR',
				id: newAnchorId,
				arrowId: newArrowId,
				x:mouseAbsolutePos.x/userSettings.viewportWidthUnit,
				y:mouseAbsolutePos.y/userSettings.viewportHeightUnit,
				stageId: stage.id(),
			}
			const newArrow: CanvasArrowDto ={
				kind:'ARROW',
				id:newArrowId,
				anchorNodesId: [currentAnchorNodesId[0], newAnchorId]
			}
			canvasDataStore.addNodeData(newArrowAnchor)
			canvasDataStore.addNodeData(newArrow)
		}
		// cleanup
		if (currentArrow) currentArrow.destroy();
		tempAnchor.destroy();
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
	startNodeId: string; // Keep this for backward compatibility with drag start
	layer: Konva.Layer;
	stage: Konva.Stage;
	canvasDataStore: CanvasDataStore;
	userSettings: UserSettings
}

export class ArrowingFeature implements IFeature<ArrowingContext> {
	onActivated(context: ArrowingContext): () => void {
		dragArrow(context.startNodeId,"temp-anchor-point", context.layer, context.stage, context.canvasDataStore, context.userSettings);
		showAllAnchorPoint(context.layer);
		const cleanup = () => {
			removeAnchorPoint(context.layer);
		};
		return cleanup;
	}
}

// export interface ArrowSelectContext{
// 	arrowData: CanvasArrowDto;
// 	layer: Konva.Layer;
// }

// export class ArrowSelectFeature implements IFeature<ArrowSelectContext>{
// 	onActivated(context: ArrowSelectContext): () => void {
// 		// Show anchor points for all nodes in the arrow's anchorNodesId
// 		context.arrowData.anchorNodesId.forEach(nodeId => {
// 			showSpecificAnchorPoint(nodeId, context.layer, context.layer.getStage());
// 		});
		
// 		const cleanup = () => {
// 			// Hide anchor points when selection is cleared
// 			removeAnchorPoint(context.layer);
// 		};
// 		return cleanup;
// 	}
// }