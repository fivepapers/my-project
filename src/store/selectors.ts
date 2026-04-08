import { createSelector } from '@reduxjs/toolkit';
import type { Component, RootState } from '../types';

export const selectRootId = (s: RootState) => s.components.rootId;

export const selectRootNode = createSelector(
  [(s: RootState) => s.components.rootId, (s: RootState) => s.components.byId],
  (rootId, byId) => byId[rootId],
);

export function selectComponentById(state: RootState, id: string): Component | undefined {
  return state.components.byId[id];
}

export const selectEditorMode = (s: RootState) => s.editor.mode;

export const selectIsPreview = (s: RootState) => s.editor.mode === 'preview';

export const selectZoom = (s: RootState) => s.editor.zoom;

export const selectGridVisible = (s: RootState) => s.editor.gridVisible;

export const selectDevice = (s: RootState) => s.editor.device;

export const selectSelectedIds = (s: RootState) => s.selection.selectedIds;

export const selectFirstSelectedId = (s: RootState) => s.selection.selectedIds[0];

export const selectHoveredId = (s: RootState) => s.selection.hoveredId;

export const selectCanUndo = (s: RootState) => s.history.past.length > 0;

export const selectCanRedo = (s: RootState) => s.history.future.length > 0;

export const selectHasClipboard = createSelector(
  [(s: RootState) => s.clipboard?.componentIds.length ?? 0],
  (len) => len > 0,
);

/** 当前选中的第一个组件（单选/多选时取第一个）；无选中为 `undefined` */
export const selectPrimarySelectedComponent = createSelector(
  [selectSelectedIds, (s: RootState) => s.components.byId],
  (ids, byId): Component | undefined => (ids[0] ? byId[ids[0]!] : undefined),
);
