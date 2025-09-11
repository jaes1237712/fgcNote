<svelte:options customElement="numpad-editor" />

<script lang="ts">
	import { drawNumpadBlock } from '$lib/utils/canvas';
	import type { CanvasNumpadBlockDto } from '$lib/client';
	import type { DrawNumpadBlockConfig } from '$lib/utils/canvas';
	import type { UserSettings } from '$lib/userInterface';
	import { LAYOUT_SETTING } from '$lib/userInterface';
	import type { CONTROLLER_TYPE } from '$lib/utils/canvas/numpad/numpadCompiler';
	import Konva from 'konva';
	import { onMount } from 'svelte';
	import '$lib/component/SwitchControllerType.svelte';
	const {
		userSettings
	}: {
		userSettings: UserSettings;
	} = $props();
	let inputValue = $state<string>('');
	let controllerType = $state<CONTROLLER_TYPE>(userSettings.defaultControllerType);
	let previewStage: Konva.Stage;
	let previewLayer: Konva.Layer;
	let konvaNumpadPreviewContainer = $state<HTMLDivElement>();
	onMount(() => {
		previewStage = new Konva.Stage({
			container: konvaNumpadPreviewContainer,
			width: screen.width / 2,
			height: screen.height / 2
		});
		previewLayer = new Konva.Layer();
		previewStage.add(previewLayer);
	});
</script>

<div class="numpad-editor">
	<div class="numpad-editor-input">
		<label>
			<p>NUMPAD 指令</p>
			<input
				type="text"
				bind:value={inputValue}
				oninput={() => {
					previewLayer.destroyChildren();
					const previewId = 'preview';
					drawNumpadBlock({
						canvasNumpadBlock: {
							id: previewId,
							input: inputValue,
							type: controllerType,
							x: 0,
							y: 0
						},
						userSettings: userSettings,
						stage: previewStage,
						layer: previewLayer
					});
					$host().dispatchEvent(
						new CustomEvent('edit', {
							detail: {
								input: inputValue,
								type: controllerType
							}
						})
					);
				}}
			/>
		</label>
		<switch-controller-type
			isModern={controllerType == 'MODERN'}
			onswitchControllerType={(event) => {
				controllerType = event.detail.controllerType;
				previewLayer.destroyChildren();
				const previewId = 'preview';
				drawNumpadBlock({
					canvasNumpadBlock: {
						id: previewId,
						input: inputValue,
						type: controllerType,
						x: 0,
						y: 0
					},
					userSettings: userSettings,
					layer: previewLayer,
					stage: previewStage
				});
				$host().dispatchEvent(
					new CustomEvent('edit', {
						detail: {
							input: inputValue,
							type: controllerType
						}
					})
				);
			}}
		>
		</switch-controller-type>
	</div>
	<div class="preview-block">
		<p>預覽</p>
		<div class="konva-preview" bind:this={konvaNumpadPreviewContainer}></div>
	</div>
</div>

<style>
	.numpad-editor {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		.numpad-editor-input {
			width: 100%;
			display: flex;
			flex-direction: row;
			align-items: center;
			label {
				width: 80%;
				p {
					margin: 0;
				}
				input {
					font-size: x-large;
					width: 90%;
				}
			}
			switch-controller-type {
				width: 20%;
			}
		}
		.preview-block {
			width: 100%;
			display: flex;
			flex-direction: column;
			p {
				margin: 0;
				font-size: x-large;
			}
			.konva-preview {
				width: 50vw;
				height: 50vh;
				/* background-color: oklch(0.48 0.03 268.49); */
				/* border: 2px solid black; */
			}
		}
	}
</style>
