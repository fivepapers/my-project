import type { ThunkAction, Action } from '@reduxjs/toolkit';
import { cloneDeep } from 'lodash';
import { nanoid } from 'nanoid';
import type { Component, ComponentStyle, ComponentType, HistoryCommand, RootState } from '../types';
import { executeCommand, undoCommand } from './commands/registry';
import { CANVAS_ROOT_ID } from './constants';
import {
  addComponent,
  bringForward,
  bringToFront,
  pasteComponents,
  removeComponent,
  sendBackward,
  sendToBack,
  updateProps,
} from './slices/componentsSlice';
import { setClipboard } from './slices/clipboardSlice';
import { selectComponent, setHovered } from './slices/selectionSlice';
import { popFutureToPast, popPastToFuture, pushCommand } from './slices/historySlice';
import { syncSelectionToGraph } from './syncSelection';

type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

function collectSubtreeIds(rootId: string, byId: Record<string, Component>): string[] {
  const out: string[] = [];
  function dfs(cid: string) {
    out.push(cid);
    byId[cid]?.childIds.forEach(dfs);
  }
  dfs(rootId);
  return out;
}

function buildRemoveCommand(state: RootState, id: string): HistoryCommand | null {
  if (id === CANVAS_ROOT_ID) return null;
  const node = state.components.byId[id];
  if (!node) return null;
  const { components } = state;
  const byId = components.byId;
  const allIds = components.allIds;
  let orderedIds = collectSubtreeIds(id, byId);
  orderedIds = [...orderedIds].sort((a, b) => allIds.indexOf(a) - allIds.indexOf(b));
  const indices = orderedIds.map((oid) => allIds.indexOf(oid)).filter((i) => i >= 0);
  if (indices.length === 0) return null;
  const startIndexAllIds = Math.min(...indices);
  const parentId = node.parentId!;
  const parent = byId[parentId];
  const insertIndex = parent.childIds.indexOf(id);
  const nodesById: Record<string, Component> = {};
  for (const oid of orderedIds) {
    nodesById[oid] = cloneDeep(byId[oid]!);
  }
  return {
    kind: 'remove',
    rootId: id,
    nodesById,
    orderedIds,
    parentId,
    insertIndex,
    startIndexAllIds,
  };
}

export function validateCanvasState(state: RootState): boolean {
  const { byId, allIds, rootId } = state.components;
  const seen = new Set<string>();
  for (const id of allIds) {
    if (seen.has(id)) return false;
    seen.add(id);
  }
  for (const [id, component] of Object.entries(byId)) {
    if (component.parentId) {
      const parent = byId[component.parentId];
      if (!parent) return false;
      if (!parent.childIds.includes(id)) return false;
    }
    if (id === rootId && component.parentId !== null) return false;
  }
  return true;
}

export function undoHistory(): AppThunk {
  return (dispatch, getState) => {
    const state = getState();
    if (state.history.past.length === 0) return;
    const cmd = state.history.past[state.history.past.length - 1]!;
    undoCommand(cmd, dispatch, getState);
    dispatch(popPastToFuture());
    if (import.meta.env.DEV && !validateCanvasState(getState())) {
      console.warn('[history] invalid canvas after undo');
    }
  };
}

export function redoHistory(): AppThunk {
  return (dispatch, getState) => {
    const state = getState();
    if (state.history.future.length === 0) return;
    const cmd = state.history.future[state.history.future.length - 1]!;
    executeCommand(cmd, dispatch, getState);
    dispatch(popFutureToPast());
    if (import.meta.env.DEV && !validateCanvasState(getState())) {
      console.warn('[history] invalid canvas after redo');
    }
  };
}

export function commitAddComponent(payload: {
  type: ComponentType;
  parentId?: string;
  position?: { left: number; top: number };
  id?: string;
}): AppThunk {
  return (dispatch, getState) => {
    const id = payload.id ?? nanoid();
    dispatch(addComponent({ ...payload, id }));
    dispatch(selectComponent([id]));
    dispatch(setHovered(null));
    const comp = getState().components.byId[id];
    if (comp) {
      dispatch(pushCommand({ kind: 'add', component: cloneDeep(comp) }));
    }
  };
}

export function commitRemoveComponent(id: string): AppThunk {
  return (dispatch, getState) => {
    const cmd = buildRemoveCommand(getState(), id);
    if (!cmd) return;
    dispatch(removeComponent(id));
    syncSelectionToGraph(dispatch, getState);
    dispatch(pushCommand(cmd));
  };
}

export function commitUpdateProps(payload: {
  id: string;
  props?: Record<string, unknown>;
  style?: Partial<ComponentStyle>;
}): AppThunk {
  return (dispatch, getState) => {
    const prev = getState().components.byId[payload.id];
    if (!prev || payload.id === CANVAS_ROOT_ID) return;
    const prevProps = cloneDeep(prev.props);
    const prevStyle = cloneDeep(prev.style);
    dispatch(
      updateProps({
        id: payload.id,
        props: payload.props,
        style: payload.style,
      }),
    );
    const next = getState().components.byId[payload.id];
    if (!next) return;
    dispatch(
      pushCommand({
        kind: 'update',
        id: payload.id,
        prevProps,
        prevStyle,
        nextProps: cloneDeep(next.props),
        nextStyle: cloneDeep(next.style),
      }),
    );
  };
}

export function commitMoveStyle(payload: { id: string; delta: { x: number; y: number } }): AppThunk {
  return (dispatch, getState) => {
    const { id, delta } = payload;
    if (delta.x === 0 && delta.y === 0) return;
    const node = getState().components.byId[id];
    if (!node || id === CANVAS_ROOT_ID) return;
    const prevLeft = node.style.left;
    const prevTop = node.style.top;
    dispatch(
      updateProps({
        id,
        style: { left: prevLeft + delta.x, top: prevTop + delta.y },
      }),
    );
    const next = getState().components.byId[id];
    if (!next) return;
    dispatch(
      pushCommand({
        kind: 'moveStyle',
        id,
        prevLeft,
        prevTop,
        nextLeft: next.style.left,
        nextTop: next.style.top,
        markedAt: Date.now(),
      }),
    );
  };
}

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

function makeLayerThunk(
  action: (id: string) => { type: string; payload: string },
): (id: string) => AppThunk {
  return (id: string) => (dispatch, getState) => {
    const { components } = getState();
    const prevAllIds = [...components.allIds];
    const prevZIndexMap: Record<string, number> = {};
    for (const cid of prevAllIds) {
      prevZIndexMap[cid] = components.byId[cid]?.zIndex ?? 0;
    }

    dispatch(action(id));

    const nextState = getState();
    const nextAllIds = [...nextState.components.allIds];
    const nextZIndexMap: Record<string, number> = {};
    for (const cid of nextAllIds) {
      nextZIndexMap[cid] = nextState.components.byId[cid]?.zIndex ?? 0;
    }

    dispatch(
      pushCommand({
        kind: 'layer',
        prevAllIds,
        nextAllIds,
        prevZIndexMap,
        nextZIndexMap,
      }),
    );
  };
}

export const commitBringToFront = makeLayerThunk(bringToFront);
export const commitSendToBack = makeLayerThunk(sendToBack);
export const commitBringForward = makeLayerThunk(bringForward);
export const commitSendBackward = makeLayerThunk(sendBackward);
