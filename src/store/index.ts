import { configureStore } from '@reduxjs/toolkit';
import { clipboardSlice } from './slices/clipboardSlice';
import { componentsSlice } from './slices/componentsSlice';
import { editorSlice } from './slices/editorSlice';
import { selectionSlice } from './slices/selectionSlice';
import { historySlice } from './slices/historySlice';
import type { RootState as RS } from '../types';

import './commands';

export const store = configureStore({
  reducer: {
    components: componentsSlice.reducer,
    selection: selectionSlice.reducer,
    editor: editorSlice.reducer,
    clipboard: clipboardSlice.reducer,
    history: historySlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['history/pushCommand'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = RS;
export type AppDispatch = typeof store.dispatch;

export * from './thunks';
export * from './selectors';
