export type EditorMode = 'edit' | 'preview';
export type DeviceType = 'pc' | 'mobile' | 'tablet';

/** 剪贴板：当前仅支持复制选中的组件 id（剪切可后续扩展） */
export interface ClipboardState {
  componentIds: string[];
}

export interface EditorState {
  mode: EditorMode;
  device: DeviceType;
  zoom: number;
  gridVisible: boolean;
}

export interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
}
