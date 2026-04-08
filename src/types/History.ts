import type { Component, ComponentStyle } from './Component';

/** 可序列化的历史命令（Command 模式），替代整画布快照 */
export type HistoryCommand =
  | {
      kind: 'add';
      component: Component;
    }
  | {
      kind: 'update';
      id: string;
      prevProps: Record<string, unknown>;
      prevStyle: ComponentStyle;
      nextProps: Record<string, unknown>;
      nextStyle: ComponentStyle;
    }
  | {
      kind: 'remove';
      rootId: string;
      nodesById: Record<string, Component>;
      orderedIds: string[];
      parentId: string;
      insertIndex: number;
      startIndexAllIds: number;
    }
  | {
      kind: 'moveStyle';
      id: string;
      prevLeft: number;
      prevTop: number;
      nextLeft: number;
      nextTop: number;
      markedAt: number;
    }
  | {
      /** 粘贴操作：保存完整组件快照，undo 时删除，redo 时恢复 */
      kind: 'paste';
      components: Component[];
    }
  | {
      /** 图层顺序变更：保存操作前后的 allIds 排列 */
      kind: 'layer';
      prevAllIds: string[];
      nextAllIds: string[];
      prevZIndexMap: Record<string, number>;
      nextZIndexMap: Record<string, number>;
    };

export interface HistoryState {
  past: HistoryCommand[];
  future: HistoryCommand[];
}
