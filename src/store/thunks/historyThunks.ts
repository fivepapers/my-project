import type { ThunkAction, Action } from '@reduxjs/toolkit';
import type { RootState } from '../../types';
import { executeCommand, undoCommand } from '../commands/registry';
import { validateCanvasState } from '../services/componentTree';
import { popFutureToPast, popPastToFuture } from '../slices/historySlice';

type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;

export function undoHistory(): AppThunk {
  return (dispatch, getState) => {
    const state = getState();
    if (state.history.past.length === 0) return;
    const cmd = state.history.past[state.history.past.length - 1]!;
    undoCommand(cmd, dispatch, getState);
    dispatch(popPastToFuture());
    if (import.meta.env.DEV && !validateCanvasState(getState().components)) {
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
    if (import.meta.env.DEV && !validateCanvasState(getState().components)) {
      console.warn('[history] invalid canvas after redo');
    }
  };
}
