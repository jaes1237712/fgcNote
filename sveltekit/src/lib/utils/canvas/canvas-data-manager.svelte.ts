import {
	canvasControllerDeleteArrow,
	canvasControllerDeleteNumpadBlock,
	canvasControllerDeleteCharacterMoveImage,
	canvasControllerFindAllArrows,
	canvasControllerFindAllBlocks,
	canvasControllerFindAllCharacterMoveImages,
	type CanvasArrowDto,
	type CanvasCharacterMoveImageDto,
	type CanvasNumpadBlockDto,
	type CanvasStageDto,
	canvasControllerDeleteNumpadBlocksByStageId,
	canvasControllerDeleteArrowByStageId,
	canvasControllerDeleteCharacterMoveImagesByStageId,
	canvasControllerCreateNumpadBlocks,
	type CreateCanvasNumpadBlockDto,
	canvasControllerSyncNumpadBlocks,
	type CreateCanvasArrowDto,
	canvasControllerSyncArrows,
	type CreateCanvasCharacterMoveImageDto,
	type SyncCanvasCharacterMoveImagesDto,
	type SyncCanvasArrowsDto,
	type SyncCanvasNumpadBlocksDto,
	canvasControllerSyncCharacterMoveImages
} from '$lib/client';
import type { UserSettings } from '$lib/userInterface';
import _, { debounce } from 'lodash';
import { featureManager } from './canvas-feature-manager';

type CanvasNodeData = CanvasNumpadBlockDto | CanvasCharacterMoveImageDto | CanvasArrowDto;
const NodeKindOrder = ['NUMPAD_BLOCK', 'CHARACTER_MOVE_IMAGE', 'ARROW'] as const;
type NodeKind = (typeof NodeKindOrder)[number];

export class CanvasDataStore {
	public nodesData = $state<CanvasNodeData[]>([]);
	public nodesDataInDesiredOrder = $derived<CanvasNodeData[]>(
		this.getNodesInDesiredOrder(this.nodesData)
	);
	public userSettings: UserSettings;
	public stageData = $state<CanvasStageDto>();
	public operating = $state<boolean>(false);
	public isSyncing = $state<boolean>(false);
	public lastSyncTime = $state<Date | null>(null);

	public async setStageData(data: CanvasStageDto): Promise<void> {
		this.stageData = data;
		this.nodesData = [];
		const blockResp = await canvasControllerFindAllBlocks({
			path: {
				stageId: data.id
			}
		});
		if (blockResp.data) {
			blockResp.data.forEach((block) => {
				canvasDataStore.addNodeData(block);
			});
		}
		const imageResp = await canvasControllerFindAllCharacterMoveImages({
			path: {
				stageId: data.id
			}
		});
		if (imageResp.data) {
			imageResp.data.forEach((image) => {
				canvasDataStore.addNodeData(image);
			});
		}
		const arrowResp = await canvasControllerFindAllArrows({
			path: {
				stageId: data.id
			}
		});
		if (arrowResp.data) {
			arrowResp.data.forEach((arrow) => {
				canvasDataStore.addNodeData(arrow);
			});
		}
	}

	// nodeData CRUD
	public addNodeData(nodeData: CanvasNodeData): CanvasNodeData {
		this.nodesData.push(nodeData);
		return nodeData;
	}

	public updateNodeData(nodeId: string, updates: Partial<CanvasNodeData>): void {
		const nodeData = this.nodesData.find((node) => node.id === nodeId);
		if (nodeData) {
			Object.assign(nodeData, updates);
		}
		this.debouncedSync(this.stageData,this.nodesData)
	}

	public async deleteNodeData(nodeId: string): Promise<void> {
		
	}

	public getNodeData(nodeId: string): CanvasNodeData | undefined {
		return this.nodesData.find((node) => node.id === nodeId);
	}

