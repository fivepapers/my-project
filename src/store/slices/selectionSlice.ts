import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SelectionState } from '../../types';
import { setEditorMode } from './editorSlice';

const initialState: SelectionState = {
  selectedIds: [],
  hoveredId: null,
};

export const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    selectComponent: (state, action: PayloadAction<string[]>) => {
      state.selectedIds = action.payload;
    },
    setHovered: (state, action: PayloadAction<string | null>) => {
      state.hoveredId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setEditorMode, (state, action) => {
      if (action.payload === 'preview') {
        state.selectedIds = [];
        state.hoveredId = null;
      }
    });
  },
});

export const { selectComponent, setHovered } = selectionSlice.actions;
