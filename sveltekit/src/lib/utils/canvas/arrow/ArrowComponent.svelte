<script lang="ts">
	import type { CanvasArrowDto } from '$lib/client';
	import Konva from 'konva';
	import { onDestroy, onMount } from 'svelte';
	let {
		layer,
		data
	}: {
		layer: Konva.Layer;
		data: CanvasArrowDto;
	} = $props();
	const startNode = layer.findOne('#' + data.startNodeId);
	const startAbsPos = startNode.getAbsolutePosition();
	const layerInverseTransform = layer.getAbsoluteTransform().copy().invert();
	const startLayerPos = layerInverseTransform.point(startAbsPos);
	let drawPoints = data.points;
	if (data.endNodeId) {
		const endNode = layer.findOne('#' + data.endNodeId);
		const endNodeAbsPos = endNode.getAbsolutePosition();
		const dx = endNodeAbsPos.x - startAbsPos.x;
		const dy = endNodeAbsPos.y - startAbsPos.y;
		drawPoints.pop();
		drawPoints.pop();
		drawPoints.push(dx);
		drawPoints.push(dy);
	}
	let arrow = $state<Konva.Arrow>();
	onMount(() => {
		arrow = new Konva.Arrow({
			x: startLayerPos.x,
			y: startLayerPos.y,
			points: drawPoints,
			id: data.id,
			startNodeId: data.startNodeId,
			endNodeId: data.endNodeId,
			fill: 'white',
			stroke: 'white'
		});
		layer.add(arrow);
	});
	onDestroy(()=>{
		arrow.destroy()
	})
</script>
