import type { ThunkAction, Action } from '@reduxjs/toolkit';
import { cloneDeep } from 'lodash';
import { nanoid } from 'nanoid';
import type { Component, RootState } from '../../types';
import { CANVAS_ROOT_ID } from '../constants';
import { pasteComponents } from '../slices/componentsSlice';
import { setClipboard } from '../slices/clipboardSlice';
import { selectComponent, setHovered } from '../slices/selectionSlice';
import { pushCommand } from '../slices/historySlice';

type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

export function copySelected(): AppThunk {
  return (dispatch, getState) => {
    const { selectedIds } = getState().selection;
    if (selectedIds.length === 0) return;
    dispatch(setClipboard({ componentIds: [...selectedIds] }));
  };
}

export function commitPaste(): AppThunk {
  return (dispatch, getState) => {
    const state = getState();
    const clipboard = state.clipboard;
    const { components } = state;
    if (!clipboard || clipboard.componentIds.length === 0) return;

    const cloned: Component[] = [];
    for (const srcId of clipboard.componentIds) {
      const src = components.byId[srcId];
      if (!src || srcId === CANVAS_ROOT_ID) continue;
      const newComp = cloneDeep(src);
      newComp.id = nanoid();
      newComp.style.left += 16;
      newComp.style.top += 16;
      newComp.childIds = [];
      newComp.parentId = CANVAS_ROOT_ID;
      cloned.push(newComp);
    }
    if (cloned.length === 0) return;

    dispatch(pasteComponents({ components: cloned, parentId: CANVAS_ROOT_ID }));
    dispatch(selectComponent(cloned.map((c) => c.id)));
    dispatch(setHovered(null));
    dispatch(pushCommand({ kind: 'paste', components: cloneDeep(cloned) }));
  };
}
