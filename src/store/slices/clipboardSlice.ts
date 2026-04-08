import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ClipboardState } from '../../types';

type ClipboardSliceState = ClipboardState | null;

const initialState: ClipboardSliceState = null;

export const clipboardSlice = createSlice({
  name: 'clipboard',
  initialState: initialState as ClipboardSliceState,
  reducers: {
    setClipboard: (_state, action: PayloadAction<ClipboardSliceState>) => action.payload,
  },
});

export const { setClipboard } = clipboardSlice.actions;