	private debouncedSync = debounce(
		async (stageData: CanvasStageDto, nodesData: CanvasNodeData[]) => {
			this.isSyncing = true;
			const numpadBlocks = nodesData.filter((node) => node.kind === 'NUMPAD_BLOCK');
			const createNumpadBlockDtos: CreateCanvasNumpadBlockDto[] = numpadBlocks.map(
				(numpadBlock) => {
					const baseDto = _.omit(numpadBlock, ['kind']);
					return {
						...baseDto,
						stageId: stageData.id
					};
				}
			);
			const syncBlocksPayload: SyncCanvasNumpadBlocksDto = {
				stageId: stageData.id,
				blocks: createNumpadBlockDtos
			};
			const arrows = nodesData.filter((node) => node.kind === 'ARROW');
			const createArrowDtos: CreateCanvasArrowDto[] = arrows.map(
				(arrow) => {
					const baseDto = _.omit(arrow, ['kind']);
					return {
						...baseDto,
						stageId: stageData.id
					};
				}
			);
			const syncArrowsPayload: SyncCanvasArrowsDto = {
				stageId: stageData.id,
				arrows: createArrowDtos
			};
			const characterMoveImages = nodesData.filter((node) => node.kind === 'CHARACTER_MOVE_IMAGE');
			const createCanvasCharacterMoveImagesDto: CreateCanvasCharacterMoveImageDto[] = characterMoveImages.map(
				(image) => {
					const baseDto = _.omit(image, ['kind']);
					return {
						...baseDto,
						stageId: stageData.id
					};
				}
			);
			const syncCharacterMoveImagesPayload:SyncCanvasCharacterMoveImagesDto = {
				stageId: stageData.id,
				characterMoveImages: createCanvasCharacterMoveImagesDto
			};
			try {
				// 2. 呼叫新的單一同步 API
				// 假設你的 API 請求函數叫做 canvasControllerSyncNumpadBlocks
				const syncBlocksResp = await canvasControllerSyncNumpadBlocks({ body: syncBlocksPayload });
				if (syncBlocksResp.data) {
					console.log('Sync numpadBlockData successfully', syncBlocksResp.data);
				} else {
					// 這種情況比較少見，通常是網路層或服務器層的非預期錯誤
					alert('Sync failed: No response data.');
				}
				const syncArrowsResp = await canvasControllerSyncArrows({ body: syncArrowsPayload });
				if (syncArrowsResp.data) {
					console.log('Sync Arrow Data successfully', syncArrowsResp.data);
				} else {
					// 這種情況比較少見，通常是網路層或服務器層的非預期錯誤
					alert('Sync failed: No response data.');
				}
				const syncMoveImagesResp = await canvasControllerSyncCharacterMoveImages({ body: syncCharacterMoveImagesPayload });
				if (syncMoveImagesResp.data) {
					console.log('Sync characterMoveImage successfully', syncMoveImagesResp.data);
				} else {
					// 這種情況比較少見，通常是網路層或服務器層的非預期錯誤
					alert('Sync failed: No response data.');
				}
			} catch (error) {
				// 3. 統一處理錯誤
				// 因為後端是交易式的，任何失敗都會導致 rollback，所以前端不需要擔心資料不一致的問題
				console.error('Sync numpadBlockData failed:', error);
				alert(
					'Sync numpadBlockData not successfully. The data has been rolled back to its previous state.'
				);
			} finally {
				this.isSyncing = false;
			}
		},
		1000
	);

	private getNodesInDesiredOrder(allNodes: CanvasNodeData[]): CanvasNodeData[] {
		// 1. 從 Map 中獲取所有值 (CanvasNodeData 實例)

		// 2. 定義一個 kind 到其順序索引的映射
		const kindOrderMap: Record<NodeKind, number> = {
			NUMPAD_BLOCK: 0,
			CHARACTER_MOVE_IMAGE: 1,
			ARROW: 2
		};

		// 3. 根據 kind 屬性進行排序
		allNodes.sort((a, b) => {
			const orderA = kindOrderMap[a.kind];
			const orderB = kindOrderMap[b.kind];

			if (orderA === undefined || orderB === undefined) {
				// 處理未定義 kind 的情況，或者拋出錯誤
				// 這裡簡單地將未定義的 kind 放在後面
				if (orderA === undefined) return 1;
				if (orderB === undefined) return -1;
			}

			return orderA - orderB;
		});

		return allNodes;
	}
}

export const canvasDataStore = new CanvasDataStore();
