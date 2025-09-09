export type FeatureType = 'transformer' | 'anchor-points' | 'arrowing'

export interface IFeature<TContext>{
    onActivated(context: TContext): () => void;    
}

class FeatureManager {
    public activeFeature:{
        type: FeatureType;
        targetId: string;
        cleanupCallback: () => void;
    }| null = null;

    /**
     * 激活一個新的功能。如果已經有活動功能，它會先被清理。
     * @template TContext - 該功能激活時所需的上下文類型。
     * @param featureType - 識別此功能類型的字串。
     * @param targetId - 該功能作用的 Konva 節點的 ID。
     * @param featureInstance - 實現 IFeature 介面的功能實例。
     * @param context - 激活功能時提供給 onActivate 方法的上下文數據。
     */
    public activate<TContext>(
        featureType: FeatureType,
        targetId: string,
        featureInstance: IFeature<TContext>,
        context: TContext
    ): void {
        // 1. 如果當前有活動功能，並且它與即將激活的功能不同（類型或目標不同），則先清理它。
        if (this.activeFeature) {
            // 避免點擊同一個已啟動的物件導致不必要的清理和重啟
            if (this.activeFeature.targetId === targetId && this.activeFeature.type === featureType) {
                console.log(`Feature ${featureType} on ${targetId} is already active. No action needed.`);
                return;
            }
            console.log(`Deactivating previous feature: ${this.activeFeature.type} on ${this.activeFeature.targetId}`);
            this.activeFeature.cleanupCallback(); // 呼叫舊功能的清理函數
        }

        console.log(`Activating new feature: ${featureType} on ${targetId}`);
        // 2. 啟動新功能，並獲取它的清理回呼
        const cleanupCallback = featureInstance.onActivated(context);

        // 3. 更新 activeFeature 狀態
        this.activeFeature = {
            type: featureType,
            targetId: targetId,
            cleanupCallback: cleanupCallback
        };
    }

    /**
     * 清理並停用當前所有活動的功能。
     * 例如：當使用者點擊畫布空白處時呼叫。
     */
    public deactivate(): void {
        if (this.activeFeature) {
            console.log(`Deactivating current feature: ${this.activeFeature.type} on ${this.activeFeature.targetId}`);
            this.activeFeature.cleanupCallback(); // 呼叫清理函數
            this.activeFeature = null; // 清空活動功能
        } else {
            console.log('No active feature to deactivate.');
        }
    }

    /**
     * 檢查是否有特定類型和目標的功能處於活動狀態。
     */
    public isActive(featureType: FeatureType, targetId: string): boolean {
        return this.activeFeature?.type === featureType && this.activeFeature?.targetId === targetId;
    }

    /**
     * 檢查是否有任何功能處於活動狀態。
     */
    public hasActiveFeature(): boolean {
        return this.activeFeature !== null;
    }
}

export const featureManager = new FeatureManager();
