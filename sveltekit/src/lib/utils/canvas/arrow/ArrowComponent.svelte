<script lang="ts">
	import type { CanvasArrowDto } from '$lib/client';
	import type { UserSettings } from '$lib/userInterface';
    import Konva from 'konva';
    let { layer, data}: {
        layer: Konva.Layer, 
        data: CanvasArrowDto
    } = $props();
    const startNode = layer.findOne('#' + data.startNodeId);

</script>