/**
 * 组件类型改为运行时字符串，具体可用类型由 registry 决定。
 * 这样后续新增组件或接入 AI 生成时不需要再改 TS union。
 */
export type ComponentType = string;

export interface ComponentStyle {
  width: number;
  height: number;
  left: number;
  top: number;
  position: 'absolute' | 'relative';
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  borderRadius?: number;
}

export interface Component {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  style: ComponentStyle;
  childIds: string[];
  parentId: string | null;
  zIndex: number;
}

export interface ComponentsState {
  byId: Record<string, Component>;
  allIds: string[];
  rootId: string;
}
