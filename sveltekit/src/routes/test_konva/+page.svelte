<script lang="ts">
    import Konva from 'konva';
    import { onMount } from 'svelte';

    onMount(() => {
        const stage = new Konva.Stage({
            container: 'container',
            width: 800,
            height: 600
        });
    });
</script>

<div id="container">
    <h1>Test Konva</h1>
</div>