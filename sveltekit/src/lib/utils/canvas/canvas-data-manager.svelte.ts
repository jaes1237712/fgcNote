import {
	canvasControllerFindAllArrows,
	canvasControllerFindAllBlocks,
	canvasControllerFindAllCharacterMoveImages,
	type CanvasArrowDto,
	type CanvasCharacterMoveImageDto,
	type CanvasNumpadBlockDto,
	type CanvasStageDto,
	type CreateCanvasNumpadBlockDto,
	canvasControllerSyncNumpadBlocks,
	type CreateCanvasArrowDto,
	canvasControllerSyncArrows,
	type CreateCanvasCharacterMoveImageDto,
	type SyncCanvasCharacterMoveImagesDto,
	type SyncCanvasArrowsDto,
	type SyncCanvasNumpadBlocksDto,
	canvasControllerSyncCharacterMoveImages,
	type CanvasTextDto,
	type CreateCanvasTextDto,
	type SyncCanvasTextDto,
	canvasControllerSyncTexts
} from '$lib/client';
import type { UserSettings } from '$lib/userInterface';
import _, { debounce } from 'lodash';
import type { KonvaObjectManager } from './canvas-object-manager';
import { featureManager } from './canvas-feature-manager';

export type CanvasNodeData = CanvasNumpadBlockDto | CanvasCharacterMoveImageDto | CanvasArrowDto | CanvasTextDto; 
const NodeKindOrder = ['NUMPAD_BLOCK', 'CHARACTER_MOVE_IMAGE', 'ARROW'] as const;
type NodeKind = (typeof NodeKindOrder)[number];

export class CanvasDataStore {
	public nodesData = $state<Map<string, CanvasNodeData>>();
	public userSettings: UserSettings;
	public stageData = $state<CanvasStageDto>();
	public operating = $state<boolean>(false);
	public isSyncing = $state<boolean>(false);
	public lastSyncTime = $state<Date | null>(null);
	public konvaObjectManger: KonvaObjectManager

	public async SetStageDataAndFetchBackendData(data: CanvasStageDto): Promise<void> {
		this.stageData = data;
		this.nodesData = new Map();
		const blockResp = await canvasControllerFindAllBlocks({
			path: {
				stageId: data.id
			}
		});
		if (blockResp.data) {
			blockResp.data.forEach((block) => {
				this.addNodeData(block);
			});
		}
		const imageResp = await canvasControllerFindAllCharacterMoveImages({
			path: {
				stageId: data.id
			}
		});
		if (imageResp.data) {
			imageResp.data.forEach((image) => {
				this.addNodeData(image);
			});
		}
		const arrowResp = await canvasControllerFindAllArrows({
			path: {
				stageId: data.id
			}
		});
		if (arrowResp.data) {
			arrowResp.data.forEach((arrow) => {
				this.addNodeData(arrow);
			});
		}
		this.LegalizeNodesDate()
	}
	
	public setKonvaObjectManger(manager:KonvaObjectManager){
		this.konvaObjectManger = manager
	}

	// nodeData CRUD
	public addNodeData(nodeData: CanvasNodeData): CanvasNodeData {
		this.nodesData.set(nodeData.id,nodeData);
		console.log('nodeData:',nodeData)
		this.debouncedSync(this.stageData, this.nodesData)
		this.konvaObjectManger.createNode(nodeData)
		featureManager.deactivate()
		return nodeData;
	}

	public updateNodeData(nodeId: string, updates: Partial<CanvasNodeData>): void {
		const nodeData = this.nodesData.get(nodeId)
		if (nodeData) {
			Object.assign(nodeData, updates)
			this.debouncedSync(this.stageData, this.nodesData)
			this.konvaObjectManger.updateKonvaNode(nodeData)
		}
	}

	public putNodeData(nodeId: string, updates: Partial<CanvasNodeData>): void {
		const nodeDataCopy = {...this.nodesData.get(nodeId)}
		if (nodeDataCopy) {
			Object.assign(nodeDataCopy, updates)
			this.deleteNodeData(nodeId)
			this.addNodeData(nodeDataCopy)
			this.debouncedSync(this.stageData, this.nodesData)
		}
	}

	public deleteNodeData(nodeId: string):boolean{
		const targetNodeData = this.nodesData.get(nodeId)
		if(targetNodeData){
			if(this.nodesData.delete(nodeId)){
				this.konvaObjectManger.deleteNode(targetNodeData)
				this.LegalizeNodesDate()
				this.debouncedSync(this.stageData, this.nodesData)
				featureManager.deactivate()
				return true
			}
		}
		console.log('try to delete', targetNodeData)
		return false
	}

	public getNodeData(nodeId: string): CanvasNodeData | undefined {
		return this.nodesData.get(nodeId)
	}

	private debouncedSync = debounce(
		async (stageData: CanvasStageDto, nodesMapData: Map<string, CanvasNodeData>) => {
			this.isSyncing = true;
			const nodesData = Array.from(nodesMapData.values())
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
			const text = nodesData.filter((node) => node.kind === 'TEXT');
			const createTextDto: CreateCanvasTextDto[] = text.map(
				(image) => {
					const baseDto = _.omit(image, ['kind']);
					return {
						...baseDto,
						stageId: stageData.id
					};
				}
			);
			const syncTextPayload:SyncCanvasTextDto = {
				stageId: stageData.id,
				texts: createTextDto
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
				const syncTextResp = await canvasControllerSyncTexts({ body: syncTextPayload });
				if (syncTextResp.data) {
					console.log('Sync Text Data successfully', syncTextResp.data);
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

	

	private LegalizeNodesDate(): boolean{
		let affectedData:number = 0
		const copyData = new Map(this.nodesData)
		copyData.forEach((data)=>{
			if(data.kind === 'ARROW'){
				if(data.startNodeId){
					const anchorId = data.startNodeId
					// `${groupId}-anchor-point-${pos.orientation}`;
					const parts = anchorId.split('-anchor-point-');
					if (parts.length < 2) {
						console.warn(`警告: 字串 "${anchorId}" 格式不符預期，無法提取 groupId。`);
						return false; // 或者拋出錯誤，看你的錯誤處理策略
					  }
					const groupId = parts[0]
					if(!copyData.has(groupId)){
						if(this.deleteNodeData(data.id)){
							affectedData += 1
						}
						else{
							console.warn(`警告: 無法刪除arrow:${data}`);
						}
						
					}
				}
				if(data.endNodeId){
					const anchorId = data.endNodeId
					// `${groupId}-anchor-point-${pos.orientation}`;
					const parts = anchorId.split('-anchor-point-');
					if (parts.length < 2) {
						console.warn(`警告: 字串 "${anchorId}" 格式不符預期，無法提取 groupId。`);
						return false; // 或者拋出錯誤，看你的錯誤處理策略
					  }
					const groupId = parts[0]
					if(!this.nodesData.has(groupId)){
						if(this.deleteNodeData(data.id)){
							affectedData += 1
						}
						else{
							console.warn(`警告: 無法刪除arrow:${data}`);
						}
					}
				}
			}
		})
		console.log('LegalizeNodesData: Delete', affectedData)
		return true
	}
}