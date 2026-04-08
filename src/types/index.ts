import type { ComponentsState } from './Component';
import type { ClipboardState, EditorState, SelectionState } from './Editor';
import type { HistoryState } from './History';

export * from './Component';
export * from './Editor';
export * from './History';

export interface RootState {
  components: ComponentsState;
  selection: SelectionState;
  editor: EditorState;
  clipboard: ClipboardState | null;
  history: HistoryState;
}
