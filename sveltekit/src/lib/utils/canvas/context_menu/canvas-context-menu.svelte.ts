import { DeleteIcon, EditIcon, ImageIcon, Plus, Text, Video } from '@lucide/svelte';

export type ContextMenuOption = {
	id: string;
	label: string;
	icon: typeof Plus;
};

export type ContextMenuTargetType = 'stage' | 'numpadBlock' | 'characterMoveImage' | 'text' | 'video';

class ContextMenuStore {
	// 使用 $state() 來宣告響應式狀態變數 (類似 Vue 的 ref 或 React 的 useState)
	// 這裡的 $state 是一個 "rune"，用來標記這個 class 屬性是響應式的。
	visible = $state(false);
	position = $state({ x: 0, y: 0 });
	targetType = $state<ContextMenuTargetType>('stage'); // 明確指定型別並賦予初始值
	targetId = $state(''); // 初始值為空字串

	// 使用 $derived() 來宣告響應式衍生值
	// 它會自動追蹤 this.targetType 的變化並重新計算
	options = $derived(getContextMenuOptions(this.targetType));

	// 你可以添加方法來修改狀態，這些方法會觸發 UI 更新
	show(x: number, y: number, type: ContextMenuTargetType, id?: string) {
		this.position = { x, y }; // 觸發響應式更新
		this.targetType = type; // 觸發響應式更新
		this.targetId = id || ''; // 觸發響應式更新
		this.visible = true; // 觸發響應式更新
	}

	hide() {
		this.visible = false;
	}
}

const STAGE_OPTIONS: ContextMenuOption[] = [
	{ id: 'insert-block', label: '新增連段', icon: Plus },
	{ id: 'insert-image', label: '新增圖片', icon: ImageIcon },
	{id:'insert-text', label:'新增文字', icon: Text},
	{id:'insert-video', label:'新增影片', icon: Video}
];

const NUMPAD_BLOCK_OPTIONS: ContextMenuOption[] = [
	{ id: 'edit-block', label: '編輯連段', icon: EditIcon },
	{ id: 'delete-block', label: '刪除連段', icon: DeleteIcon }
];

const CHARACTER_MOVE_IMAGES_OPTIONS: ContextMenuOption[] = [
	{ id: 'delete-image', label: '刪除圖片', icon: DeleteIcon }
];

const TEXT_OPTIONS: ContextMenuOption[] = [
	{ id: 'delete-text', label: '刪除文字', icon: DeleteIcon }
];

const VIDEO_OPTIONS: ContextMenuOption[] = [
	{ id: 'delete-video', label: '刪除影片', icon: DeleteIcon }
];

function getContextMenuOptions(targetType: ContextMenuTargetType) {
	switch (targetType) {
		case 'stage':
			return STAGE_OPTIONS;
		case 'numpadBlock':
			return NUMPAD_BLOCK_OPTIONS;
		case 'characterMoveImage':
			return CHARACTER_MOVE_IMAGES_OPTIONS;
		case 'text':
			return TEXT_OPTIONS;
		case 'video':
			return VIDEO_OPTIONS
	}
}

export const contextMenuState = new ContextMenuStore();
