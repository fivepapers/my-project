import type { ThunkAction, Action } from '@reduxjs/toolkit';
import { cloneDeep } from 'lodash';
import { nanoid } from 'nanoid';
import type { ComponentStyle, ComponentType, RootState } from '../../types';
import { CANVAS_ROOT_ID } from '../constants';
import { buildRemoveCommand } from '../services/componentTree';
import {
  addComponent,
  removeComponent,
  updateProps,
} from '../slices/componentsSlice';
import { selectComponent, setHovered } from '../slices/selectionSlice';
import { pushCommand } from '../slices/historySlice';
import { syncSelectionToGraph } from '../syncSelection';

type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

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
    const cmd = buildRemoveCommand(getState().components, id);
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
