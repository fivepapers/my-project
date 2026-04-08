import { type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { pointerOnCanvas } from '../dragPointer';
import { CANVAS_ID } from '../panels/Canvas';
import { commitAddComponent, commitMoveStyle } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectEditorMode } from '../store/selectors';
import type { ComponentType } from '../types';

function isCanvasDrag(data: unknown): data is { fromCanvas: true; id: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { fromCanvas?: boolean }).fromCanvas === true &&
    typeof (data as { id?: unknown }).id === 'string'
  );
}

function isLibraryDrag(data: unknown, overId: unknown): data is { fromLibrary: true; type: ComponentType } {
  if (overId !== CANVAS_ID) return false;
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { fromLibrary?: boolean }).fromLibrary === true &&
    typeof (data as { type?: unknown }).type === 'string'
  );
}

export function useDragDrop() {
  const dispatch = useAppDispatch();
  const editorMode = useAppSelector(selectEditorMode);
  const isEditMode = editorMode === 'edit';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isEditMode) return;
    const { active, over, delta } = event;
    const data = active.data.current;

    if (isCanvasDrag(data)) {
      dispatch(commitMoveStyle({ id: data.id, delta }));
      return;
    }

    if (!over) return;
    if (!isLibraryDrag(data, over.id)) return;

    const left = Math.max(0, pointerOnCanvas.x - 40);
    const top = Math.max(0, pointerOnCanvas.y - 16);
    dispatch(
      commitAddComponent({
        type: data.type,
        position: { left, top },
      }),
    );
  };

  return { sensors, handleDragEnd };
}
