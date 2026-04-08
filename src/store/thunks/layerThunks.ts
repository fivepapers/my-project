import type { ThunkAction, Action } from '@reduxjs/toolkit';
import type { RootState } from '../../types';
import {
  bringForward,
  bringToFront,
  sendBackward,
  sendToBack,
} from '../slices/componentsSlice';
import { pushCommand } from '../slices/historySlice';

type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

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
