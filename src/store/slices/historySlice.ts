import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { HistoryCommand } from '../../types';

const MAX_PAST = 50;

const MOVE_MERGE_MS = 300;

function tryMerge(last: HistoryCommand, next: HistoryCommand): HistoryCommand | null {
  if (last.kind === 'update' && next.kind === 'update' && last.id === next.id) {
    return { ...last, nextProps: next.nextProps, nextStyle: next.nextStyle };
  }
  if (last.kind === 'moveStyle' && next.kind === 'moveStyle' && last.id === next.id) {
    const now = Date.now();
    if (now - last.markedAt > MOVE_MERGE_MS) return null;
    return { ...last, nextLeft: next.nextLeft, nextTop: next.nextTop, markedAt: now };
  }
  // 连续图层操作合并为一次（保持最初的 prev 和最新的 next）
  if (last.kind === 'layer' && next.kind === 'layer') {
    return { ...last, nextAllIds: next.nextAllIds, nextZIndexMap: next.nextZIndexMap };
  }
  return null;
}

const initialState = {
  past: [] as HistoryCommand[],
  future: [] as HistoryCommand[],
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    pushCommand: (state, action: PayloadAction<HistoryCommand>) => {
      const next = action.payload;
      if (state.past.length > 0) {
        const merged = tryMerge(state.past[state.past.length - 1]!, next);
        if (merged) {
          state.past[state.past.length - 1] = merged;
          state.future = [];
          return;
        }
      }
      state.past.push(next);
      if (state.past.length > MAX_PAST) {
        state.past.shift();
      }
      state.future = [];
    },

    popPastToFuture: (state) => {
      const cmd = state.past.pop();
      if (cmd) state.future.push(cmd);
    },

    popFutureToPast: (state) => {
      const cmd = state.future.pop();
      if (cmd) state.past.push(cmd);
    },
  },
});

export const { pushCommand, popPastToFuture, popFutureToPast } = historySlice.actions;
