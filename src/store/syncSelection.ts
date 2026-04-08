import type { Dispatch } from '@reduxjs/toolkit';
import type { RootState } from '../types';
import { selectComponent, setHovered } from './slices/selectionSlice';

/** 在组件图变更后，剔除已不存在节点的选中与悬停 */
export function syncSelectionToGraph(
  dispatch: Dispatch,
  getState: () => RootState,
): void {
  const { components, selection } = getState();
  const selectedIds = selection.selectedIds.filter((sid) => components.byId[sid]);
  const hoveredId =
    selection.hoveredId && components.byId[selection.hoveredId] ? selection.hoveredId : null;
  dispatch(selectComponent(selectedIds));
  dispatch(setHovered(hoveredId));
}
