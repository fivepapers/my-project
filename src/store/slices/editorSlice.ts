import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DeviceType, EditorMode } from '../../types';

export const editorSlice = createSlice({
  name: 'editor',
  initialState: {
    mode: 'edit' as EditorMode,
    device: 'pc' as DeviceType,
    zoom: 1,
    gridVisible: false,
  },
  reducers: {
    setEditorMode: (state, action: PayloadAction<EditorMode>) => {
      state.mode = action.payload;
    },
    setDevice: (state, action: PayloadAction<DeviceType>) => {
      state.device = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    toggleGrid: (state) => {
      state.gridVisible = !state.gridVisible;
    },
  },
});

export const { setEditorMode, setDevice, setZoom, toggleGrid } = editorSlice.actions;
