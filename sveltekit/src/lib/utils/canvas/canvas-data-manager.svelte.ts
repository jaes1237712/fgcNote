import { canvasControllerDeleteArrow, canvasControllerDeleteBlock, canvasControllerDeleteCharacterMoveImage, type CanvasArrowDto, type CanvasCharacterMoveImageDto, type CanvasNumpadBlockDto, type CanvasStageDto } from "$lib/client"
import type { UserSettings } from "$lib/userInterface"
import { featureManager } from "./canvas-feature-manager"

type CanvasNodeData = CanvasNumpadBlockDto | CanvasCharacterMoveImageDto | CanvasArrowDto
const NodeKindOrder = ['NUMPAD_BLOCK', 'CHARACTER_MOVE_IMAGE', 'ARROW'] as const;
type NodeKind = typeof NodeKindOrder[number];

export class CanvasDataStore{
    public nodesData: Map<string, CanvasNodeData> = new Map()
    public nodesDataInDesiredOrder = $state<CanvasNodeData[]>([])
    public userSettings: UserSettings 
    public stageData  = $state<CanvasStageDto>()
    public operating: boolean = false
    // nodeData CRUD
    public addNodeData(nodeData: CanvasNodeData): CanvasNodeData{
        this.nodesData.set(nodeData.id, nodeData);
        this.nodesDataInDesiredOrder = this.getNodesInDesiredOrder();
        return nodeData
    }

    public updateNodeData(nodeId: string, updates: Partial<CanvasNodeData>): void {
        const nodeData = this.nodesData.get(nodeId);
        if (nodeData) {
            Object.assign(nodeData, updates);
        }
    }

    public async deleteNodeData(nodeId: string): Promise<void>{
        // the side effect of delete will be hold by backend
        // backend will return the side effect to frontend.
        const nodeData = this.nodesData.get(nodeId);
        if(!nodeData){
            return 
        }    
        this.operating = true;
        const kind = nodeData.kind
        let deletePromise: Promise<any>; // 用來存儲刪除操作的 Promise
        switch (kind) {
            case 'NUMPAD_BLOCK':
                deletePromise = canvasControllerDeleteBlock({ path: { blockId: nodeData.id } });
                break;
            case 'ARROW':
                deletePromise = canvasControllerDeleteArrow({ path: { arrowId: nodeData.id } });
                break;
            case 'CHARACTER_MOVE_IMAGE':
                deletePromise = canvasControllerDeleteCharacterMoveImage({ path: { canvasCharacterMoveImageID: nodeData.id } });
                break;
            default:
                return; // 未知的 kind，直接返回
        }
        deletePromise
        .then((data) => {
            data.data.deletedEntityIds.forEach((id) => {
                this.nodesData.delete(id);
            });
        })
        .catch((error) => {
            console.error('刪除失敗:', error);
        })
        .finally(() => {
            this.nodesDataInDesiredOrder = this.getNodesInDesiredOrder();
            this.operating = false
        });
    }

    public getNodeData(nodeId: string): CanvasNodeData | undefined{
        return this.nodesData.get(nodeId);
    }

    public syncToBackend(): void{

    }

    private getNodesInDesiredOrder(): CanvasNodeData[] {
        // 1. 從 Map 中獲取所有值 (CanvasNodeData 實例)
        const allNodes = Array.from(this.nodesData.values());

        // 2. 定義一個 kind 到其順序索引的映射
        const kindOrderMap: Record<NodeKind, number> = {
            'NUMPAD_BLOCK': 0,
            'CHARACTER_MOVE_IMAGE': 1,
            'ARROW': 2,
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

export const canvasDataStore = new CanvasDataStore()